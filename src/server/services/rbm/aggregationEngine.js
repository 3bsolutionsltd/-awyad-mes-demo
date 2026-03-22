/**
 * RBM Aggregation & Reporting Engine
 * Multi-level aggregation: Indicator → Project → Thematic Area → Pillar → Strategy
 * Time-series support: monthly, quarterly, annual
 * Produces donor-grade report payloads.
 */

import { IndicatorEngine } from './indicatorEngine.js';

export class AggregationEngine {
  /**
   * @param {import('../databaseService.js').default} db
   */
  constructor(db) {
    this.db = db;
    this.indicatorEngine = new IndicatorEngine(db);
  }

  // ── Strategic-Level Aggregation ───────────────────────────────────────────

  /**
   * Aggregate all thematic areas under a strategic pillar (core_program_component).
   * @param {string} pillarId - core_program_component_id value (UUID or string key)
   * @param {{ periodStart?: string, periodEnd?: string }} [options]
   */
  async aggregateByStrategicPillar(pillarId, options = {}) {
    const thematicAreas = await this._fetchThematicAreasByPillar(pillarId);

    const areaResults = await Promise.all(
      thematicAreas.map(ta => this.aggregateByThematicArea(ta.id, options))
    );

    return {
      pillarId,
      thematicAreaCount: thematicAreas.length,
      thematicAreas: areaResults,
      summary: this._summarise(areaResults.map(a => a.summary)),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Aggregate all indicators and projects within a thematic area.
   * @param {string} thematicAreaId - UUID
   * @param {{ periodStart?: string, periodEnd?: string }} [options]
   */
  async aggregateByThematicArea(thematicAreaId, options = {}) {
    const [thematicArea, projects, indicators] = await Promise.all([
      this.db.queryOne(`SELECT * FROM thematic_areas WHERE id = $1`, [thematicAreaId]),
      this.db.queryMany(
        `SELECT * FROM projects WHERE thematic_area_id = $1 AND status != 'archived' ORDER BY name`,
        [thematicAreaId]
      ),
      this.indicatorEngine.calculateThematicAreaIndicators(thematicAreaId, options),
    ]);

    const projectResults = await Promise.all(
      projects.map(p => this.aggregateByProject(p.id, options))
    );

    return {
      thematicAreaId,
      thematicAreaName: thematicArea?.name,
      projectCount: projects.length,
      indicators,
      resultsByLevel: this._groupByResultLevel(indicators),
      projects: projectResults,
      summary: this._summarise(indicators),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Aggregate all project indicators for a single project.
   * @param {string} projectId - UUID
   * @param {{ periodStart?: string, periodEnd?: string }} [options]
   */
  async aggregateByProject(projectId, options = {}) {
    const [project, indicatorResults] = await Promise.all([
      this.db.queryOne(`SELECT * FROM projects WHERE id = $1`, [projectId]),
      this.indicatorEngine.calculateProjectIndicators(projectId, options),
    ]);

    return {
      projectId,
      projectName: project?.name,
      indicators: indicatorResults,
      summary: this._summarise(indicatorResults),
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Time-Series Reporting ─────────────────────────────────────────────────

  /**
   * Produce a time-series array for a single indicator.
   * @param {string} indicatorId - UUID
   * @param {'monthly'|'quarterly'|'annual'} [granularity]
   * @param {{ startYear?: number, endYear?: number }} [options]
   */
  async generateTimeSeries(indicatorId, granularity = 'monthly', options = {}) {
    const startYear = options.startYear ?? new Date().getFullYear() - 1;
    const endYear = options.endYear ?? new Date().getFullYear();

    const periods = this._buildPeriods(granularity, startYear, endYear);

    const series = await Promise.all(
      periods.map(async period => {
        const result = await this.indicatorEngine
          .calculateOrganizationalIndicator(indicatorId, {
            periodStart: period.start,
            periodEnd: period.end,
          })
          .catch(() => ({ calculatedValue: null, achievementRate: null }));

        return {
          period: period.label,
          periodStart: period.start,
          periodEnd: period.end,
          value: result.calculatedValue,
          achievementRate: result.achievementRate,
        };
      })
    );

    return {
      indicatorId,
      granularity,
      series,
      trend: this._calculateTrend(series),
    };
  }

  // ── Donor-Grade Report Builder ────────────────────────────────────────────

  /**
   * Build a full donor-grade report across pillars or thematic areas.
   * @param {{
   *   pillarIds?: string[],
   *   thematicAreaIds?: string[],
   *   periodStart?: string,
   *   periodEnd?: string
   * }} [options]
   */
  async buildDonorReport(options = {}) {
    const { pillarIds = [], thematicAreaIds = [], periodStart, periodEnd } = options;
    const filterOptions = { periodStart, periodEnd };

    let aggregations = [];

    if (pillarIds.length > 0) {
      aggregations = await Promise.all(
        pillarIds.map(id => this.aggregateByStrategicPillar(id, filterOptions))
      );
    } else if (thematicAreaIds.length > 0) {
      aggregations = await Promise.all(
        thematicAreaIds.map(id => this.aggregateByThematicArea(id, filterOptions))
      );
    } else {
      const allPillars = await this.db.queryMany(
        `SELECT DISTINCT core_program_component_id AS id
         FROM thematic_areas
         WHERE core_program_component_id IS NOT NULL`
      );
      aggregations = await Promise.all(
        allPillars.map(p => this.aggregateByStrategicPillar(p.id, filterOptions))
      );
    }

    const overallSummary = this._buildOverallSummary(aggregations);

    return {
      reportType: 'donor_grade',
      reportingPeriod: { start: periodStart ?? null, end: periodEnd ?? null },
      generatedAt: new Date().toISOString(),
      overallSummary,
      data: aggregations,
      metadata: {
        totalIndicators: overallSummary.totalIndicators,
        onTrackCount: overallSummary.onTrack,
        atRiskCount: overallSummary.atRisk,
        offTrackCount: overallSummary.offTrack,
      },
    };
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  _groupByResultLevel(indicators) {
    return indicators.reduce((acc, ind) => {
      const level = ind.resultLevel || 'output';
      (acc[level] = acc[level] || []).push(ind);
      return acc;
    }, {});
  }

  _summarise(indicators) {
    const valid = indicators.filter(i => i.achievementRate !== null && i.achievementRate !== undefined);
    if (valid.length === 0) {
      return {
        totalIndicators: indicators.length,
        averageAchievement: null,
        onTrack: 0,
        atRisk: 0,
        offTrack: 0,
      };
    }
    const rates = valid.map(i => i.achievementRate);
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    return {
      totalIndicators: indicators.length,
      averageAchievement: parseFloat(avg.toFixed(2)),
      onTrack: rates.filter(r => r >= 80).length,
      atRisk: rates.filter(r => r >= 50 && r < 80).length,
      offTrack: rates.filter(r => r < 50).length,
    };
  }

  _buildPeriods(granularity, startYear, endYear) {
    const periods = [];

    if (granularity === 'monthly') {
      for (let y = startYear; y <= endYear; y++) {
        for (let m = 1; m <= 12; m++) {
          periods.push({
            label: `${y}-${String(m).padStart(2, '0')}`,
            start: new Date(y, m - 1, 1).toISOString().split('T')[0],
            end: new Date(y, m, 0).toISOString().split('T')[0],
          });
        }
      }
    } else if (granularity === 'quarterly') {
      const quarters = [[1, 3], [4, 6], [7, 9], [10, 12]];
      for (let y = startYear; y <= endYear; y++) {
        quarters.forEach(([sm, em], qi) => {
          periods.push({
            label: `${y}-Q${qi + 1}`,
            start: new Date(y, sm - 1, 1).toISOString().split('T')[0],
            end: new Date(y, em, 0).toISOString().split('T')[0],
          });
        });
      }
    } else {
      // annual
      for (let y = startYear; y <= endYear; y++) {
        periods.push({ label: `${y}`, start: `${y}-01-01`, end: `${y}-12-31` });
      }
    }

    return periods;
  }

  _calculateTrend(series) {
    const values = series.filter(s => s.value !== null).map(s => s.value);
    if (values.length < 2) return 'insufficient_data';
    const first = values[0];
    const last = values[values.length - 1];
    if (last > first * 1.05) return 'increasing';
    if (last < first * 0.95) return 'decreasing';
    return 'stable';
  }

  _buildOverallSummary(aggregations) {
    const allSummaries = aggregations.map(a => a.summary).filter(Boolean);
    const totals = allSummaries.reduce(
      (acc, s) => ({
        totalIndicators: acc.totalIndicators + (s.totalIndicators || 0),
        onTrack: acc.onTrack + (s.onTrack || 0),
        atRisk: acc.atRisk + (s.atRisk || 0),
        offTrack: acc.offTrack + (s.offTrack || 0),
        achievementSum: acc.achievementSum + (s.averageAchievement ?? 0),
        achievementCount: acc.achievementCount + (s.averageAchievement !== null ? 1 : 0),
      }),
      { totalIndicators: 0, onTrack: 0, atRisk: 0, offTrack: 0, achievementSum: 0, achievementCount: 0 }
    );

    return {
      totalIndicators: totals.totalIndicators,
      onTrack: totals.onTrack,
      atRisk: totals.atRisk,
      offTrack: totals.offTrack,
      averageAchievement:
        totals.achievementCount > 0
          ? parseFloat((totals.achievementSum / totals.achievementCount).toFixed(2))
          : null,
    };
  }

  async _fetchThematicAreasByPillar(pillarId) {
    return this.db.queryMany(
      `SELECT * FROM thematic_areas WHERE core_program_component_id = $1 ORDER BY name`,
      [pillarId]
    );
  }
}

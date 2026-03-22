/**
 * IndicatorEngine — Unit Tests
 *
 * Tests the pure computation logic (_compute, calculateOrganizationalIndicator)
 * without touching a real database. The engine accepts `db` via constructor,
 * so we can inject a standard jest mock.
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { IndicatorEngine, CALCULATION_TYPES } from '../../src/server/services/rbm/indicatorEngine.js';

// ── Mock database ─────────────────────────────────────────────────────────────

function makeDb(overrides = {}) {
  return {
    query: jest.fn(),
    queryOne: jest.fn(),
    queryMany: jest.fn(),
    transaction: jest.fn(),
    ...overrides,
  };
}

// ── Helper: build a minimal indicator row ────────────────────────────────────

function makeIndicator(opts = {}) {
  return {
    id: 'ind-001',
    name: 'Test Indicator',
    calculation_type: CALCULATION_TYPES.SUM,
    baseline_value: 0,
    target_value: 100,
    result_level: 'output',
    ...opts,
  };
}

// ── _compute — unit tests ────────────────────────────────────────────────────

describe('IndicatorEngine._compute', () => {
  let engine;

  beforeEach(() => {
    engine = new IndicatorEngine(makeDb());
  });

  describe('SUM', () => {
    it('sums all numeric values', () => {
      const indicator = makeIndicator({ calculation_type: CALCULATION_TYPES.SUM, target_value: 100 });
      const values = [
        { value: '20', validation_status: 'verified' },
        { value: '30', validation_status: 'verified' },
        { value: '50', validation_status: 'pending' },
      ];
      const result = engine._compute(indicator, values);
      // _compute doesn't filter by status; it sums all numeric values
      expect(result.calculatedValue).toBeCloseTo(100);
    });

    it('returns calculatedValue 0 when no values provided', () => {
      const indicator = makeIndicator({ calculation_type: CALCULATION_TYPES.SUM, target_value: 100 });
      const result = engine._compute(indicator, []);
      expect(result.calculatedValue).toBe(0);
    });

    it('calculates achievement rate = (calculatedValue / target) * 100', () => {
      const indicator = makeIndicator({ calculation_type: CALCULATION_TYPES.SUM, target_value: 200 });
      const values = [
        { value: '100', validation_status: 'verified' },
        { value: '100', validation_status: 'verified' },
      ];
      const result = engine._compute(indicator, values);
      expect(result.achievementRate).toBeCloseTo(100);
    });

    it('caps achievement rate at 999.99', () => {
      const indicator = makeIndicator({ calculation_type: CALCULATION_TYPES.SUM, target_value: 1 });
      const values = [{ value: '99999', validation_status: 'verified' }];
      const result = engine._compute(indicator, values);
      expect(result.achievementRate).toBeLessThanOrEqual(999.99);
      expect(result.achievementRate).toBeGreaterThan(0);
    });
  });

  describe('COUNT', () => {
    it('counts the number of non-empty value entries', () => {
      const indicator = makeIndicator({ calculation_type: CALCULATION_TYPES.COUNT, target_value: 3 });
      const values = [
        { value: '1', validation_status: 'verified' },
        { value: '1', validation_status: 'verified' },
        { value: '1', validation_status: 'pending' },
      ];
      const result = engine._compute(indicator, values);
      expect(result.calculatedValue).toBe(3);
    });
  });

  describe('AVG (AVERAGE)', () => {
    it('averages numeric values', () => {
      const indicator = makeIndicator({ calculation_type: CALCULATION_TYPES.AVG, target_value: 50 });
      const values = [
        { value: '10', validation_status: 'verified' },
        { value: '30', validation_status: 'verified' },
        { value: '50', validation_status: 'verified' },
      ];
      const result = engine._compute(indicator, values);
      expect(result.calculatedValue).toBeCloseTo(30);
    });

    it('returns 0 for empty value list', () => {
      const indicator = makeIndicator({ calculation_type: CALCULATION_TYPES.AVG, target_value: 50 });
      const result = engine._compute(indicator, []);
      expect(result.calculatedValue).toBe(0);
    });
  });

  describe('PERCENTAGE', () => {
    it('computes (achieved / target) * 100', () => {
      // Implementation: sums all numeric values as 'achieved', divides by target_value
      const indicator = makeIndicator({
        calculation_type: CALCULATION_TYPES.PERCENTAGE,
        target_value: 80,
      });
      const values = [
        { value: '40', validation_status: 'verified' },
      ];
      const result = engine._compute(indicator, values);
      // achieved=40, target=80 → calculatedValue = (40/80)*100 = 50
      expect(result.calculatedValue).toBeCloseTo(50);
    });
  });

  describe('RATIO', () => {
    it('returns a finite ratio result when numerator/denominator disaggregation is provided', () => {
      // RATIO uses disaggregation_type to split numerator vs denominator
      const indicator = makeIndicator({ calculation_type: CALCULATION_TYPES.RATIO, target_value: 1.5 });
      const values = [
        { value: '3', disaggregation_type: 'numerator', validation_status: 'verified' },
        { value: '2', disaggregation_type: 'denominator', validation_status: 'verified' },
      ];
      const result = engine._compute(indicator, values);
      // numerator=3, denominator=2 → calculatedValue = 1.5
      expect(result.calculatedValue).toBeCloseTo(1.5);
    });

    it('returns null calculatedValue when denominator is 0', () => {
      const indicator = makeIndicator({ calculation_type: CALCULATION_TYPES.RATIO, target_value: 1 });
      const values = [
        { value: '5', disaggregation_type: 'numerator' },
        // no denominator provided → sum 0
      ];
      const result = engine._compute(indicator, values);
      expect(result.calculatedValue).toBeNull();
    });
  });

  describe('CUMULATIVE', () => {
    it('accumulates values over time (same as SUM semantically)', () => {
      const indicator = makeIndicator({ calculation_type: CALCULATION_TYPES.CUMULATIVE, target_value: 150 });
      const values = [
        { value: '50', validation_status: 'verified' },
        { value: '60', validation_status: 'verified' },
      ];
      const result = engine._compute(indicator, values);
      expect(result.calculatedValue).toBeCloseTo(110);
      expect(result.breakdown).toHaveProperty('periodCount', 2);
    });
  });

  describe('achievement rate edge cases', () => {
    it('returns null achievementRate when target is 0', () => {
      const indicator = makeIndicator({
        calculation_type: CALCULATION_TYPES.SUM,
        target_value: 0,
        baseline_value: 0,
      });
      const values = [{ value: '10', validation_status: 'verified' }];
      const result = engine._compute(indicator, values);
      expect(result.achievementRate).toBeNull();
    });

    it('includes resultLevel in the output', () => {
      const indicator = makeIndicator({
        calculation_type: CALCULATION_TYPES.SUM,
        result_level: 'impact',
        target_value: 10,
      });
      const result = engine._compute(indicator, [{ value: '5', validation_status: 'verified' }]);
      expect(result.resultLevel).toBe('impact');
    });

    it('includes computedAt timestamp in output', () => {
      const indicator = makeIndicator({ calculation_type: CALCULATION_TYPES.SUM, target_value: 10 });
      const result = engine._compute(indicator, []);
      expect(typeof result.computedAt).toBe('string');
    });
  });
});

// ── calculateOrganizationalIndicator — DB integration path ──────────────────

describe('IndicatorEngine.calculateOrganizationalIndicator', () => {
  it('calls db.queryOne for indicator and db.queryMany for values', async () => {
    const db = makeDb({
      queryOne: jest.fn().mockResolvedValue(makeIndicator({ target_value: 50 })),
      queryMany: jest.fn().mockResolvedValue([
        { value: '25', validation_status: 'verified' },
        { value: '25', validation_status: 'verified' },
      ]),
    });
    const engine = new IndicatorEngine(db);
    const result = await engine.calculateOrganizationalIndicator('ind-001');

    expect(db.queryOne).toHaveBeenCalledTimes(1);
    expect(db.queryMany).toHaveBeenCalledTimes(1);
    expect(result.calculatedValue).toBeCloseTo(50);
    expect(result.achievementRate).toBeCloseTo(100);
  });

  it('throws when indicator is not found', async () => {
    const db = makeDb({
      queryOne: jest.fn().mockResolvedValue(null),
      queryMany: jest.fn(),
    });
    const engine = new IndicatorEngine(db);
    await expect(engine.calculateOrganizationalIndicator('nonexistent')).rejects.toThrow();
  });
});

// ── CALCULATION_TYPES constant ───────────────────────────────────────────────

describe('CALCULATION_TYPES', () => {
  it('exports the expected keys', () => {
    expect(CALCULATION_TYPES).toMatchObject({
      SUM: expect.any(String),
      COUNT: expect.any(String),
      AVG: expect.any(String),
      RATIO: expect.any(String),
      PERCENTAGE: expect.any(String),
      CUMULATIVE: expect.any(String),
    });
  });
});

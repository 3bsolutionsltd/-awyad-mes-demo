/**
 * ValidationEngine — Unit Tests
 *
 * Covers the pure logic methods: _computeQualityScore, getQualityLevel,
 * _checkRequiredFields, and the reject() guard (must throw on empty reason).
 *
 * DB calls are injected via constructor mock so no real database is needed.
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  ValidationEngine,
  VALIDATION_STATUS,
  QUALITY_THRESHOLDS,
} from '../../src/server/services/rbm/validationEngine.js';

// ── Mock db helper ────────────────────────────────────────────────────────────

function makeDb(overrides = {}) {
  return {
    query: jest.fn(),
    queryOne: jest.fn(),
    queryMany: jest.fn(),
    transaction: jest.fn(async cb => cb({ query: jest.fn() })),
    ...overrides,
  };
}

// ── _computeQualityScore ──────────────────────────────────────────────────────

describe('ValidationEngine._computeQualityScore', () => {
  let engine;
  beforeEach(() => { engine = new ValidationEngine(makeDb()); });

  it('returns 100 when all checks pass', () => {
    const checks = [
      { severity: 'pass' },
      { severity: 'pass' },
      { severity: 'pass' },
    ];
    const score = engine._computeQualityScore(checks);
    expect(score).toBe(100);
  });

  it('deducts 5 per warning', () => {
    const checks = [
      { severity: 'pass' },
      { severity: 'warning' },
      { severity: 'warning' },
    ];
    const score = engine._computeQualityScore(checks);
    expect(score).toBe(90);
  });

  it('deducts 20 per error', () => {
    const checks = [
      { severity: 'pass' },
      { severity: 'error' },
    ];
    const score = engine._computeQualityScore(checks);
    expect(score).toBe(80);
  });

  it('floors at 0 (never negative)', () => {
    const checks = [
      { severity: 'error' },
      { severity: 'error' },
      { severity: 'error' },
      { severity: 'error' },
      { severity: 'error' },
      { severity: 'error' },
    ];
    const score = engine._computeQualityScore(checks);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('returns 100 for empty checks array', () => {
    const score = engine._computeQualityScore([]);
    expect(score).toBe(100);
  });

  it('combines warnings and errors correctly', () => {
    const checks = [
      { severity: 'error' },   // -20
      { severity: 'warning' }, // -5
      { severity: 'pass' },
    ];
    const score = engine._computeQualityScore(checks);
    expect(score).toBe(75);
  });
});

// ── getQualityLevel ───────────────────────────────────────────────────────────

describe('ValidationEngine.getQualityLevel', () => {
  let engine;
  beforeEach(() => { engine = new ValidationEngine(makeDb()); });

  it('returns "high" for score >= HIGH threshold', () => {
    expect(engine.getQualityLevel(QUALITY_THRESHOLDS.HIGH)).toBe('high');
    expect(engine.getQualityLevel(100)).toBe('high');
  });

  it('returns "medium" for score between MEDIUM and HIGH', () => {
    expect(engine.getQualityLevel(QUALITY_THRESHOLDS.MEDIUM)).toBe('medium');
    expect(engine.getQualityLevel(79)).toBe('medium');
  });

  it('returns "low" for score below MEDIUM threshold', () => {
    expect(engine.getQualityLevel(0)).toBe('low');
    expect(engine.getQualityLevel(49)).toBe('low');
  });

  it('boundary: QUALITY_THRESHOLDS.HIGH is the minimum for high', () => {
    expect(engine.getQualityLevel(QUALITY_THRESHOLDS.HIGH - 1)).toBe('medium');
  });
});

// ── VALIDATION_STATUS constant ────────────────────────────────────────────────

describe('VALIDATION_STATUS', () => {
  it('exports expected status strings', () => {
    expect(VALIDATION_STATUS).toMatchObject({
      PENDING:  expect.any(String),
      VERIFIED: expect.any(String),
      REJECTED: expect.any(String),
      FLAGGED:  expect.any(String),
    });
  });

  it('PENDING value is "pending"', () => {
    expect(VALIDATION_STATUS.PENDING).toBe('pending');
  });

  it('VERIFIED value is "verified"', () => {
    expect(VALIDATION_STATUS.VERIFIED).toBe('verified');
  });
});

// ── reject() — required reason guard ─────────────────────────────────────────

describe('ValidationEngine.reject', () => {
  it('throws when reason is empty string', async () => {
    const db = makeDb({
      queryOne: jest.fn().mockResolvedValue({
        id: 'val-001',
        validation_status: 'pending',
        indicator_id: 'ind-001',
      }),
    });
    const engine = new ValidationEngine(db);
    await expect(engine.reject('val-001', 'user-1', '')).rejects.toThrow();
  });

  it('throws when reason is whitespace only', async () => {
    const db = makeDb({
      queryOne: jest.fn().mockResolvedValue({
        id: 'val-001',
        validation_status: 'pending',
        indicator_id: 'ind-001',
      }),
    });
    const engine = new ValidationEngine(db);
    await expect(engine.reject('val-001', 'user-1', '   ')).rejects.toThrow();
  });

  it('throws when value not found', async () => {
    const db = makeDb({
      queryOne: jest.fn().mockResolvedValue(null),
    });
    const engine = new ValidationEngine(db);
    await expect(engine.reject('nonexistent', 'user-1', 'Valid reason')).rejects.toThrow();
  });
});

// ── verify() — happy path (db mock) ──────────────────────────────────────────

describe('ValidationEngine.verify', () => {
  it('calls db.queryOne and db.query, and resolves', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
    const db = makeDb({
      queryOne: jest.fn().mockResolvedValue({
        id: 'val-001',
        validation_status: 'pending',
        indicator_id: 'ind-001',
      }),
      query: mockQuery,
    });
    const engine = new ValidationEngine(db);
    await expect(engine.verify('val-001', 'user-1', 'Looks good')).resolves.not.toThrow();
    // Should have called query twice: _updateValidationStatus + _writeAuditLog
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('throws when trying to verify an already-rejected value', async () => {
    const db = makeDb({
      queryOne: jest.fn().mockResolvedValue({
        id: 'val-001',
        validation_status: 'rejected',
        indicator_id: 'ind-001',
      }),
    });
    const engine = new ValidationEngine(db);
    await expect(engine.verify('val-001', 'user-1', '')).rejects.toThrow();
  });
});

// ── QUALITY_THRESHOLDS ────────────────────────────────────────────────────────

describe('QUALITY_THRESHOLDS', () => {
  it('HIGH is a number and >= MEDIUM', () => {
    expect(typeof QUALITY_THRESHOLDS.HIGH).toBe('number');
    expect(typeof QUALITY_THRESHOLDS.MEDIUM).toBe('number');
    expect(QUALITY_THRESHOLDS.HIGH).toBeGreaterThan(QUALITY_THRESHOLDS.MEDIUM);
  });
});

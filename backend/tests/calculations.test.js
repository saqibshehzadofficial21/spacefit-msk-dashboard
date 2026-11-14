import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adherencePercent, difference, percentChange, trend } from '../src/utils/calculations.js';
import { analyseAstronaut } from '../src/analysis/ruleEngine.js';
import { PERFORMANCE_METRICS } from '../src/analysis/metricCatalog.js';

test('adherence handles zero prescribed sessions without NaN', () => {
  assert.equal(adherencePercent(0, 0), null);
  assert.equal(adherencePercent(9, 10), 90);
});

test('baseline difference and percentage change follow the brief formulas', () => {
  assert.equal(difference(108, 120), -12);
  assert.equal(percentChange(108, 120), -10);
});

test('zero or missing baseline never produces an invalid percentage', () => {
  assert.equal(percentChange(5, 0), null);
  assert.equal(percentChange(5, null), null);
  assert.equal(difference(5, undefined), null);
});

test('trend detects a falling series and needs at least three points', () => {
  assert.equal(trend([10, 9]).direction, 'insufficient-data');
  assert.equal(trend([10, 9, 8, 7]).direction, 'falling');
  assert.equal(trend([5, 5, 5, 5]).direction, 'stable');
});

const settings = {
  thresholds: {
    forceProduction: { percentChange: -10 }, movementVelocity: { percentChange: -10 }, jointROM: { percentChange: -10 },
    repetitionPerformance: { percentChange: -15 }, movementConsistency: { pointsChange: -5 }, functionalScore: { percentChange: -10 },
    loadingChange: { percentChange: 15 }, adherence: { minimumPercent: 80, windowDays: 14, consecutiveMissedSessions: 3 },
    persistentAssessments: 3,
  },
};

const astronaut = { id: 'AST-900' };
const baseline = { id: 'BAS-1', astronautId: 'AST-900', assessmentDate: '2026-01-01T00:00:00.000Z', missionPhase: 'preflight', forceProduction: 120 };
const perf = (i, value) => ({ id: `PRF-${i}`, astronautId: 'AST-900', assessmentDate: `2026-03-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`, missionPhase: 'in-flight', forceProduction: value });

test('rule engine flags a persistent decline against the individual baseline and escalates to specialist review', () => {
  const performance = [perf(0, 118), perf(1, 107), perf(2, 106), perf(3, 104)];
  const { insights, alerts } = analyseAstronaut({ astronaut, baselines: [baseline], performance, exercises: [], sensors: [], settings, runId: 'RUN-T' });
  const force = insights.find((i) => i.metricKey === 'forceProduction');
  assert.equal(force.severity, 'critical');
  assert.equal(force.percentChange, -13.3);
  assert.ok(alerts.some((a) => a.category === 'performance-change'));
  assert.ok(alerts.some((a) => a.category === 'specialist-review'));
  assert.ok(force.explanation.includes('does not identify a cause'), 'explanation must not imply a diagnosis');
});

test('rule engine never compares against another astronaut and skips metrics without a baseline', () => {
  const otherBaseline = { ...baseline, id: 'BAS-2', astronautId: 'AST-901', forceProduction: 50 };
  const { insights } = analyseAstronaut({ astronaut, baselines: [otherBaseline], performance: [perf(0, 100)], exercises: [], sensors: [], settings, runId: 'RUN-T' });
  const force = insights.find((i) => i.metricKey === 'forceProduction');
  assert.equal(force.baselineValue, null);
  assert.equal(force.severity, 'info');
});

test('metric catalogue marks movement consistency as a points metric', () => {
  assert.equal(PERFORMANCE_METRICS.movementConsistency.kind, 'points');
});

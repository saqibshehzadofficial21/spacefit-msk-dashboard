#!/usr/bin/env node
/**
 * Regenerates ALL demonstration JSON data in backend/data (or DATA_DIR).
 * Every astronaut, mission and measurement produced here is FICTIONAL and is labelled
 * dataSource: 'simulated'. Run with: npm run seed (from the backend folder).
 * WARNING: this overwrites existing records in the data directory.
 */
import { COLLECTIONS, DEFAULT_SETTINGS } from '../src/config/storageConfig.js';
import { writeCollection, initialiseStorage } from '../src/storage/jsonStorage.js';
import { runAnalysis } from '../src/services/insightService.js';
import { generateReport } from '../src/services/reportService.js';
import { PERFORMANCE_METRICS } from '../src/analysis/metricCatalog.js';
import { nowIso } from '../src/utils/ids.js';

// Deterministic PRNG so the demo data is reproducible.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261114);
const jitter = (base, pct) => base * (1 + (rand() - 0.5) * 2 * pct);
const r2 = (v) => Math.round(v * 100) / 100;
const day = (iso, offsetDays) => new Date(new Date(iso).getTime() + offsetDays * 86400000);
const at = (date, hour) => { const d = new Date(date); d.setUTCHours(hour, Math.floor(rand() * 60), 0, 0); return d.toISOString(); };
const dateOnly = (d) => d.toISOString().slice(0, 10);
const SIM = 'simulated';

// ---------- Missions (fictional) ----------
const missions = [
  { id: 'MSN-DEMO-A', code: 'DEMO-A', name: 'Demonstration Mission A (fictional)', startDate: '2026-03-02T00:00:00.000Z', endDate: '2026-08-15T00:00:00.000Z', status: 'completed', dataSource: SIM },
  { id: 'MSN-DEMO-B', code: 'DEMO-B', name: 'Demonstration Mission B (fictional)', startDate: '2026-06-01T00:00:00.000Z', endDate: null, status: 'active', dataSource: SIM },
];
const PHASE_WINDOWS = {
  'MSN-DEMO-A': { preflight: ['2026-01-05', '2026-03-01'], 'in-flight': ['2026-03-02', '2026-06-30'], postflight: ['2026-07-01', '2026-08-15'] },
  'MSN-DEMO-B': { preflight: ['2026-04-01', '2026-05-31'], 'in-flight': ['2026-06-01', '2026-10-15'], postflight: ['2026-10-16', '2026-11-10'] },
};
const windowDays = ([s, e]) => Math.round((new Date(e) - new Date(s)) / 86400000);

// ---------- Astronauts (fictional, demonstration only) ----------
const ASTRONAUTS = [
  { id: 'AST-001', name: 'Ren Whitfield', missionId: 'MSN-DEMO-A', missionPhase: 'postflight', status: 'active', notes: 'DEMONSTRATION RECORD. Scripted pattern: gradual in-flight force decline, used to exercise the alert workflow.', profile: { force: 1, adherence: 0.92, decline: 0.15 } },
  { id: 'AST-002', name: 'Mira Castellan', missionId: 'MSN-DEMO-A', missionPhase: 'postflight', status: 'active', notes: 'DEMONSTRATION RECORD. Scripted pattern: post-mission follow-up with partial recovery.', profile: { force: 1.02, adherence: 0.9, decline: 0.08 } },
  { id: 'AST-003', name: 'Tobias Lindqvist', missionId: 'MSN-DEMO-B', missionPhase: 'postflight', status: 'active', notes: 'DEMONSTRATION RECORD. Scripted pattern: low adherence with a run of missed sessions.', profile: { force: 0.97, adherence: 0.7, decline: 0.0 } },
  { id: 'AST-004', name: 'Priya Raman', missionId: 'MSN-DEMO-B', missionPhase: 'preflight', status: 'active', notes: 'DEMONSTRATION RECORD. Preflight baseline only.', profile: { force: 1.05, adherence: 0.95, decline: 0 } },
].map((a) => ({
  ...a,
  initials: a.name.split(' ').map((p) => p[0]).join(''),
  createdAt: '2026-01-05T08:00:00.000Z',
  updatedAt: '2026-01-05T08:00:00.000Z',
  dataSource: SIM,
}));

const baselineAssessments = [];
const performanceAssessments = [];
const exerciseRecords = [];
const sensorMeasurements = [];
let seq = 0;
const nid = (p) => `${p}-${String(++seq).padStart(4, '0')}`;

for (const a of ASTRONAUTS) {
  const win = PHASE_WINDOWS[a.missionId];
  const basePhase = { force: jitter(120, 0.05) * a.profile.force, velocity: jitter(0.85, 0.04), rom: jitter(135, 0.04), reps: 10, consistency: jitter(92, 0.02), functional: jitter(80, 0.04) };

  // Preflight baseline (individual reference for this astronaut only)
  const baselineDate = dateOnly(day(win.preflight[0], 10));
  const base = {
    id: nid('BAS'), astronautId: a.id, assessmentDate: `${baselineDate}T09:00:00.000Z`, missionPhase: 'preflight', exerciseSessionId: null,
    forceProduction: r2(basePhase.force), movementVelocity: r2(basePhase.velocity), jointROM: r2(basePhase.rom), repetitionPerformance: basePhase.reps,
    movementConsistency: r2(basePhase.consistency), functionalScore: r2(basePhase.functional), functionalResult: 'completed',
    notes: 'Preflight baseline (demonstration record)', dataSource: SIM, createdAt: nowIso(), updatedAt: nowIso(),
  };
  baselineAssessments.push(base);

  // Performance assessments across phases
  const perfPlan = [
    ...[0, 1].map((i) => ({ phase: 'preflight', date: day(win.preflight[0], 20 + i * 14), k: 0 })),
    ...Array.from({ length: 7 }, (_, i) => ({ phase: 'in-flight', date: day(win['in-flight'][0], 10 + i * 13), k: (i + 1) / 7 })),
    ...Array.from({ length: 3 }, (_, i) => ({ phase: 'postflight', date: day(win.postflight[0], 5 + i * 14), k: (i + 1) / 3 })),
  ];
  if (a.id === 'AST-004') perfPlan.splice(0, perfPlan.length, ...perfPlan.filter((p) => p.phase === 'preflight'));
  for (const p of perfPlan) {
    // In-flight: scripted decline (ramps to full decline by ~2/3 of the phase). Postflight AST-002: partial recovery toward baseline.
    // Postflight: AST-001 decline persists (not recovered); AST-002 recovers toward baseline; others unchanged.
    const drift = p.phase === 'in-flight'
      ? -a.profile.decline * Math.min(1, p.k * 1.5)
      : p.phase === 'postflight' ? (a.id === 'AST-001' ? -a.profile.decline : a.id === 'AST-002' ? -0.08 * (1 - p.k) : 0) : 0;
    const f = basePhase.force * (1 + drift) * (1 + (rand() - 0.5) * 0.03);
    const v = basePhase.velocity * (1 + drift * 0.8) * (1 + (rand() - 0.5) * 0.03);
    const romV = basePhase.rom * (1 + drift * 0.5) * (1 + (rand() - 0.5) * 0.02);
    performanceAssessments.push({
      id: nid('PRF'), astronautId: a.id, assessmentDate: at(dateOnly(p.date), 9), missionPhase: p.phase, exerciseSessionId: null,
      forceProduction: r2(f), movementVelocity: r2(v), jointROM: r2(romV),
      repetitionPerformance: Math.max(6, Math.round(10 + drift * 10 + (rand() - 0.5) * 1.5)),
      movementConsistency: r2(Math.min(99, basePhase.consistency * (1 + drift * 0.2) + (rand() - 0.5) * 1)),
      functionalScore: r2(basePhase.functional * (1 + drift * 0.6)),
      functionalResult: drift < -0.06 ? 'partially-completed' : 'completed',
      notes: 'Demonstration performance assessment (simulated)', dataSource: SIM, createdAt: nowIso(), updatedAt: nowIso(),
    });
  }

  // Exercise sessions: prescribed on 3 of every 7 days, plus occasional unplanned functional sessions
  const start = new Date(win.preflight[0]);
  const end = new Date(win.postflight[1]);
  const CATS = ['resistance-training', 'treadmill', 'resistance-training', 'cycle-ergometer', 'resistance-training', 'functional'];
  let sessionIndex = 0;
  for (let d = new Date(start); d <= end; d = day(dateOnly(d), 1)) {
    const phase = Object.entries(win).find(([, [s, e]]) => dateOnly(d) >= s && dateOnly(d) <= e)?.[0];
    if (!phase) continue;
    if (a.id === 'AST-004' && phase !== 'preflight') continue; // preflight-only astronaut in this demo
    const dayIdx = Math.round((d - start) / 86400000);
    const prescribed = dayIdx % 7 === 0 || dayIdx % 7 === 2 || dayIdx % 7 === 4;
    const unplanned = !prescribed && rand() < 0.04;
    if (!prescribed && !unplanned) continue;
    sessionIndex += 1;
    const category = CATS[sessionIndex % CATS.length];
    // Scripted missed run for AST-003 in-flight
    const forcedMiss = a.id === 'AST-003' && phase === 'in-flight' && dayIdx >= 75 && dayIdx <= 81 && prescribed;
    const roll = rand();
    let completionStatus = 'completed';
    if (forcedMiss || (prescribed && roll > a.profile.adherence + 0.05)) completionStatus = 'missed';
    else if (roll > 0.97) completionStatus = 'partial';
    if (!prescribed && completionStatus === 'missed') continue;

    const equipment = category === 'resistance-training' ? (rand() < 0.6 ? 'ARED' : 'ROCKY')
      : category === 'treadmill' ? 'TREADMILL' : category === 'cycle-ergometer' ? 'CEVIS' : 'NONE';
    const done = completionStatus !== 'missed';
    const sessionId = nid('EXR');
    const sessionDate = at(dateOnly(d), 7 + (sessionIndex % 6));
    const rec = {
      id: sessionId, astronautId: a.id, sessionDate, missionPhase: phase, category, equipment, prescribed,
      completionStatus,
      durationMinutes: done ? r2(jitter(category === 'cycle-ergometer' ? 45 : 40, 0.15)) : null,
      resistanceKg: null, sets: null, repetitions: null, speedKph: null, harnessLoadN: null, workloadW: null, distanceKm: null, movementPerformanceScore: null,
      notes: prescribed ? 'Prescribed demonstration session (simulated)' : 'Unplanned demonstration session (simulated)',
      dataSource: SIM, createdAt: nowIso(), updatedAt: nowIso(),
    };
    if (done) {
      if (category === 'resistance-training') {
        Object.assign(rec, { resistanceKg: r2(jitter(equipment === 'ARED' ? 90 : 25, 0.1)), sets: 3, repetitions: Math.round(jitter(10, 0.15)) });
      } else if (category === 'treadmill') {
        Object.assign(rec, { speedKph: r2(jitter(9, 0.1)), harnessLoadN: r2(jitter(350, 0.1)) });
      } else if (category === 'cycle-ergometer') {
        Object.assign(rec, { workloadW: Math.round(jitter(110, 0.12)), distanceKm: r2(jitter(8, 0.2)) });
      } else {
        Object.assign(rec, { movementPerformanceScore: r2(jitter(75, 0.1)) });
      }
    }
    exerciseRecords.push(rec);

    // Sensor readings for completed sessions: force, pressure, IMU velocity and joint angle
    if (done) {
      const driftNow = phase === 'in-flight' ? -a.profile.decline * (dayIdx / 90) : 0;
      const common = { astronautId: a.id, missionPhase: phase, exerciseSessionId: sessionId, sourceType: 'sample-import', dataSource: SIM, createdAt: nowIso(), updatedAt: nowIso() };
      const ts = at(dateOnly(d), 8);
      sensorMeasurements.push(
        { id: nid('SEN'), ...common, sensorType: 'FORCE', metric: 'appliedForce', value: r2(jitter(120, 0.03) * (1 + driftNow)), unit: 'N', timestamp: ts, notes: 'Sample force reading (fictional)' },
        { id: nid('SEN'), ...common, sensorType: 'PRESSURE', metric: 'peakPressure', value: r2(jitter(220, 0.04)), unit: 'kPa', timestamp: ts, notes: 'Sample insole reading (fictional)' },
        { id: nid('SEN'), ...common, sensorType: 'PRESSURE', metric: 'loadBalance', value: r2(jitter(50, 0.03)), unit: '%', timestamp: ts, notes: 'Sample insole reading (fictional)' },
        { id: nid('SEN'), ...common, sensorType: 'IMU', metric: 'movementVelocity', value: r2(jitter(0.85, 0.05) * (1 + driftNow * 0.8)), unit: 'm/s', timestamp: ts, notes: 'Sample IMU reading (fictional)' },
        { id: nid('SEN'), ...common, sensorType: 'IMU', metric: 'jointAngle', value: r2(jitter(135, 0.03)), unit: 'degrees', timestamp: ts, notes: 'Sample IMU reading (fictional)' },
      );
    }
  }
}

// Unit lookup for sensor rows already set above; sanity check that every metric exists in the catalogue.
const knownPerf = Object.keys(PERFORMANCE_METRICS);
if (!knownPerf.includes('forceProduction')) throw new Error('Metric catalogue mismatch');

const users = [
  { id: 'USR-ADM-01', name: 'Demo Administrator', role: 'administrator', description: 'Full prototype access, including astronaut deletion, mission management and settings.', dataSource: SIM },
  { id: 'USR-SPC-01', name: 'Demo Medical Specialist', role: 'medical-specialist', description: 'Records, baselines, alert review and specialist notes. Cannot delete astronauts or change thresholds.', dataSource: SIM },
  { id: 'USR-AST-01', name: 'Demo Astronaut View', role: 'astronaut', description: 'Read access and self-logged exercise records. Cannot review alerts or change analysis thresholds.', dataSource: SIM },
];

async function main() {
  console.log('[seed] resetting demonstration collections');
  for (const key of Object.keys(COLLECTIONS)) {
    await writeCollection(key, COLLECTIONS[key].type === 'array' ? [] : structuredClone(DEFAULT_SETTINGS));
  }
  await writeCollection('missions', missions);
  await writeCollection('astronauts', ASTRONAUTS);
  await writeCollection('baselineAssessments', baselineAssessments);
  await writeCollection('performanceAssessments', performanceAssessments);
  await writeCollection('exerciseRecords', exerciseRecords);
  await writeCollection('sensorMeasurements', sensorMeasurements);
  await writeCollection('users', users);
  await writeCollection('settings', structuredClone(DEFAULT_SETTINGS));
  await writeCollection('auditLogs', [{ id: 'AUD-SEED', timestamp: nowIso(), role: 'system', action: 'seed', entity: 'all', entityId: '-', summary: 'Demonstration data generated (fictional, simulated)' }]);
  await writeCollection('reports', []);

  await initialiseStorage();
  const analysis = await runAnalysis(null);
  console.log('[seed] analysis:', JSON.stringify({ insights: analysis.insightsCreated, alerts: analysis.alertsCreated }));
  for (const reportType of ['exercise-adherence', 'muscle-performance', 'adaptive-insights']) {
    await generateReport({ reportType, astronautId: null, missionId: null, missionPhase: 'all', startDate: null, endDate: null, equipment: 'all', category: 'all', metric: 'all', title: null }, 'system');
  }
  console.log(`[seed] done: ${ASTRONAUTS.length} astronauts, ${exerciseRecords.length} exercise records, ${sensorMeasurements.length} sensor records, ${performanceAssessments.length} performance assessments, ${baselineAssessments.length} baselines`);
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});

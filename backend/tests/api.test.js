/**
 * Integration tests against a temporary data directory. Nothing touches backend/data.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'msk-test-'));
process.env.DATA_DIR = tmp;
process.env.NODE_ENV = 'test';

const { createApp } = await import('../src/app.js');
const { initialiseStorage } = await import('../src/storage/jsonStorage.js');

let server;
let base;
const call = async (method, url, { role = 'administrator', body } = {}) => {
  const res = await fetch(`${base}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-demo-role': role },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, json, text };
};

before(async () => {
  await initialiseStorage();
  await fs.writeFile(path.join(tmp, 'missions.json'), JSON.stringify([
    { id: 'MSN-T', code: 'T-1', name: 'Test mission (fictional)', startDate: '2026-01-01T00:00:00.000Z', endDate: null, status: 'active', dataSource: 'simulated' },
  ]));
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await new Promise((r) => server.close(r));
  await fs.rm(tmp, { recursive: true, force: true });
});

test('health endpoint reports storage status', async () => {
  const r = await fetch(`${base.replace('/api', '')}/api/health`);
  const json = await r.json();
  assert.equal(r.status, 200);
  assert.equal(json.data.status, 'ok');
});

let astronautId;
test('creates an astronaut with a sequential ID, manual data source and sanitised name', async () => {
  const r = await call('POST', '/astronauts', { role: 'medical-specialist', body: { name: '<script>Test</script> Person', missionId: 'MSN-T' } });
  assert.equal(r.status, 201);
  assert.equal(r.json.data.id, 'AST-001');
  assert.equal(r.json.data.dataSource, 'manual');
  assert.ok(!r.json.data.name.includes('<'));
  astronautId = r.json.data.id;
});

test('rejects invalid input with a 400 and field-level details', async () => {
  const r = await call('POST', '/astronauts', { body: { name: 'X', missionId: 'MSN-T' } });
  assert.equal(r.status, 400);
  assert.equal(r.json.success, false);
  assert.ok(r.json.details.some((d) => d.startsWith('name')));
});

test('an unknown mission is rejected rather than saved', async () => {
  const r = await call('POST', '/astronauts', { body: { name: 'Valid Name', missionId: 'MSN-NOPE' } });
  assert.equal(r.status, 400);
});

test('astronaut role cannot delete astronauts; administrator can', async () => {
  const denied = await call('DELETE', `/astronauts/${astronautId}`, { role: 'astronaut' });
  assert.equal(denied.status, 403);
  const created = await call('POST', '/astronauts', { body: { name: 'Temp Person', missionId: 'MSN-T' } });
  const ok = await call('DELETE', `/astronauts/${created.json.data.id}`, { role: 'administrator' });
  assert.equal(ok.status, 200);
});

test('baseline assessments are stored per astronaut and must include at least one value', async () => {
  const empty = await call('POST', '/baselines', { role: 'medical-specialist', body: { astronautId, assessmentDate: '2026-01-10', missionPhase: 'preflight' } });
  assert.equal(empty.status, 400);
  const ok = await call('POST', '/baselines', { role: 'medical-specialist', body: { astronautId, assessmentDate: '2026-01-10', missionPhase: 'preflight', forceProduction: 120, movementVelocity: 0.9 } });
  assert.equal(ok.status, 201);
  assert.equal(ok.json.data.jointROM, null, 'unmeasured metrics are null, never zero');
});

test('exercise equipment must match its category', async () => {
  const bad = await call('POST', '/exercises', { body: { astronautId, sessionDate: '2026-02-01', missionPhase: 'in-flight', category: 'treadmill', equipment: 'ARED', completionStatus: 'completed' } });
  assert.equal(bad.status, 400);
  const good = await call('POST', '/exercises', { body: { astronautId, sessionDate: '2026-02-01', missionPhase: 'in-flight', category: 'treadmill', equipment: 'TREADMILL', completionStatus: 'completed', speedKph: 8, durationMinutes: 30 } });
  assert.equal(good.status, 201);
  assert.equal(good.json.data.dataSource, 'manual');
});

test('sensor records take their unit from the catalogue and reject unsupported metric/sensor pairs', async () => {
  const bad = await call('POST', '/sensors', { role: 'medical-specialist', body: { astronautId, sensorType: 'FORCE', metric: 'peakPressure', value: 10, timestamp: '2026-02-02T08:00:00Z', missionPhase: 'in-flight' } });
  assert.equal(bad.status, 400);
  const ok = await call('POST', '/sensors', { role: 'medical-specialist', body: { astronautId, sensorType: 'FORCE', metric: 'appliedForce', value: 118, timestamp: '2026-02-02T08:00:00Z', missionPhase: 'in-flight' } });
  assert.equal(ok.status, 201);
  assert.equal(ok.json.data.unit, 'N');
});

test('sample import saves valid rows as SIMULATED and rejects bad rows individually', async () => {
  const csv = 'timestamp,sensorType,metric,value,missionPhase\n2026-02-03T08:00:00Z,PRESSURE,peakPressure,215,in-flight\n2026-02-03T08:05:00Z,PRESSURE,bogus,1,in-flight';
  const r = await call('POST', '/sensors/import', { role: 'medical-specialist', body: { astronautId, csv } });
  assert.equal(r.status, 201);
  assert.equal(r.json.data.imported, 1);
  assert.equal(r.json.data.rejected, 1);
  const list = await call('GET', `/sensors?astronautId=${astronautId}&pageSize=50`);
  assert.ok(list.json.data.every((s) => s.dataSource === 'manual' || s.dataSource === 'simulated'));
  assert.ok(list.json.data.some((s) => s.dataSource === 'simulated'));
});

test('analysis creates insights and alerts; re-running never duplicates alerts', async () => {
  await call('POST', '/performance', { role: 'medical-specialist', body: { astronautId, assessmentDate: '2026-03-01', missionPhase: 'in-flight', forceProduction: 100 } });
  await call('POST', '/performance', { role: 'medical-specialist', body: { astronautId, assessmentDate: '2026-03-08', missionPhase: 'in-flight', forceProduction: 98 } });
  await call('POST', '/performance', { role: 'medical-specialist', body: { astronautId, assessmentDate: '2026-03-15', missionPhase: 'in-flight', forceProduction: 95 } });
  const first = await call('POST', '/insights/analyse', { role: 'medical-specialist', body: {} });
  assert.equal(first.status, 201);
  const alertsA = (await call('GET', '/alerts?pageSize=200')).json.meta.total;
  await call('POST', '/insights/analyse', { role: 'medical-specialist', body: {} });
  const alertsB = (await call('GET', '/alerts?pageSize=200')).json.meta.total;
  assert.equal(alertsB, alertsA, 'duplicate alerts must be skipped');
  const insight = (await call('GET', `/insights?astronautId=${astronautId}&category=performance-change`)).json.data.find((i) => i.metricName === 'Force production');
  assert.ok(insight);
  assert.equal(insight.dataSource, 'ai-generated');
  assert.equal(insight.source, 'rule-engine');
});

test('report generation stores a snapshot and exports CSV and PDF', async () => {
  const gen = await call('POST', '/reports/generate', { role: 'medical-specialist', body: { reportType: 'muscle-performance', astronautId } });
  assert.equal(gen.status, 201);
  const id = gen.json.data.id;
  const csv = await fetch(`${base}/reports/${id}/export?format=csv`, { headers: { 'x-demo-role': 'administrator' } });
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('content-type'), /text\/csv/);
  const pdf = await fetch(`${base}/reports/${id}/export?format=pdf`, { headers: { 'x-demo-role': 'administrator' } });
  assert.equal(pdf.status, 200);
  const bytes = Buffer.from(await pdf.arrayBuffer());
  assert.equal(bytes.subarray(0, 4).toString(), '%PDF');
});

test('corrupted JSON returns a storage error and is never overwritten', async () => {
  const file = path.join(tmp, 'exerciseRecords.json');
  await fs.writeFile(file, '{ this is not json');
  const r = await call('GET', '/exercises');
  assert.equal(r.status, 500);
  assert.equal(r.json.error, 'CORRUPT_JSON');
  const write = await call('POST', '/exercises', { body: { astronautId, sessionDate: '2026-02-05', missionPhase: 'in-flight', category: 'functional', equipment: 'NONE', completionStatus: 'completed' } });
  assert.equal(write.status, 500, 'writes must fail when storage is corrupt');
  assert.equal(await fs.readFile(file, 'utf8'), '{ this is not json', 'corrupt file must be left untouched');
  await fs.writeFile(file, '[]');
});

test('records persist on disk in JSON form and survive a fresh read', async () => {
  const raw = JSON.parse(await fs.readFile(path.join(tmp, 'astronauts.json'), 'utf8'));
  assert.ok(raw.some((a) => a.id === astronautId));
});

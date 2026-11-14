import { readCollection, transact } from '../storage/jsonStorage.js';
import { makeId, nowIso } from '../utils/ids.js';
import { notFound } from '../utils/AppError.js';
import { adherencePercent, difference, mean, percentChange, round, trend, isNum } from '../utils/calculations.js';
import { PERFORMANCE_METRICS, SENSOR_METRICS, CATEGORY_LABELS, DATA_SOURCE_LABELS, EQUIPMENT_LABELS } from '../analysis/metricCatalog.js';
import { resolveAstronautIds, scopeRecords } from './scope.js';
import { sortByDate } from '../utils/dateUtils.js';
import { applyListQuery } from '../utils/query.js';

const MAX_ROWS = 500;
const d1 = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '—');
const fmt = (v) => (isNum(v) ? round(v, 2) : '—');

const REPORT_TITLES = {
  'exercise-history': 'Exercise History Report',
  'exercise-adherence': 'Exercise Adherence Report',
  'muscle-performance': 'Muscle Performance Report',
  'baseline-comparison': 'Baseline Comparison Report',
  'sensor-measurements': 'Sensor Measurements Report',
  'adaptive-insights': 'Adaptive Insights Report',
  'alerts-summary': 'Alerts Summary Report',
  'mission-phase-summary': 'Mission Phase Summary Report',
};

export const REPORT_TYPES = Object.keys(REPORT_TITLES);

function table(title, columns, rows) {
  const truncated = rows.length > MAX_ROWS;
  return { title, columns, rows: rows.slice(0, MAX_ROWS), totalRows: rows.length, truncated };
}

/** Build the report snapshot from stored records. Only real stored records (or labelled simulated data) are included. */
export async function generateReport(input, actorRole) {
  const f = input;
  const [astronauts, missions, exercises, performance, baselines, sensors, insights, alerts] = await Promise.all([
    readCollection('astronauts'), readCollection('missions'), readCollection('exerciseRecords'), readCollection('performanceAssessments'),
    readCollection('baselineAssessments'), readCollection('sensorMeasurements'), readCollection('insights'), readCollection('alerts'),
  ]);
  const ids = await resolveAstronautIds({ astronautId: f.astronautId, missionId: f.missionId });
  const scope = { astronautIds: ids, missionPhase: f.missionPhase, startDate: f.startDate, endDate: f.endDate };
  const astName = (id) => astronauts.find((a) => a.id === id)?.name ?? id;
  const exSc = scopeRecords(exercises, { ...scope, dateField: 'sessionDate' })
    .filter((e) => f.equipment === 'all' || e.equipment === f.equipment)
    .filter((e) => f.category === 'all' || e.category === f.category);
  const perfSc = scopeRecords(performance, { ...scope, dateField: 'assessmentDate' });
  const baseSc = baselines.filter((b) => !ids || ids.has(b.astronautId));
  const senSc = scopeRecords(sensors, { ...scope, dateField: 'timestamp' })
    .filter((s) => f.metric === 'all' || s.metric === f.metric);
  const insSc = insights.filter((i) => !ids || ids.has(i.astronautId));
  const alSc = alerts.filter((a) => !ids || ids.has(a.astronautId));
  const metricKeys = f.metric !== 'all' && PERFORMANCE_METRICS[f.metric] ? [f.metric] : Object.keys(PERFORMANCE_METRICS);

  const sections = [];
  const kpis = [];
  const notes = [];

  if (f.reportType === 'exercise-history') {
    const rows = sortByDate(exSc, 'sessionDate').reverse().map((e) => [
      d1(e.sessionDate), astName(e.astronautId), e.equipment, CATEGORY_LABELS[e.category], e.missionPhase,
      e.prescribed ? 'Yes' : 'No', e.completionStatus, fmt(e.resistanceKg ?? e.workloadW ?? e.speedKph), fmt(e.sets), fmt(e.repetitions), fmt(e.durationMinutes),
    ]);
    kpis.push({ label: 'Sessions recorded', value: exSc.length }, { label: 'Completed', value: exSc.filter((e) => e.completionStatus === 'completed').length });
    kpis.push({ label: 'Total duration (min)', value: round(exSc.reduce((s, e) => s + (e.durationMinutes ?? 0), 0), 1) });
    sections.push(table('Exercise history', ['Date', 'Astronaut', 'Equipment', 'Category', 'Phase', 'Prescribed', 'Status', 'Resistance / workload / speed', 'Sets', 'Reps', 'Duration (min)'], rows));
  }

  if (f.reportType === 'exercise-adherence') {
    const groups = {};
    for (const e of exSc.filter((x) => x.prescribed)) {
      const key = `${e.astronautId}|${e.missionPhase}`;
      groups[key] ??= { astronautId: e.astronautId, phase: e.missionPhase, prescribed: 0, completed: 0, missed: 0 };
      groups[key].prescribed += 1;
      if (e.completionStatus === 'completed') groups[key].completed += 1;
      if (e.completionStatus === 'missed') groups[key].missed += 1;
    }
    const rows = Object.values(groups).map((g) => [astName(g.astronautId), g.phase, g.prescribed, g.completed, g.missed, adherencePercent(g.completed, g.prescribed) ?? '—']);
    const total = exSc.filter((x) => x.prescribed);
    kpis.push({ label: 'Prescribed sessions', value: total.length }, { label: 'Overall adherence (%)', value: adherencePercent(total.filter((x) => x.completionStatus === 'completed').length, total.length) ?? '—' });
    sections.push(table('Adherence by astronaut and mission phase', ['Astronaut', 'Phase', 'Prescribed', 'Completed', 'Missed', 'Adherence (%)'], rows));
  }

  if (f.reportType === 'muscle-performance' || f.reportType === 'baseline-comparison') {
    const summaryRows = [];
    for (const astronaut of astronauts.filter((a) => !ids || ids.has(a.id))) {
      for (const key of metricKeys) {
        const def = PERFORMANCE_METRICS[key];
        const base = sortByDate(baseSc.filter((b) => b.astronautId === astronaut.id && isNum(b[key])), 'assessmentDate').slice(-1)[0];
        const series = sortByDate(perfSc.filter((p) => p.astronautId === astronaut.id && isNum(p[key])), 'assessmentDate');
        if (!series.length && !base) continue;
        const last = series.slice(-1)[0];
        const diff = last && base ? difference(last[key], base[key]) : null;
        const pct = def.kind === 'percent' && last && base ? percentChange(last[key], base[key]) : null;
        summaryRows.push([
          astName(astronaut.id), def.label, def.unit,
          base ? `${fmt(base[key])} (${d1(base.assessmentDate)})` : 'No baseline',
          last ? `${fmt(last[key])} (${d1(last.assessmentDate)})` : 'No measurement',
          diff ?? '—', def.kind === 'percent' ? (pct ?? 'not valid') : 'n/a (points metric)',
          series.length >= 3 ? trend(series.map((s) => s[key])).direction : 'insufficient-data',
          series.length,
        ]);
      }
    }
    sections.push(table(
      f.reportType === 'baseline-comparison' ? 'Baseline comparison (each astronaut vs own baseline)' : 'Muscle performance summary',
      ['Astronaut', 'Metric', 'Unit', 'Baseline (date)', 'Latest measurement (date)', 'Difference', '% change', 'Trend', 'Records'],
      summaryRows,
    ));
    const perfRows = sortByDate(perfSc.filter((p) => metricKeys.some((k) => isNum(p[k]))), 'assessmentDate').reverse()
      .map((p) => [d1(p.assessmentDate), astName(p.astronautId), p.missionPhase, ...metricKeys.map((k) => fmt(p[k])), p.dataSource]);
    sections.push(table('Performance assessment records', ['Date', 'Astronaut', 'Phase', ...metricKeys.map((k) => PERFORMANCE_METRICS[k].label), 'Data source'], perfRows));
    kpis.push({ label: 'Assessments in period', value: perfSc.length }, { label: 'Baseline records', value: baseSc.length });
    notes.push('Force, velocity, ROM, repetition and functional metrics are compared as percentages; movement consistency as percentage points. A higher or lower value is not by itself evidence of health or disease.');
  }

  if (f.reportType === 'sensor-measurements') {
    const rows = sortByDate(senSc, 'timestamp').reverse().map((s) => [
      d1(s.timestamp), astName(s.astronautId), s.sensorType, s.metric, fmt(s.value), s.unit, s.missionPhase, s.sourceType, s.dataSource,
    ]);
    const byMetric = {};
    senSc.forEach((s) => { byMetric[s.metric] ??= []; byMetric[s.metric].push(s.value); });
    const summary = Object.entries(byMetric).map(([m, vals]) => [m, vals.length, fmt(mean(vals)), fmt(Math.min(...vals)), fmt(Math.max(...vals))]);
    kpis.push({ label: 'Sensor records', value: senSc.length }, { label: 'Simulated records', value: senSc.filter((s) => s.dataSource === 'simulated').length });
    sections.push(table('Sensor summary by metric', ['Metric', 'Count', 'Mean', 'Min', 'Max'], summary));
    sections.push(table('Sensor records', ['Timestamp', 'Astronaut', 'Sensor', 'Metric', 'Value', 'Unit', 'Phase', 'Entry type', 'Data source'], rows));
    notes.push('Sensor values from fictional sample imports and simulated streams are labelled simulated and must not be read as astronaut measurements.');
  }

  if (f.reportType === 'adaptive-insights') {
    const rows = sortByDate(insSc, 'measurementDate').reverse().map((i) => [
      i.id, astName(i.astronautId), i.metricName, fmt(i.baselineValue), fmt(i.currentValue), fmt(i.difference), i.percentChange ?? '—', i.severity, i.reviewStatus, i.explanation,
    ]);
    kpis.push({ label: 'Insights', value: insSc.length }, { label: 'Attention or critical', value: insSc.filter((i) => i.severity === 'attention' || i.severity === 'critical').length });
    sections.push(table('Adaptive insights', ['Insight ID', 'Astronaut', 'Metric', 'Baseline', 'Current', 'Difference', '% change', 'Severity', 'Review status', 'Explanation'], rows));
    notes.push('Insights are AI-generated (rule-based layer) and are not confirmed medical findings. Each requires review by an authorised specialist.');
  }

  if (f.reportType === 'alerts-summary') {
    const rows = sortByDate(alSc, 'generatedAt').reverse().map((a) => [
      a.id, astName(a.astronautId), a.category, a.severity, a.relatedMetric ?? '—', a.reviewStatus, d1(a.generatedAt), a.description,
    ]);
    const countBy = (key) => Object.entries(alSc.reduce((acc, a) => ({ ...acc, [a[key]]: (acc[a[key]] ?? 0) + 1 }), {}));
    kpis.push({ label: 'Alerts', value: alSc.length }, { label: 'Awaiting review', value: alSc.filter((a) => a.reviewStatus === 'new').length });
    sections.push(table('Alerts by severity', ['Severity', 'Count'], countBy('severity')));
    sections.push(table('Alerts by category', ['Category', 'Count'], countBy('category')));
    sections.push(table('Alert history', ['Alert ID', 'Astronaut', 'Category', 'Severity', 'Metric', 'Review status', 'Generated', 'Description'], rows));
  }

  if (f.reportType === 'mission-phase-summary') {
    const rows = ['preflight', 'in-flight', 'postflight'].map((phase) => {
      const ex = exSc.filter((e) => e.missionPhase === phase);
      const pres = ex.filter((e) => e.prescribed);
      const perf = perfSc.filter((p) => p.missionPhase === phase);
      const sen = senSc.filter((s) => s.missionPhase === phase);
      return [phase, ex.length, adherencePercent(pres.filter((e) => e.completionStatus === 'completed').length, pres.length) ?? '—', perf.length, sen.length];
    });
    kpis.push({ label: 'Phases covered', value: rows.filter((r) => r[1] + r[3] + r[4] > 0).length });
    sections.push(table('Records by mission phase', ['Phase', 'Exercise records', 'Adherence (%)', 'Performance assessments', 'Sensor records'], rows));
    notes.push('Mission phases are timeline filters across all modules and do not create separate data stores.');
  }

  const allRecords = [...exSc, ...perfSc, ...senSc];
  const dataSourceSummary = allRecords.reduce((acc, r) => ({ ...acc, [r.dataSource]: (acc[r.dataSource] ?? 0) + 1 }), {});
  const astronautLabel = f.astronautId && f.astronautId !== 'all' ? astName(f.astronautId) : `All astronauts (${ids ? ids.size : astronauts.length} in scope)`;
  const missionLabel = f.missionId ? (missions.find((m) => m.id === f.missionId)?.name ?? f.missionId) : 'All missions';
  const report = {
    id: makeId('RPT'),
    reportType: f.reportType,
    title: f.title || REPORT_TITLES[f.reportType],
    generatedAt: nowIso(),
    generatedBy: actorRole,
    filters: { astronautId: f.astronautId ?? 'all', missionId: f.missionId ?? 'all', missionPhase: f.missionPhase, startDate: f.startDate, endDate: f.endDate, equipment: f.equipment, category: f.category, metric: f.metric },
    scope: {
      astronaut: astronautLabel,
      mission: missionLabel,
      missionPhase: f.missionPhase === 'all' ? 'All phases' : f.missionPhase,
      period: f.startDate || f.endDate ? `${f.startDate ?? 'start'} to ${f.endDate ?? 'latest'}` : 'All recorded dates',
      equipment: f.equipment === 'all' ? 'All equipment' : (EQUIPMENT_LABELS[f.equipment] ?? f.equipment),
      category: f.category === 'all' ? 'All categories' : CATEGORY_LABELS[f.category],
      metric: f.metric === 'all' ? 'All metrics' : (PERFORMANCE_METRICS[f.metric]?.label ?? f.metric),
    },
    kpis,
    sections,
    notes: [...notes, 'Only stored records are included. Demonstration data is labelled "Simulated demonstration data" in the data-source summary. This report is a prototype output and is not a clinical document.'],
    dataSourceSummary: Object.entries(dataSourceSummary).map(([k, count]) => ({ key: k, label: DATA_SOURCE_LABELS[k] ?? k, count })),
    recordCount: allRecords.length,
  };

  await transact('reports', (reports) => { reports.push(report); });
  return report;
}

export async function listReports(query) {
  const items = await readCollection('reports');
  return applyListQuery(items.map(({ sections, ...meta }) => ({ ...meta, sectionCount: sections.length })), {
    ...query,
    dateField: 'generatedAt',
    searchFields: ['title', 'reportType'],
    filters: { reportType: query.reportType },
  });
}

export async function getReport(id) {
  const found = (await readCollection('reports')).find((r) => r.id === id);
  if (!found) throw notFound('Report', id);
  return found;
}

export { SENSOR_METRICS };

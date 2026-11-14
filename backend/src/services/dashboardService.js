import { readCollection } from '../storage/jsonStorage.js';
import { resolveAstronautIds, scopeRecords } from './scope.js';
import { adherencePercent, mean, round, trend, isNum } from '../utils/calculations.js';
import { PERFORMANCE_METRICS } from '../analysis/metricCatalog.js';
import { sortByDate } from '../utils/dateUtils.js';

const SEVERITY_RANK = { critical: 3, attention: 2, info: 1, normal: 0 };

async function load() {
  const [astronauts, missions, exercises, performance, baselines, sensors, insights, alerts] = await Promise.all([
    readCollection('astronauts'),
    readCollection('missions'),
    readCollection('exerciseRecords'),
    readCollection('performanceAssessments'),
    readCollection('baselineAssessments'),
    readCollection('sensorMeasurements'),
    readCollection('insights'),
    readCollection('alerts'),
  ]);
  return { astronauts, missions, exercises, performance, baselines, sensors, insights, alerts };
}

export async function getSummary(filters) {
  const ids = await resolveAstronautIds(filters);
  const d = await load();
  const inScope = (list) => (ids ? list.filter((x) => ids.has(x.astronautId)) : list);
  const astronautsInScope = d.astronauts.filter((a) => !ids || ids.has(a.id));
  const astronauts = astronautsInScope;
  const exercises = scopeRecords(d.exercises, { astronautIds: ids, missionPhase: filters.missionPhase, startDate: filters.startDate, endDate: filters.endDate, dateField: 'sessionDate' });
  const performance = scopeRecords(d.performance, { astronautIds: ids, missionPhase: filters.missionPhase, startDate: filters.startDate, endDate: filters.endDate, dateField: 'assessmentDate' });
  const sensors = scopeRecords(d.sensors, { astronautIds: ids, missionPhase: filters.missionPhase, startDate: filters.startDate, endDate: filters.endDate, dateField: 'timestamp' });
  const insights = inScope(d.insights);
  const alerts = inScope(d.alerts);
  const missions = filters.missionId && filters.missionId !== 'all' ? d.missions.filter((m) => m.id === filters.missionId) : d.missions;

  // Average adherence = mean of per-astronaut adherence (astronauts with at least one prescribed session)
  const perAstronautAdherence = astronauts
    .map((a) => {
      const prescribed = exercises.filter((e) => e.astronautId === a.id && e.prescribed);
      return adherencePercent(prescribed.filter((e) => e.completionStatus === 'completed').length, prescribed.length);
    })
    .filter(isNum);

  const changeInsights = insights.filter((i) => (i.severity === 'attention' || i.severity === 'critical') && ['performance-change', 'functional-change', 'loading-change'].includes(i.category));

  const overview = astronauts.map((a) => {
    const latestPerf = sortByDate(performance.filter((p) => p.astronautId === a.id), 'assessmentDate').slice(-1)[0];
    const worst = insights
      .filter((i) => i.astronautId === a.id)
      .sort((x, y) => SEVERITY_RANK[y.severity] - SEVERITY_RANK[x.severity])[0];
    const mission = d.missions.find((m) => m.id === a.missionId);
    return {
      id: a.id,
      name: a.name,
      initials: a.initials,
      missionId: a.missionId,
      missionName: mission?.name ?? 'Unassigned',
      missionPhase: a.missionPhase,
      status: a.status,
      latestAssessment: latestPerf ? { date: latestPerf.assessmentDate, phase: latestPerf.missionPhase } : null,
      latestPerformanceStatus: worst ? { severity: worst.severity, metric: worst.metricName } : { severity: 'none', metric: null },
      dataSource: a.dataSource,
    };
  });

  const timeline = ['preflight', 'in-flight', 'postflight'].map((phase) => ({
    phase,
    exerciseRecords: exercises.filter((e) => e.missionPhase === phase).length,
    performanceAssessments: performance.filter((p) => p.missionPhase === phase).length,
    sensorMeasurements: sensors.filter((s) => s.missionPhase === phase).length,
  }));

  const dataSourceCounts = {};
  [...exercises, ...performance, ...sensors].forEach((r) => {
    dataSourceCounts[r.dataSource] = (dataSourceCounts[r.dataSource] ?? 0) + 1;
  });

  return {
    kpis: {
      totalAstronauts: { value: astronauts.length, description: 'Astronaut records in the current filter' },
      activeMissions: { value: missions.filter((m) => m.status === 'active').length, description: 'Missions with status active' },
      exerciseSessionsCompleted: { value: exercises.filter((e) => e.completionStatus === 'completed').length, description: 'Completed exercise records' },
      averageAdherence: { value: perAstronautAdherence.length ? round(mean(perAstronautAdherence), 1) : null, unit: '%', description: 'Mean of prescribed sessions completed' },
      performanceChangesDetected: { value: changeInsights.length, description: 'Attention or critical insights vs own baseline' },
      alertsRequiringReview: { value: alerts.filter((a) => a.reviewStatus === 'new').length, description: 'Alerts with status "new"' },
    },
    overview,
    latestInsights: [...insights]
      .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || new Date(b.generatedAt) - new Date(a.generatedAt))
      .slice(0, 6),
    recentAlerts: [...alerts].sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)).slice(0, 6),
    missionTimeline: timeline,
    dataSourceCounts,
    generatedAt: new Date().toISOString(),
  };
}

const bucketKey = (date, granularity) => {
  const d = new Date(date);
  if (granularity === 'monthly') return d.toISOString().slice(0, 7);
  if (granularity === 'weekly') {
    const day = (d.getUTCDay() + 6) % 7; // Monday = 0
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
    return monday.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
};

export async function getExerciseTrends(filters) {
  const granularity = ['daily', 'weekly', 'monthly'].includes(filters.granularity) ? filters.granularity : 'daily';
  const ids = await resolveAstronautIds(filters);
  const { exercises } = await load();
  const scoped = scopeRecords(exercises, { astronautIds: ids, missionPhase: filters.missionPhase, startDate: filters.startDate, endDate: filters.endDate, dateField: 'sessionDate' })
    .filter((e) => !filters.equipment || filters.equipment === 'all' || e.equipment === filters.equipment)
    .filter((e) => !filters.category || filters.category === 'all' || e.category === filters.category);

  const buckets = new Map();
  for (const e of scoped) {
    const key = bucketKey(e.sessionDate, granularity);
    if (!buckets.has(key)) buckets.set(key, { period: key, prescribed: 0, completed: 0, missed: 0, durations: [], workloads: [], speeds: [], completedUnplanned: 0 });
    const b = buckets.get(key);
    if (e.prescribed) {
      b.prescribed += 1;
      if (e.completionStatus === 'completed') b.completed += 1;
      if (e.completionStatus === 'missed') b.missed += 1;
    } else if (e.completionStatus === 'completed') {
      b.completedUnplanned += 1;
    }
    if (isNum(e.durationMinutes)) b.durations.push(e.durationMinutes);
    if (isNum(e.workloadW)) b.workloads.push(e.workloadW);
    if (isNum(e.speedKph)) b.speeds.push(e.speedKph);
  }

  const rows = [...buckets.values()]
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((b) => ({
      period: b.period,
      prescribed: b.prescribed,
      completed: b.completed,
      missed: b.missed,
      completedUnplanned: b.completedUnplanned,
      adherencePercent: adherencePercent(b.completed, b.prescribed),
      totalDurationMinutes: round(b.durations.reduce((s, v) => s + v, 0), 1),
      meanWorkloadW: isNum(mean(b.workloads)) ? round(mean(b.workloads), 1) : null,
      meanSpeedKph: isNum(mean(b.speeds)) ? round(mean(b.speeds), 2) : null,
    }));

  return { granularity, rows, recordCount: scoped.length, note: 'Adherence = completed prescribed sessions / prescribed sessions. Unplanned sessions are counted separately.' };
}

export async function getPerformanceTrends(filters) {
  const { metric = 'forceProduction' } = filters;
  const def = PERFORMANCE_METRICS[metric];
  if (!def) return { metric, error: 'Unknown metric' };
  const ids = await resolveAstronautIds(filters);
  const d = await load();
  const performance = scopeRecords(d.performance, { astronautIds: ids, missionPhase: filters.missionPhase, startDate: filters.startDate, endDate: filters.endDate, dateField: 'assessmentDate' })
    .filter((p) => isNum(p[metric]));
  const baselines = d.baselines.filter((b) => isNum(b[metric]));
  const astronautIds = [...new Set(performance.map((p) => p.astronautId))];
  const series = astronautIds.map((astronautId) => {
    const astronaut = d.astronauts.find((a) => a.id === astronautId);
    const points = sortByDate(performance.filter((p) => p.astronautId === astronautId), 'assessmentDate');
    const baseline = sortByDate(baselines.filter((b) => b.astronautId === astronautId), 'assessmentDate').slice(-1)[0] ?? null;
    return {
      astronautId,
      astronautName: astronaut?.name ?? astronautId,
      baseline: baseline ? { value: baseline[metric], date: baseline.assessmentDate, recordId: baseline.id } : null,
      trend: trend(points.map((p) => p[metric])),
      points: points.map((p) => ({ date: p.assessmentDate, value: p[metric], phase: p.missionPhase, recordId: p.id, dataSource: p.dataSource })),
    };
  });
  return {
    metric, label: def.label, unit: def.unit, measurement: def.measurement, series,
    note: 'Each astronaut is compared only with their own baseline. Lines from different astronauts are never combined.',
  };
}

export async function getAlertFeed(filters) {
  const ids = await resolveAstronautIds(filters);
  const { alerts } = await load();
  return [...alerts.filter((a) => !ids || ids.has(a.astronautId))].sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)).slice(0, filters.limit ?? 10);
}

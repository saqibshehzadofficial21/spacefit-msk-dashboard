import { readCollection, transact } from '../storage/jsonStorage.js';
import { notFound, AppError } from '../utils/AppError.js';
import { applyListQuery } from '../utils/query.js';
import { nowIso } from '../utils/ids.js';
import { analyseAstronaut } from '../analysis/ruleEngine.js';
import { getNarrativeProvider, narrativeProviderStatus } from '../analysis/providers/narrativeProvider.js';
import { getSettings } from './settingsService.js';
import { makeId } from '../utils/ids.js';

export async function listInsights(query) {
  const items = await readCollection('insights');
  return applyListQuery(items, {
    ...query,
    dateField: 'measurementDate',
    searchFields: ['metricName', 'explanation', 'astronautId'],
    filters: { astronautId: query.astronautId, severity: query.severity, category: query.category, reviewStatus: query.reviewStatus },
  });
}

export async function getInsight(id) {
  const found = (await readCollection('insights')).find((i) => i.id === id);
  if (!found) throw notFound('Insight', id);
  return found;
}

export async function updateInsightReview(id, reviewStatus) {
  return transact('insights', (items) => {
    const i = items.findIndex((x) => x.id === id);
    if (i < 0) throw notFound('Insight', id);
    items[i] = { ...items[i], reviewStatus, updatedAt: nowIso() };
    return items[i];
  });
}

/**
 * Run the analysis for one astronaut or for everyone. Unreviewed insights for the analysed astronauts
 * are regenerated; reviewed insights are kept for the audit trail. Alerts are added only once per
 * dedupe key, so re-running the analysis never duplicates an alert.
 */
export async function runAnalysis(astronautId) {
  const [astronauts, baselines, performance, exercises, sensors, settings] = await Promise.all([
    readCollection('astronauts'),
    readCollection('baselineAssessments'),
    readCollection('performanceAssessments'),
    readCollection('exerciseRecords'),
    readCollection('sensorMeasurements'),
    getSettings(),
  ]);
  const targets = astronautId ? astronauts.filter((a) => a.id === astronautId) : astronauts;
  if (astronautId && !targets.length) throw new AppError(400, 'Validation failed', [`astronautId: astronaut "${astronautId}" does not exist`]);

  const runId = makeId('RUN');
  const insights = [];
  const alerts = [];
  for (const astronaut of targets) {
    const result = analyseAstronaut({ astronaut, baselines, performance, exercises, sensors, settings, runId });
    insights.push(...result.insights);
    alerts.push(...result.alerts);
  }

  // Optional Layer 2 narrative. Only for attention/critical insights, capped to limit cost.
  const provider = getNarrativeProvider();
  let narrativesAdded = 0;
  let narrativeErrors = 0;
  if (provider) {
    for (const insight of insights.filter((i) => i.severity === 'attention' || i.severity === 'critical').slice(0, 20)) {
      try {
        const text = await provider.explain({
          metric: insight.metricName, unit: insight.unit, baselineValue: insight.baselineValue,
          currentValue: insight.currentValue, difference: insight.difference, percentChange: insight.percentChange,
          severity: insight.severity, ruleExplanation: insight.explanation,
        });
        if (text) {
          insight.narrative = { text, source: provider.name };
          narrativesAdded += 1;
        }
      } catch (err) {
        narrativeErrors += 1;
        console.warn('[analysis] narrative provider failed; rule-based explanation kept:', err.message);
      }
    }
  }

  const analysedIds = new Set(targets.map((t) => t.id));
  const result = await transact('insights', (existing) => {
    const kept = existing.filter((i) => !(analysedIds.has(i.astronautId) && i.reviewStatus === 'unreviewed'));
    existing.length = 0;
    existing.push(...kept, ...insights);
    return { createdCount: insights.length };
  });

  let alertsCreated = 0;
  let alertsSkipped = 0;
  await transact('alerts', (existing) => {
    const keys = new Set(existing.map((a) => a.dedupeKey).filter(Boolean));
    for (const alert of alerts) {
      if (keys.has(alert.dedupeKey)) {
        alertsSkipped += 1;
        continue;
      }
      keys.add(alert.dedupeKey);
      existing.push(alert);
      alertsCreated += 1;
    }
  });

  return {
    runId,
    astronautsAnalysed: targets.length,
    insightsCreated: result.createdCount,
    alertsCreated,
    alertsSkippedAsDuplicates: alertsSkipped,
    narrativesAdded,
    narrativeErrors,
    engine: narrativeProviderStatus(),
    note: 'Analysis compares each astronaut only with their own baseline. Thresholds are configurable sample logic, not NASA-approved limits.',
    completedAt: nowIso(),
  };
}

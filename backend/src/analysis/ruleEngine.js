/**
 * Layer 1: rule-based analysis. Works with no external AI key.
 * It compares each astronaut's current measurements with THEIR OWN baseline only, calculates
 * differences and percentage changes, checks configurable thresholds, and writes plain-language
 * explanations. Output describes measurement differences; it never diagnoses a condition.
 */
import { difference, percentChange, mean, trend, isNum, adherencePercent, round } from '../utils/calculations.js';
import { sortByDate } from '../utils/dateUtils.js';
import { makeId, nowIso } from '../utils/ids.js';
import { PERFORMANCE_METRICS, LOADING_METRICS } from './metricCatalog.js';

const fmt = (v, digits = 2) => (isNum(v) ? round(v, digits).toString() : 'n/a');
const sign = (v) => (isNum(v) && v > 0 ? '+' : '');

function trailingStreak(series, isBreach) {
  let count = 0;
  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (isBreach(series[i])) count += 1;
    else break;
  }
  return count;
}

function insightBase({ astronaut, runId, now }) {
  return {
    astronautId: astronaut.id,
    runId,
    source: 'rule-engine',
    dataSource: 'ai-generated',
    reviewStatus: 'unreviewed',
    narrative: null,
    generatedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

function alertBase({ astronaut, now, insightId }) {
  return {
    astronautId: astronaut.id,
    insightId,
    source: 'rule-engine',
    dataSource: 'ai-generated',
    reviewStatus: 'new',
    specialistNotes: [],
    generatedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * @returns {{ insights: object[], alerts: object[] }} candidate records (ids assigned here)
 */
export function analyseAstronaut({ astronaut, baselines, performance, exercises, sensors, settings, runId }) {
  const now = nowIso();
  const t = settings.thresholds;
  const persistentNeeded = t.persistentAssessments ?? 3;
  const insights = [];
  const alerts = [];
  const mine = (list) => list.filter((r) => r.astronautId === astronaut.id);

  const astBaselines = mine(baselines);
  const astPerformance = mine(performance);
  const astExercises = mine(exercises);
  const astSensors = mine(sensors);

  // ---- 1. Muscle performance metrics: current vs individual baseline ----
  for (const [key, def] of Object.entries(PERFORMANCE_METRICS)) {
    const baselineRecords = sortByDate(astBaselines.filter((b) => isNum(b[key])));
    const series = sortByDate(astPerformance.filter((p) => isNum(p[key])));
    if (!series.length) continue;

    const current = series[series.length - 1];
    const unit = def.unit;

    if (!baselineRecords.length) {
      const insight = {
        ...insightBase({ astronaut, runId, now }),
        id: makeId('INS'),
        metricKey: key, metricName: def.label, category: def.alertCategory, unit,
        baselineValue: null, baselineRecordId: null, currentValue: current[key], currentRecordId: current.id,
        difference: null, percentChange: null, measurementDate: current.assessmentDate, severity: 'info',
        explanation: `${def.label} has ${series.length} recorded measurement(s) but no individual baseline for this metric. No comparison was made. Record a baseline assessment to enable comparison.`,
        supportingRecordIds: series.slice(-3).map((s) => s.id),
        suggestedAction: 'Record a preflight baseline assessment for this metric, then re-run the analysis.',
      };
      insights.push(insight);
      continue;
    }

    const baseline = baselineRecords[baselineRecords.length - 1];
    const diffOf = (value) => difference(value, baseline[key]);
    const pctOf = (value) => (def.kind === 'percent' ? percentChange(value, baseline[key]) : null);
    const limit = t[def.threshold]?.percentChange ?? t[def.threshold]?.pointsChange;
    const isBreach = (rec) => (def.kind === 'percent' ? pctOf(rec[key]) !== null && pctOf(rec[key]) <= limit : diffOf(rec[key]) !== null && diffOf(rec[key]) <= limit);
    const streak = trailingStreak(series, isBreach);
    const breach = isBreach(current);
    const diff = diffOf(current[key]);
    const pct = pctOf(current[key]);
    const severity = breach ? (streak >= persistentNeeded ? 'critical' : 'attention') : 'normal';
    const trendInfo = trend(series.map((s) => s[key]));
    const limitText = def.kind === 'percent' ? `${limit}%` : `${limit} percentage points`;

    let explanation;
    if (def.kind === 'percent' && pct === null) {
      explanation = `Current ${def.label.toLowerCase()} is ${fmt(current[key])} ${unit}. The baseline is zero or missing, so a percentage change is not valid. The absolute difference is ${sign(diff)}${fmt(diff)} ${unit}.`;
    } else {
      const direction = (def.kind === 'percent' ? pct : diff) < 0 ? 'below' : 'above';
      const magnitude = def.kind === 'percent' ? `${Math.abs(pct)}%` : `${Math.abs(diff)} percentage points`;
      explanation = `The latest ${def.label.toLowerCase()} measurement is ${fmt(current[key])} ${unit}, which is ${magnitude} ${direction} this astronaut's own baseline of ${fmt(baseline[key])} ${unit}. Configured sample threshold: ${limitText}. ${breach ? `This is past the threshold${streak > 1 ? ` in ${streak} consecutive assessments` : ''}.` : 'This is within the configured threshold.'}`;
    }
    explanation += ` Trend across ${series.length} measurement(s): ${trendInfo.direction}. This describes a measurement difference only and does not identify a cause.`;

    const insight = {
      ...insightBase({ astronaut, runId, now }),
      id: makeId('INS'),
      metricKey: key, metricName: def.label, category: def.alertCategory, unit,
      baselineValue: baseline[key], baselineRecordId: baseline.id,
      currentValue: current[key], currentRecordId: current.id,
      difference: diff, percentChange: pct, measurementDate: current.assessmentDate, severity,
      explanation,
      supportingRecordIds: [baseline.id, ...series.slice(-3).map((s) => s.id)],
      suggestedAction: severity === 'normal'
        ? 'No action required by this rule. Continue routine monitoring.'
        : severity === 'critical'
          ? 'Change persists across consecutive assessments. Refer to an authorised specialist for evaluation and review the measurement history.'
          : 'Review the measurement history and consider evaluation by an authorised specialist.',
    };
    insights.push(insight);

    if (breach) {
      const alertId = makeId('ALT');
      alerts.push({
        ...alertBase({ astronaut, now, insightId: insight.id }),
        id: alertId,
        dedupeKey: `${astronaut.id}|${def.alertCategory}|${key}|${current.id}`,
        category: def.alertCategory,
        severity: streak >= persistentNeeded ? 'critical' : 'attention',
        relatedMetric: def.label,
        baselineValue: baseline[key],
        currentValue: current[key],
        difference: diff,
        description: `${def.label} is ${def.kind === 'percent' ? `${Math.abs(pct)}% ${pct < 0 ? 'below' : 'above'}` : `${Math.abs(diff)} points ${diff < 0 ? 'below' : 'above'}`} the individual baseline (sample threshold ${limitText}).`,
      });
    }

    if (breach && streak >= persistentNeeded) {
      const alertId = makeId('ALT');
      alerts.push({
        ...alertBase({ astronaut, now, insightId: insight.id }),
        id: alertId,
        dedupeKey: `${astronaut.id}|specialist-review|${key}|${current.id}`,
        category: 'specialist-review',
        severity: 'critical',
        relatedMetric: def.label,
        baselineValue: baseline[key],
        currentValue: current[key],
        difference: diff,
        description: `${def.label} has been past the configured threshold for ${streak} consecutive assessments. Specialist review is recommended. This is not a diagnosis.`,
      });
    }
  }

  // ---- 2. Mechanical loading patterns from sensor records ----
  for (const key of LOADING_METRICS) {
    const values = sortByDate(astSensors.filter((s) => s.metric === key));
    if (values.length < 8) continue; // data-quality guard: need enough records for a stable comparison
    const preflight = values.filter((v) => v.missionPhase === 'preflight');
    const reference = preflight.length >= 3 ? preflight : values.slice(0, 3);
    const refLabel = preflight.length >= 3 ? 'preflight sensor records' : 'earliest recorded sensor records (no preflight sensor baseline)';
    const recent = values.slice(-5);
    const refMean = mean(reference.map((r) => r.value));
    const curMean = mean(recent.map((r) => r.value));
    const pct = percentChange(curMean, refMean);
    const unit = key === 'appliedForce' ? 'N' : 'kPa';
    const limit = t.loadingChange?.percentChange ?? 15;
    const breach = pct !== null && Math.abs(pct) >= limit;
    const label = key === 'appliedForce' ? 'Applied force (loading)' : 'Peak plantar pressure (loading)';
    const insight = {
      ...insightBase({ astronaut, runId, now }),
      id: makeId('INS'),
      metricKey: key, metricName: label, category: 'loading-change', unit,
      baselineValue: round(refMean), baselineRecordId: null,
      currentValue: round(curMean), currentRecordId: recent[recent.length - 1].id,
      difference: difference(curMean, refMean), percentChange: pct,
      measurementDate: recent[recent.length - 1].timestamp,
      severity: breach ? 'attention' : 'normal',
      explanation: `The mean of the latest ${recent.length} sensor values is ${fmt(curMean)} ${unit}, compared with ${fmt(refMean)} ${unit} from ${refLabel}${pct === null ? ' (percentage not valid: zero reference)' : `, a change of ${sign(pct)}${pct}%`}. Configured sample threshold: ±${limit}%. ${breach ? 'The mechanical loading pattern has changed past this threshold.' : 'No change past the configured threshold.'} Sensor values describe loading only; they do not measure bone or muscle tissue.`,
      supportingRecordIds: recent.map((r) => r.id),
      suggestedAction: breach ? 'Review sensor and exercise records for this period and consider specialist evaluation.' : 'No action required by this rule.',
    };
    insights.push(insight);
    if (breach) {
      alerts.push({
        ...alertBase({ astronaut, now, insightId: insight.id }),
        id: makeId('ALT'),
        dedupeKey: `${astronaut.id}|loading-change|${key}|${recent[recent.length - 1].id}`,
        category: 'loading-change',
        severity: 'attention',
        relatedMetric: label,
        baselineValue: insight.baselineValue,
        currentValue: insight.currentValue,
        difference: insight.difference,
        description: `Mechanical loading (${label.replace(' (loading)', '')}) changed by ${sign(pct)}${pct}% against the reference period (sample threshold ±${limit}%).`,
      });
    }
  }

  // ---- 3. Exercise adherence ----
  const prescribed = sortByDate(astExercises.filter((e) => e.prescribed), 'sessionDate');
  if (prescribed.length >= 3) {
    const asOf = new Date(prescribed[prescribed.length - 1].sessionDate);
    const windowDays = t.adherence?.windowDays ?? 14;
    const windowStart = new Date(asOf.getTime() - windowDays * 86400000);
    const inWindow = prescribed.filter((e) => new Date(e.sessionDate) >= windowStart);
    const completed = inWindow.filter((e) => e.completionStatus === 'completed').length;
    const pct = adherencePercent(completed, inWindow.length);
    const minimum = t.adherence?.minimumPercent ?? 80;
    if (pct !== null && inWindow.length >= 3) {
      const breach = pct < minimum;
      const lastRecord = inWindow[inWindow.length - 1];
      const insight = {
        ...insightBase({ astronaut, runId, now }),
        id: makeId('INS'),
        metricKey: 'exerciseAdherence', metricName: 'Exercise adherence', category: 'exercise-adherence', unit: '%',
        baselineValue: minimum, baselineRecordId: null,
        currentValue: pct, currentRecordId: lastRecord.id,
        difference: round(pct - minimum, 1), percentChange: null,
        measurementDate: lastRecord.sessionDate,
        severity: breach ? 'attention' : 'normal',
        explanation: `In the ${windowDays} days to the latest prescribed session, ${completed} of ${inWindow.length} prescribed sessions were completed (${pct}% adherence). Configured sample minimum: ${minimum}%. ${breach ? 'Adherence is below the configured minimum.' : 'Adherence meets the configured minimum.'} Missed sessions can have many causes; this does not indicate a medical condition.`,
        supportingRecordIds: inWindow.map((e) => e.id),
        suggestedAction: breach ? 'Check the prescribed programme with the crew member and the exercise team; review missed-session reasons.' : 'No action required by this rule.',
      };
      insights.push(insight);
      if (breach) {
        alerts.push({
          ...alertBase({ astronaut, now, insightId: insight.id }),
          id: makeId('ALT'),
          dedupeKey: `${astronaut.id}|exercise-adherence|window|${lastRecord.id}`,
          category: 'exercise-adherence',
          severity: 'attention',
          relatedMetric: 'Exercise adherence',
          baselineValue: minimum,
          currentValue: pct,
          difference: round(pct - minimum, 1),
          description: `Adherence was ${pct}% over the last ${windowDays} days (sample minimum ${minimum}%).`,
        });
      }
    }
    const missedNeeded = t.adherence?.consecutiveMissedSessions ?? 3;
    const streak = trailingStreak(prescribed, (e) => e.completionStatus === 'missed');
    if (streak >= missedNeeded) {
      const last = prescribed[prescribed.length - 1];
      alerts.push({
        ...alertBase({ astronaut, now, insightId: null }),
        id: makeId('ALT'),
        dedupeKey: `${astronaut.id}|exercise-adherence|missed|${last.id}`,
        category: 'exercise-adherence',
        severity: 'attention',
        relatedMetric: 'Consecutive missed sessions',
        baselineValue: null,
        currentValue: streak,
        difference: null,
        description: `${streak} consecutive prescribed sessions were recorded as missed (sample trigger ${missedNeeded}).`,
      });
    }
  }

  return { insights, alerts };
}

/** Insight-level summary used by the report and dashboard, independent of persistence. */
export function summariseInsights(insights) {
  return insights.reduce((acc, i) => ({ ...acc, [i.severity]: (acc[i.severity] ?? 0) + 1 }), {});
}

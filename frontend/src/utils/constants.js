export const PHASES = [
  { value: 'preflight', label: 'Preflight' },
  { value: 'in-flight', label: 'In-flight' },
  { value: 'postflight', label: 'Postflight' },
];

export const CATEGORIES = [
  { value: 'resistance-training', label: 'Resistance training', equipment: ['ARED', 'ROCKY'] },
  { value: 'treadmill', label: 'Treadmill', equipment: ['TREADMILL'] },
  { value: 'cycle-ergometer', label: 'Cycle ergometer', equipment: ['CEVIS'] },
  { value: 'functional', label: 'Functional exercise', equipment: ['ARED', 'ROCKY', 'TREADMILL', 'CEVIS', 'NONE'] },
];

export const EQUIPMENT = [
  { value: 'ARED', label: 'ARED', full: 'Advanced Resistive Exercise Device' },
  { value: 'TREADMILL', label: 'Treadmill', full: 'NASA treadmill exercise records' },
  { value: 'CEVIS', label: 'CEVIS', full: 'Cycle Ergometer with Vibration Isolation and Stabilization' },
  { value: 'ROCKY', label: 'ROCKY', full: 'Records for exercises using a compact resistive exercise device' },
  { value: 'NONE', label: 'No equipment', full: 'Functional task without equipment' },
];

export const COMPLETION = [
  { value: 'completed', label: 'Completed' },
  { value: 'partial', label: 'Partial' },
  { value: 'missed', label: 'Missed' },
];

/** Performance metrics. `kind`: 'percent' or 'points' (see backend metricCatalog). */
export const METRICS = {
  forceProduction: { label: 'Force production', unit: 'N', measurement: 'Instrumented force sensor', kind: 'percent', decimals: 1 },
  movementVelocity: { label: 'Movement velocity', unit: 'm/s', measurement: 'IMU-derived movement data', kind: 'percent', decimals: 2 },
  jointROM: { label: 'Joint range of motion', unit: 'degrees', measurement: 'IMU-derived joint movement estimate', kind: 'percent', decimals: 1 },
  repetitionPerformance: { label: 'Repetition performance', unit: 'repetitions', measurement: 'Sensor-based exercise tracking', kind: 'percent', decimals: 0 },
  movementConsistency: { label: 'Movement consistency', unit: '%', measurement: 'Repeated movement comparison', kind: 'points', decimals: 1 },
  functionalScore: { label: 'Functional assessment score', unit: 'points', measurement: 'Standardised assessment task', kind: 'percent', decimals: 1 },
};
export const METRIC_KEYS = Object.keys(METRICS);

export const SENSOR_TYPES = {
  IMU: { label: 'IMU (movement, acceleration, angular velocity, orientation)', metrics: { movementVelocity: ['Movement velocity', 'm/s'], acceleration: ['Acceleration', 'm/s²'], angularVelocity: ['Angular velocity', 'deg/s'], jointAngle: ['Joint angle (ROM estimate)', 'degrees'], orientation: ['Orientation', 'degrees'] } },
  FORCE: { label: 'Force sensor (applied force)', metrics: { appliedForce: ['Applied force', 'N'] } },
  PRESSURE: { label: 'Pressure sensor / insole', metrics: { peakPressure: ['Peak pressure', 'kPa'], loadBalance: ['Left-right load balance', '%'] } },
};

export const SEVERITIES = [
  { value: 'critical', label: 'Critical' },
  { value: 'attention', label: 'Attention' },
  { value: 'info', label: 'Info' },
];

export const ALERT_CATEGORIES = [
  { value: 'performance-change', label: 'Performance change', hint: 'Measurement differs from baseline' },
  { value: 'loading-change', label: 'Loading change', hint: 'Mechanical loading pattern has changed' },
  { value: 'exercise-adherence', label: 'Exercise adherence', hint: 'Prescribed session not completed' },
  { value: 'functional-change', label: 'Functional change', hint: 'Assessment performance has declined' },
  { value: 'specialist-review', label: 'Specialist review', hint: 'Persistent or concerning change requires evaluation' },
];

export const ALERT_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'resolved', label: 'Resolved' },
];

export const INSIGHT_REVIEW = [
  { value: 'unreviewed', label: 'Unreviewed' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'referred-to-specialist', label: 'Referred to specialist' },
];

export const REPORT_TYPES = [
  { value: 'exercise-history', label: 'Exercise History Report' },
  { value: 'exercise-adherence', label: 'Exercise Adherence Report' },
  { value: 'muscle-performance', label: 'Muscle Performance Report' },
  { value: 'baseline-comparison', label: 'Baseline Comparison Report' },
  { value: 'sensor-measurements', label: 'Sensor Measurements Report' },
  { value: 'adaptive-insights', label: 'Adaptive Insights Report' },
  { value: 'alerts-summary', label: 'Alerts Summary Report' },
  { value: 'mission-phase-summary', label: 'Mission Phase Summary Report' },
];

export const DATA_SOURCE_LABELS = {
  'nasa-reference': 'NASA reference information',
  'actual-sensor': 'Actual sensor measurement',
  manual: 'Manually entered record',
  simulated: 'Simulated demonstration data',
  'ai-generated': 'AI-generated insight',
};

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
];

export const CATEGORY_LABELS_BY_VALUE = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

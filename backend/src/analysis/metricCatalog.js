/**
 * Metric catalogue. Units, labels and measurement approaches follow the Software Development Brief.
 * `threshold` keys point at settings.thresholds (CONFIGURABLE SAMPLE LOGIC, not NASA-approved limits).
 * `kind` = 'percent' (uses % change from baseline) or 'points' (absolute change, used for percentages).
 */
export const PERFORMANCE_METRICS = {
  forceProduction: {
    label: 'Force production', unit: 'N', measurement: 'Instrumented force sensor',
    kind: 'percent', threshold: 'forceProduction', alertCategory: 'performance-change',
  },
  movementVelocity: {
    label: 'Movement velocity', unit: 'm/s', measurement: 'IMU-derived movement data',
    kind: 'percent', threshold: 'movementVelocity', alertCategory: 'performance-change',
  },
  jointROM: {
    label: 'Joint range of motion', unit: 'degrees', measurement: 'IMU-derived joint movement estimate',
    kind: 'percent', threshold: 'jointROM', alertCategory: 'performance-change',
  },
  repetitionPerformance: {
    label: 'Repetition performance', unit: 'repetitions', measurement: 'Sensor-based exercise tracking',
    kind: 'percent', threshold: 'repetitionPerformance', alertCategory: 'performance-change',
  },
  movementConsistency: {
    label: 'Movement consistency', unit: '%', measurement: 'Repeated movement comparison',
    kind: 'points', threshold: 'movementConsistency', alertCategory: 'performance-change',
  },
  functionalScore: {
    label: 'Functional assessment score', unit: 'points (protocol-defined)', measurement: 'Standardised assessment task',
    kind: 'percent', threshold: 'functionalScore', alertCategory: 'functional-change',
  },
};

export const SENSOR_METRICS = {
  IMU: {
    label: 'IMU sensor (movement, acceleration, angular velocity, orientation)',
    metrics: {
      movementVelocity: { label: 'Movement velocity', unit: 'm/s' },
      acceleration: { label: 'Acceleration', unit: 'm/s²' },
      angularVelocity: { label: 'Angular velocity', unit: 'deg/s' },
      jointAngle: { label: 'Joint angle (ROM estimate)', unit: 'degrees' },
      orientation: { label: 'Orientation', unit: 'degrees' },
    },
  },
  FORCE: {
    label: 'Force sensor (applied force during instrumented exercise)',
    metrics: {
      appliedForce: { label: 'Applied force', unit: 'N' },
    },
  },
  PRESSURE: {
    label: 'Pressure sensor / insole (pressure distribution and loading)',
    metrics: {
      peakPressure: { label: 'Peak pressure', unit: 'kPa' },
      loadBalance: { label: 'Left-right load balance', unit: '%' },
    },
  },
};

// Sensor metrics whose change over time is evaluated as a mechanical loading pattern.
export const LOADING_METRICS = ['appliedForce', 'peakPressure'];

export const unitFor = (sensorType, metric) => SENSOR_METRICS[sensorType]?.metrics[metric]?.unit ?? '';

export const findSensorType = (metric) => Object.entries(SENSOR_METRICS).find(([, s]) => s.metrics[metric])?.[0] ?? null;

export const EQUIPMENT_LABELS = {
  ARED: 'ARED (Advanced Resistive Exercise Device)',
  TREADMILL: 'Treadmill (NASA treadmill exercise records)',
  CEVIS: 'CEVIS (Cycle Ergometer with Vibration Isolation and Stabilization)',
  ROCKY: 'ROCKY (compact resistive exercise device records)',
  NONE: 'No equipment (functional task)',
};

export const CATEGORY_LABELS = {
  'resistance-training': 'Resistance training',
  treadmill: 'Treadmill',
  'cycle-ergometer': 'Cycle ergometer',
  functional: 'Functional exercise',
};

export const DATA_SOURCE_LABELS = {
  'nasa-reference': 'NASA reference information',
  'actual-sensor': 'Actual sensor measurement',
  manual: 'Manually entered record',
  simulated: 'Simulated demonstration data',
  'ai-generated': 'AI-generated insight',
};

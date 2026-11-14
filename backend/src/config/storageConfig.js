/**
 * Maps each logical data collection to its JSON file inside DATA_DIR.
 * `type` is 'array' for record collections and 'object' for singleton documents.
 */
export const COLLECTIONS = {
  missions: { file: 'missions.json', type: 'array' },
  astronauts: { file: 'astronauts.json', type: 'array' },
  baselineAssessments: { file: 'baselineAssessments.json', type: 'array' },
  exerciseRecords: { file: 'exerciseRecords.json', type: 'array' },
  sensorMeasurements: { file: 'sensorMeasurements.json', type: 'array' },
  performanceAssessments: { file: 'performanceAssessments.json', type: 'array' },
  insights: { file: 'insights.json', type: 'array' },
  alerts: { file: 'alerts.json', type: 'array' },
  reports: { file: 'reports.json', type: 'array' },
  users: { file: 'users.json', type: 'array' },
  auditLogs: { file: 'auditLogs.json', type: 'array' },
  settings: { file: 'settings.json', type: 'object' },
};

export const DEFAULT_SETTINGS = {
  id: 'settings',
  profile: {
    displayName: 'Prototype Operator',
    role: 'administrator',
    organisation: 'Demonstration workspace (not an official deployment)',
  },
  preferences: {
    defaultMissionPhase: 'all',
    defaultDateRangeDays: 90,
    compactTables: false,
  },
  notifications: {
    minimumSeverity: 'attention',
    showToasts: true,
  },
  thresholds: {
    thresholdsNotice:
      'CONFIGURABLE SAMPLE LOGIC FOR DEMONSTRATION. These values are not NASA-approved, not clinical limits and must be set by an authorised specialist before any real use.',
    forceProduction: { percentChange: -10 },
    movementVelocity: { percentChange: -10 },
    jointROM: { percentChange: -10 },
    repetitionPerformance: { percentChange: -15 },
    movementConsistency: { pointsChange: -5 },
    functionalScore: { percentChange: -10 },
    loadingChange: { percentChange: 15 },
    adherence: { minimumPercent: 80, windowDays: 14, consecutiveMissedSessions: 3 },
    persistentAssessments: 3,
  },
  updatedAt: null,
};

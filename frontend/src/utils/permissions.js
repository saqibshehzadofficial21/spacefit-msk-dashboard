/**
 * Mirrors backend/src/middleware/auth.js. The UI uses this only to show or hide actions;
 * the backend enforces the same rules on every request.
 */
export const ROLE_LABELS = {
  administrator: 'Administrator',
  'medical-specialist': 'Medical Specialist',
  astronaut: 'Astronaut',
};

export const ROLE_DESCRIPTIONS = {
  administrator: 'Full prototype access: astronaut deletion, missions, thresholds and settings.',
  'medical-specialist': 'Clinical records, baselines, alert review and specialist notes. Cannot delete astronauts or change thresholds.',
  astronaut: 'Read access and self-logged exercise records. Cannot review alerts or change analysis settings.',
};

const PERMISSIONS = {
  administrator: ['*'],
  'medical-specialist': [
    'astronauts:read', 'astronauts:write', 'missions:read', 'baselines:read', 'baselines:write',
    'performance:read', 'performance:write', 'exercises:read', 'exercises:write', 'sensors:read', 'sensors:write',
    'insights:read', 'insights:analyse', 'insights:write', 'alerts:read', 'alerts:write', 'reports:read', 'reports:generate',
    'settings:read', 'audit:read',
  ],
  astronaut: [
    'astronauts:read', 'missions:read', 'baselines:read', 'performance:read', 'exercises:read', 'exercises:write',
    'sensors:read', 'insights:read', 'alerts:read', 'reports:read', 'reports:generate', 'settings:read',
  ],
};

export function hasPermission(role, permission) {
  const granted = PERMISSIONS[role] ?? [];
  return granted.includes('*') || granted.includes(permission);
}

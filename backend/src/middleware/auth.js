import { AppError } from '../utils/AppError.js';

/**
 * DEMO AUTHENTICATION ONLY.
 * The active role is sent by the frontend in the `x-demo-role` header and stored in the browser.
 * This is a prototype role switch for demonstrating permissions. It is NOT production identity
 * management and gives no protection against a determined user who edits the header.
 */
export const ROLES = ['administrator', 'medical-specialist', 'astronaut'];

export const PERMISSIONS = {
  administrator: ['*'],
  'medical-specialist': [
    'astronauts:read', 'astronauts:write',
    'missions:read',
    'baselines:read', 'baselines:write',
    'performance:read', 'performance:write',
    'exercises:read', 'exercises:write',
    'sensors:read', 'sensors:write',
    'insights:read', 'insights:analyse', 'insights:write',
    'alerts:read', 'alerts:write',
    'reports:read', 'reports:generate',
    'settings:read', 'audit:read',
  ],
  astronaut: [
    'astronauts:read', 'missions:read',
    'baselines:read', 'performance:read',
    'exercises:read', 'exercises:write',
    'sensors:read', 'insights:read', 'alerts:read',
    'reports:read', 'reports:generate', 'settings:read',
  ],
};

export function authContext(req, _res, next) {
  const role = String(req.get('x-demo-role') || 'administrator').trim().toLowerCase();
  if (!ROLES.includes(role)) {
    return next(new AppError(400, 'Unknown demo role', [`Role must be one of: ${ROLES.join(', ')}`]));
  }
  req.user = { role };
  return next();
}

export function requirePermission(permission) {
  return (req, _res, next) => {
    const granted = PERMISSIONS[req.user?.role] ?? [];
    if (granted.includes('*') || granted.includes(permission)) return next();
    return next(new AppError(403, 'Your demo role is not permitted to perform this action', [`Missing permission: ${permission}`]));
  };
}

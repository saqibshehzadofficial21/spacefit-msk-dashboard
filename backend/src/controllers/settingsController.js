import * as settingsService from '../services/settingsService.js';
import { listUsers } from '../services/userService.js';
import { listAudit } from '../services/auditService.js';
import { storageStatus } from '../storage/jsonStorage.js';
import { describeAdapters } from '../sensors/adapters/index.js';
import { narrativeProviderStatus } from '../analysis/providers/narrativeProvider.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { audit } from './crudHelpers.js';

export const get = async (req, res) => {
  const settings = await settingsService.getSettings();
  return sendSuccess(res, {
    data: {
      ...settings,
      system: {
        apiStatus: 'online',
        storage: await storageStatus(),
        sensorAdapters: describeAdapters(),
        analysis: narrativeProviderStatus(),
        nodeVersion: process.version,
        serverTime: new Date().toISOString(),
      },
    },
    message: 'Settings retrieved',
  });
};

export const update = async (req, res) => {
  const settings = await settingsService.updateSettings(req.valid);
  await audit(req, 'update', 'settings', 'settings', 'Settings updated');
  return sendSuccess(res, { data: settings, message: 'Settings saved' });
};

export const users = async (_req, res) => sendSuccess(res, { data: await listUsers(), message: 'Demo users retrieved' });

export const auditTrail = async (req, res) => sendSuccess(res, { data: await listAudit(Math.min(Number(req.query.limit) || 100, 500)), message: 'Audit trail retrieved' });

export const health = async (_req, res) => {
  const storage = await storageStatus();
  return res.status(storage.healthy ? 200 : 503).json({
    success: storage.healthy,
    message: storage.healthy ? 'API is healthy' : 'API is running but storage has a problem',
    data: { status: storage.healthy ? 'ok' : 'degraded', uptimeSeconds: Math.round(process.uptime()), storage, time: new Date().toISOString() },
  });
};

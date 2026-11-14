import { AppError } from '../utils/AppError.js';
import { StorageError } from '../storage/jsonStorage.js';

/** Central error handler. Never leaks stack traces or internal file paths to the client. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, message: err.message, error: err.message, details: err.details });
  }
  if (err instanceof StorageError) {
    console.error(`[storage] ${err.code}: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: 'Data storage operation failed. No changes were saved.',
      error: err.code,
    });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Malformed JSON request body', error: 'Invalid JSON' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body too large', error: 'Payload too large' });
  }
  console.error('[error]', err);
  return res.status(500).json({ success: false, message: 'Unexpected server error', error: 'Internal error' });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'Route not found', error: `${req.method} ${req.originalUrl.split('?')[0]}` });
}

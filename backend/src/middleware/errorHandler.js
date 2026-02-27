import { NODE_ENV } from '../config/env.js';
import { AppError } from '../utils/errors.js';

/**
 * Central error handler. Logs with context; returns sanitized response.
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode ?? 500;
  const message = err instanceof AppError ? err.message : 'Internal server error';
  const details = err.details ?? undefined;

  if (statusCode >= 500) {
    console.error('[Error]', err.message, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(details && { details }),
    ...(NODE_ENV === 'development' && !(err instanceof AppError) && { stack: err.stack }),
  });
}

import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const handleCastError = (err) => AppError.badRequest(`Invalid ${err.path}: ${err.value}`);

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  return AppError.conflict(`Duplicate value for '${field}'. Please use another value.`);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return AppError.badRequest('Validation failed', messages);
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (err.name === 'CastError') error = handleCastError(err);
  else if (err.code === 11000) error = handleDuplicateKey(err);
  else if (err.name === 'ValidationError') error = handleValidationError(err);
  else if (err.name === 'JsonWebTokenError') error = AppError.unauthorized('Invalid token.');
  else if (err.name === 'TokenExpiredError') error = AppError.unauthorized('Token expired.');

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    details: error.details,
    ...(process.env.NODE_ENV !== 'production' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};

export const notFound = (req, _res, next) =>
  next(AppError.notFound(`Cannot ${req.method} ${req.originalUrl}`));

export default errorHandler;

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
  // Multer (local) file-size guard
  else if (err.name === 'MulterError') {
    error = AppError.badRequest(
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Maximum upload size is 10MB.'
        : 'File upload failed. Please try again.'
    );
  }
  // Cloudinary rejects oversized files / quota issues — never leak its raw message
  else if (err.http_code || /file size too large|cloudinary/i.test(err.message || '')) {
    error = AppError.badRequest(
      /file size too large/i.test(err.message || '')
        ? 'File is too large. Maximum upload size is 10MB.'
        : 'Upload failed. Please try a smaller or different file.'
    );
  }

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

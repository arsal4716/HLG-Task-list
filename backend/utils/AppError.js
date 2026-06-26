/**
 * Operational error with an HTTP status code. Anything thrown as an AppError
 * is considered "expected" (validation, auth, not-found) and surfaced to the
 * client. Programmer errors bubble up as 500s.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Bad request', details) {
    return new AppError(msg, 400, details);
  }

  static unauthorized(msg = 'Not authenticated') {
    return new AppError(msg, 401);
  }

  static forbidden(msg = 'Not authorized to perform this action') {
    return new AppError(msg, 403);
  }

  static notFound(msg = 'Resource not found') {
    return new AppError(msg, 404);
  }

  static conflict(msg = 'Resource already exists') {
    return new AppError(msg, 409);
  }
}

export default AppError;

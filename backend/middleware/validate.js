import { AppError } from '../utils/AppError.js';

/**
 * Lightweight, dependency-free validation middleware. Each validator is a
 * function (value, body) => string | null returning an error message or null.
 *
 * Usage:
 *   validate({ email: [required, isEmail], password: [required, minLen(6)] })
 */
export const validate = (schema) => (req, _res, next) => {
  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field];
    for (const rule of rules) {
      const message = rule(value, req.body);
      if (message) {
        errors.push(`${field}: ${message}`);
        break; // stop at first failing rule per field
      }
    }
  }
  if (errors.length) return next(AppError.badRequest('Validation failed', errors));
  next();
};

export default validate;

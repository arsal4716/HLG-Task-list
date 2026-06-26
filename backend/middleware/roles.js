import { AppError } from '../utils/AppError.js';
import { ROLES } from '../config/constants.js';

/** Restrict a route to specific roles. Usage: authorize(ROLES.OWNER, ROLES.MANAGER) */
export const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) return next(AppError.unauthorized());
  if (!allowedRoles.includes(req.user.role)) {
    return next(AppError.forbidden(`Role '${req.user.role}' cannot access this resource.`));
  }
  next();
};

export const isOwner = authorize(ROLES.OWNER);
export const isManagerOrOwner = authorize(ROLES.OWNER, ROLES.MANAGER);

export default authorize;

import { AppError } from '../utils/AppError.js';
import { ROLES } from '../config/constants.js';
import { getEffectiveRole } from '../helpers/access.js';

/**
 * Restrict a route to specific roles. Usage: authorize(ROLES.OWNER, ROLES.MANAGER)
 * Uses the *effective* role, so IT-department users (elevated to Owner) pass.
 */
export const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) return next(AppError.unauthorized());
  const role = getEffectiveRole(req.user);
  if (!allowedRoles.includes(role)) {
    return next(AppError.forbidden(`Role '${req.user.role}' cannot access this resource.`));
  }
  next();
};

export const isOwner = authorize(ROLES.OWNER);
export const isManagerOrOwner = authorize(ROLES.OWNER, ROLES.MANAGER);

export default authorize;

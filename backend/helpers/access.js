import { ROLES } from '../config/constants.js';

/**
 * Access helpers. The IT department is special: its members need to see and
 * manage everything (the team that runs the system), so they are treated as
 * Owner regardless of their stored role. Their actual `role` stays as-is for
 * display / profile purposes — only their *effective* permissions are elevated.
 */
export const isITDept = (user) => {
  const dept = user?.department;
  const name = dept && typeof dept === 'object' ? dept.name : '';
  return (name || '').trim().toLowerCase() === 'it';
};

/** The role to use for permission/visibility decisions. */
export const getEffectiveRole = (user) => (isITDept(user) ? ROLES.OWNER : user?.role);

export const isOwnerLike = (user) => getEffectiveRole(user) === ROLES.OWNER;
export const isManagerLike = (user) =>
  [ROLES.OWNER, ROLES.MANAGER].includes(getEffectiveRole(user));

export default getEffectiveRole;

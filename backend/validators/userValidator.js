import { required, isEmail, minLen, maxLen, isIn } from './rules.js';
import { ROLE_VALUES } from '../config/constants.js';

export const createUserRules = {
  name: [required, maxLen(80)],
  email: [required, isEmail],
  password: [required, minLen(6)],
  role: [isIn(ROLE_VALUES)],
};

export const updateUserRules = {
  name: [maxLen(80)],
  email: [isEmail],
  role: [isIn(ROLE_VALUES)],
};

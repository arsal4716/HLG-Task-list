import { required, isEmail, minLen, maxLen } from './rules.js';

export const registerRules = {
  name: [required, maxLen(80)],
  email: [required, isEmail],
  password: [required, minLen(6)],
};

export const loginRules = {
  email: [required, isEmail],
  password: [required],
};

export const forgotPasswordRules = {
  email: [required, isEmail],
};

export const resetPasswordRules = {
  password: [required, minLen(6)],
};

export const changePasswordRules = {
  currentPassword: [required],
  newPassword: [required, minLen(6)],
};

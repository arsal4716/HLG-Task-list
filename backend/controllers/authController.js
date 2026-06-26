import crypto from 'crypto';
import { User } from '../models/User.js';
import { Performance } from '../models/Performance.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { issueTokens, verifyRefreshToken, refreshCookieOptions } from '../helpers/token.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';
import { ROLES, USER_STATUS } from '../config/constants.js';

/**
 * Register. The first ever user becomes the Owner; subsequent self-registrations
 * default to Employee. Admin-driven creation lives in userController.
 */
export const register = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, department } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return next(AppError.conflict('Email already registered'));

  const userCount = await User.estimatedDocumentCount();
  const role = userCount === 0 ? ROLES.OWNER : ROLES.EMPLOYEE;

  const user = await User.create({ name, email, password, phone, department, role });
  await Performance.create({ user: user._id });

  const { accessToken, refreshToken } = issueTokens(user);
  user.refreshTokens.push(refreshToken);
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Registration successful',
    data: { user, accessToken },
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    return next(AppError.unauthorized('Invalid email or password'));
  }
  if (user.status === USER_STATUS.SUSPENDED) {
    return next(AppError.forbidden('Your account has been suspended.'));
  }

  const { accessToken, refreshToken } = issueTokens(user);
  user.refreshTokens.push(refreshToken);
  // keep the last 5 sessions only
  if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5);
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  user.password = undefined;
  user.refreshTokens = undefined;
  return sendSuccess(res, { message: 'Login successful', data: { user, accessToken } });
});

/** Rotate the refresh token and issue a fresh access token. */
export const refresh = catchAsync(async (req, res, next) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) return next(AppError.unauthorized('No refresh token provided'));

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return next(AppError.unauthorized('Invalid or expired refresh token'));
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(token)) {
    return next(AppError.unauthorized('Refresh token revoked'));
  }

  // rotation: drop old, add new
  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  const { accessToken, refreshToken } = issueTokens(user);
  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  return sendSuccess(res, { message: 'Token refreshed', data: { accessToken } });
});

export const logout = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (token && req.user) {
    await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: token } });
  }
  res.clearCookie('refreshToken', { path: '/api/auth' });
  return sendSuccess(res, { message: 'Logged out' });
});

export const getMe = catchAsync(async (req, res) => {
  const performance = await Performance.findOne({ user: req.user._id });
  return sendSuccess(res, { data: { user: req.user, performance } });
});

export const updateMe = catchAsync(async (req, res, next) => {
  const allowed = ['name', 'phone', 'leaveStatus', 'profileImage', 'profileImagePublicId'];
  const updates = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });
  if (req.body.password) return next(AppError.badRequest('Use /change-password to update password'));

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  return sendSuccess(res, { message: 'Profile updated', data: { user } });
});

export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return next(AppError.unauthorized('Current password is incorrect'));
  }
  user.password = newPassword;
  user.refreshTokens = []; // force re-login everywhere
  await user.save();
  res.clearCookie('refreshToken', { path: '/api/auth' });
  return sendSuccess(res, { message: 'Password changed. Please log in again.' });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  // do not reveal whether the email exists
  if (!user) return sendSuccess(res, { message: 'If that email exists, a reset link was sent.' });

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL?.split(',')[0]}/reset-password/${resetToken}`;
  const tpl = emailTemplates.passwordReset(user, resetUrl);
  await sendEmail({ to: user.email, ...tpl });

  return sendSuccess(res, { message: 'If that email exists, a reset link was sent.' });
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) return next(AppError.badRequest('Token is invalid or has expired'));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = [];
  await user.save();

  return sendSuccess(res, { message: 'Password reset successful. Please log in.' });
});

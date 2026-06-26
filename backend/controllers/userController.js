import { User } from '../models/User.js';
import { Performance } from '../models/Performance.js';
import { Task } from '../models/Task.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendPaginated } from '../utils/apiResponse.js';
import { ApiFeatures } from '../helpers/apiFeatures.js';
import { calculateUserPerformance } from '../services/performanceService.js';
import { normaliseFile } from '../middleware/upload.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { ROLES } from '../config/constants.js';

export const listUsers = catchAsync(async (req, res) => {
  const base = User.find().populate('department', 'name color').populate('createdBy', 'name');
  const features = new ApiFeatures(base, req.query)
    .filter()
    .search(['name', 'email', 'phone'])
    .sort()
    .paginate();

  const [users, total] = await Promise.all([
    features.query,
    User.countDocuments(new ApiFeatures(User.find(), req.query).filter().query.getFilter()),
  ]);

  return sendPaginated(res, { data: users, page: features.page, limit: features.limit, total });
});

export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate('department', 'name color');
  if (!user) return next(AppError.notFound('User not found'));

  const [performance, taskStats] = await Promise.all([
    Performance.findOne({ user: user._id }),
    Task.aggregate([
      { $match: { assignedTo: user._id, isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  return sendSuccess(res, { data: { user, performance, taskStats } });
});

export const createUser = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, department, role, joiningDate, status } = req.body;

  if (await User.findOne({ email })) return next(AppError.conflict('Email already in use'));

  // Only the Owner may create another Owner/Manager elevation isn't allowed for Managers
  if (req.user.role === ROLES.MANAGER && role && role !== ROLES.EMPLOYEE) {
    return next(AppError.forbidden('Managers can only create Employees'));
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    department: department || null,
    role: role || ROLES.EMPLOYEE,
    joiningDate,
    status,
    createdBy: req.user._id,
  });
  await Performance.create({ user: user._id });

  return sendSuccess(res, { statusCode: 201, message: 'User created', data: { user } });
});

export const updateUser = catchAsync(async (req, res, next) => {
  const target = await User.findById(req.params.id);
  if (!target) return next(AppError.notFound('User not found'));

  if (req.user.role === ROLES.MANAGER && target.role !== ROLES.EMPLOYEE) {
    return next(AppError.forbidden('Managers can only edit Employees'));
  }
  if (req.body.role === ROLES.OWNER && req.user.role !== ROLES.OWNER) {
    return next(AppError.forbidden('Only an Owner can grant Owner role'));
  }

  const allowed = ['name', 'email', 'phone', 'department', 'role', 'status', 'leaveStatus', 'joiningDate'];
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) target[f] = req.body[f];
  });
  if (req.body.password) target.password = req.body.password;

  await target.save();
  return sendSuccess(res, { message: 'User updated', data: { user: target } });
});

export const deleteUser = catchAsync(async (req, res, next) => {
  if (req.params.id === req.user._id.toString()) {
    return next(AppError.badRequest('You cannot delete your own account'));
  }
  const user = await User.findById(req.params.id);
  if (!user) return next(AppError.notFound('User not found'));
  if (user.role === ROLES.OWNER) return next(AppError.forbidden('Owner accounts cannot be deleted'));

  await user.deleteOne();
  await Performance.deleteOne({ user: user._id });
  return sendSuccess(res, { message: 'User deleted' });
});

export const uploadAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) return next(AppError.badRequest('No file uploaded'));
  const file = normaliseFile(req.file);

  const user = await User.findById(req.user._id);
  if (user.profileImagePublicId && isCloudinaryConfigured()) {
    cloudinary.uploader.destroy(user.profileImagePublicId).catch(() => {});
  }
  user.profileImage = file.url;
  user.profileImagePublicId = file.publicId;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, { message: 'Avatar updated', data: { profileImage: file.url } });
});

export const recalcUserPerformance = catchAsync(async (req, res) => {
  const performance = await calculateUserPerformance(req.params.id);
  return sendSuccess(res, { message: 'Performance recalculated', data: { performance } });
});

/** Lightweight list for assignee pickers / mentions. */
export const listAssignable = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.department) filter.department = req.query.department;
  const users = await User.find(filter).select('name email role profileImage department leaveStatus').limit(500);
  return sendSuccess(res, { data: { users } });
});

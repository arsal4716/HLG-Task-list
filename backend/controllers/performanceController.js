import { Performance } from '../models/Performance.js';
import { User } from '../models/User.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { calculateUserPerformance, calculateAllPerformance } from '../services/performanceService.js';

export const listPerformance = catchAsync(async (req, res) => {
  const rows = await Performance.find()
    .populate('user', 'name email profileImage department role')
    .sort('-performanceScore');
  return sendSuccess(res, { data: { performance: rows } });
});

export const getUserPerformance = catchAsync(async (req, res, next) => {
  let perf = await Performance.findOne({ user: req.params.id }).populate('user', 'name email profileImage');
  if (!perf) {
    const exists = await User.exists({ _id: req.params.id });
    if (!exists) return next(AppError.notFound('User not found'));
    perf = await calculateUserPerformance(req.params.id);
  }
  return sendSuccess(res, { data: { performance: perf } });
});

export const recalcAll = catchAsync(async (req, res) => {
  const users = await User.find().select('_id');
  await calculateAllPerformance(users.map((u) => u._id));
  return sendSuccess(res, { message: `Recalculated performance for ${users.length} users` });
});

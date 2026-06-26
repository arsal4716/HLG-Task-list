import { Holiday } from '../models/Holiday.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const listHolidays = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.year) {
    const y = parseInt(req.query.year, 10);
    filter.date = { $gte: new Date(y, 0, 1), $lte: new Date(y, 11, 31, 23, 59, 59) };
  }
  const holidays = await Holiday.find(filter).sort('date');
  return sendSuccess(res, { data: { holidays } });
});

export const createHoliday = catchAsync(async (req, res) => {
  const holiday = await Holiday.create({ ...req.body, createdBy: req.user._id });
  return sendSuccess(res, { statusCode: 201, message: 'Holiday added', data: { holiday } });
});

export const updateHoliday = catchAsync(async (req, res, next) => {
  const holiday = await Holiday.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!holiday) return next(AppError.notFound('Holiday not found'));
  return sendSuccess(res, { message: 'Holiday updated', data: { holiday } });
});

export const deleteHoliday = catchAsync(async (req, res, next) => {
  const holiday = await Holiday.findByIdAndDelete(req.params.id);
  if (!holiday) return next(AppError.notFound('Holiday not found'));
  return sendSuccess(res, { message: 'Holiday deleted' });
});

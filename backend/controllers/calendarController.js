import { Task } from '../models/Task.js';
import { Holiday } from '../models/Holiday.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ROLES } from '../config/constants.js';

/** Returns tasks (by due date) + holidays for a month/week/day window. */
export const getCalendar = catchAsync(async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year, 10) || now.getFullYear();
  const month = req.query.month !== undefined ? parseInt(req.query.month, 10) : now.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  const filter = { isDeleted: false, dueDate: { $gte: start, $lte: end } };
  if (req.user.role === ROLES.EMPLOYEE) filter.assignedTo = req.user._id;
  else if (req.user.role === ROLES.MANAGER && req.user.department) {
    filter.department = req.user.department._id || req.user.department;
  }

  const [tasks, holidays] = await Promise.all([
    Task.find(filter).select('title status priority dueDate assignedTo').populate('assignedTo', 'name'),
    Holiday.find({ date: { $gte: start, $lte: end } }),
  ]);

  return sendSuccess(res, { data: { tasks, holidays, range: { start, end } } });
});

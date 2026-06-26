import { Department } from '../models/Department.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const listDepartments = catchAsync(async (req, res) => {
  const departments = await Department.find().populate('manager', 'name email profileImage').sort('name');
  const withCounts = await Promise.all(
    departments.map(async (d) => {
      const [employees, tasks] = await Promise.all([
        User.countDocuments({ department: d._id }),
        Task.countDocuments({ department: d._id, isDeleted: false }),
      ]);
      return { ...d.toObject(), employeeCount: employees, taskCount: tasks };
    })
  );
  return sendSuccess(res, { data: { departments: withCounts } });
});

export const createDepartment = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  if (await Department.findOne({ name })) return next(AppError.conflict('Department already exists'));
  const department = await Department.create({ ...req.body, createdBy: req.user._id });
  return sendSuccess(res, { statusCode: 201, message: 'Department created', data: { department } });
});

export const updateDepartment = catchAsync(async (req, res, next) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!department) return next(AppError.notFound('Department not found'));
  return sendSuccess(res, { message: 'Department updated', data: { department } });
});

export const deleteDepartment = catchAsync(async (req, res, next) => {
  const inUse = await User.countDocuments({ department: req.params.id });
  if (inUse > 0) return next(AppError.badRequest(`Cannot delete: ${inUse} user(s) still assigned`));
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) return next(AppError.notFound('Department not found'));
  return sendSuccess(res, { message: 'Department deleted' });
});

import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Performance } from '../models/Performance.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { toCSV } from '../helpers/exporter.js';
import { TASK_STATUS } from '../config/constants.js';

const parseRange = (query) => {
  const end = query.to ? new Date(query.to) : new Date();
  const start = query.from ? new Date(query.from) : new Date(end.getTime() - 30 * 864e5);
  return { start, end };
};

const openStatuses = [TASK_STATUS.PENDING, TASK_STATUS.IN_PROGRESS, TASK_STATUS.REVIEW, TASK_STATUS.TESTING];

/** Per-employee summary report. */
export const employeeReport = catchAsync(async (req, res) => {
  const { start, end } = parseRange(req.query);
  const userFilter = req.query.department ? { department: req.query.department } : {};
  const users = await User.find(userFilter).select('name email department').populate('department', 'name');

  const rows = await Promise.all(
    users.map(async (u) => {
      const tasks = await Task.find({
        assignedTo: u._id,
        isDeleted: false,
        createdAt: { $gte: start, $lte: end },
      });
      const completed = tasks.filter((t) => t.status === TASK_STATUS.COMPLETED);
      const late = completed.filter((t) => t.dueDate && t.completedDate && t.completedDate > t.dueDate);
      const perf = await Performance.findOne({ user: u._id });
      return {
        employee: u.name,
        email: u.email,
        department: u.department?.name || '-',
        total: tasks.length,
        completed: completed.length,
        late: late.length,
        open: tasks.filter((t) => openStatuses.includes(t.status)).length,
        performanceScore: perf?.performanceScore || 0,
      };
    })
  );

  if (req.query.format === 'csv') return res.send(toCSV(rows, res, 'employee-report'));
  return sendSuccess(res, { data: { report: rows, range: { start, end } } });
});

/** Per-department aggregation. */
export const departmentReport = catchAsync(async (req, res) => {
  const { start, end } = parseRange(req.query);
  const departments = await Department.find();
  const rows = await Promise.all(
    departments.map(async (d) => {
      const tasks = await Task.find({
        department: d._id,
        isDeleted: false,
        createdAt: { $gte: start, $lte: end },
      });
      const completed = tasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length;
      const employees = await User.countDocuments({ department: d._id });
      return {
        department: d.name,
        employees,
        total: tasks.length,
        completed,
        open: tasks.filter((t) => openStatuses.includes(t.status)).length,
        completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      };
    })
  );

  if (req.query.format === 'csv') return res.send(toCSV(rows, res, 'department-report'));
  return sendSuccess(res, { data: { report: rows, range: { start, end } } });
});

/** Time-bucketed completion trend (daily/weekly/monthly). */
export const taskCompletionReport = catchAsync(async (req, res) => {
  const { start, end } = parseRange(req.query);
  const granularity = req.query.granularity || 'daily';
  const dateFormat = granularity === 'monthly' ? '%Y-%m' : granularity === 'weekly' ? '%Y-W%U' : '%Y-%m-%d';

  const rows = await Task.aggregate([
    { $match: { isDeleted: false, completedDate: { $gte: start, $lte: end }, status: TASK_STATUS.COMPLETED } },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$completedDate' } },
        completed: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return sendSuccess(res, { data: { report: rows.map((r) => ({ period: r._id, completed: r.completed })) } });
});

/** Overdue / late tasks listing. */
export const lateTasksReport = catchAsync(async (req, res) => {
  const now = new Date();
  const tasks = await Task.find({
    isDeleted: false,
    dueDate: { $lt: now },
    status: { $in: openStatuses },
  })
    .populate('assignedTo', 'name')
    .populate('department', 'name')
    .sort('dueDate')
    .limit(500);

  const rows = tasks.map((t) => ({
    title: t.title,
    priority: t.priority,
    status: t.status,
    department: t.department?.name || '-',
    assignedTo: (t.assignedTo || []).map((u) => u.name).join(', '),
    dueDate: t.dueDate?.toISOString().slice(0, 10),
    daysLate: Math.floor((now - new Date(t.dueDate)) / 864e5),
  }));

  if (req.query.format === 'csv') return res.send(toCSV(rows, res, 'late-tasks'));
  return sendSuccess(res, { data: { report: rows } });
});

/** Performance leaderboard. */
export const performanceReport = catchAsync(async (req, res) => {
  const rows = await Performance.find()
    .populate('user', 'name email department')
    .sort('-performanceScore')
    .limit(500);
  const report = rows.map((p) => ({
    employee: p.user?.name || 'Unknown',
    completedTasks: p.completedTasks,
    lateTasks: p.lateTasks,
    efficiency: p.efficiency,
    avgCompletionHours: p.averageCompletionHours,
    performanceScore: p.performanceScore,
  }));

  if (req.query.format === 'csv') return res.send(toCSV(report, res, 'performance-report'));
  return sendSuccess(res, { data: { report } });
});

import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { TaskHistory } from '../models/TaskHistory.js';
import { Performance } from '../models/Performance.js';
import { TimeLog } from '../models/TimeLog.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getEffectiveRole } from '../helpers/access.js';
import { ROLES, TASK_STATUS, TASK_PRIORITY } from '../config/constants.js';

const openStatuses = [
  TASK_STATUS.PENDING,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.REVIEW,
  TASK_STATUS.TESTING,
];

const statusBreakdown = async (match) => {
  const rows = await Task.aggregate([
    { $match: { isDeleted: false, ...match } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  return map;
};

const priorityBreakdown = async (match) => {
  const rows = await Task.aggregate([
    { $match: { isDeleted: false, ...match } },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
};

/** Owner: company-wide. Manager: department-scoped. Employee: personal. */
export const getDashboard = catchAsync(async (req, res) => {
  const role = getEffectiveRole(req.user);

  if (role === ROLES.OWNER) return ownerDashboard(req, res);
  if (role === ROLES.MANAGER) return managerDashboard(req, res);
  return employeeDashboard(req, res);
});

const ownerDashboard = async (req, res) => {
  const now = new Date();
  const [totalEmployees, statuses, priorities, overdue, totalTasks, recent, notifications, perfAgg] =
    await Promise.all([
      User.countDocuments({}),
      statusBreakdown({}),
      priorityBreakdown({}),
      Task.countDocuments({ isDeleted: false, dueDate: { $lt: now }, status: { $in: openStatuses } }),
      Task.countDocuments({ isDeleted: false }),
      TaskHistory.find().populate('user', 'name profileImage').populate('task', 'title').sort('-createdAt').limit(12),
      Notification.find({ recipient: req.user._id }).sort('-createdAt').limit(8),
      Performance.aggregate([{ $group: { _id: null, avg: { $avg: '$performanceScore' } } }]),
    ]);

  const completed = statuses[TASK_STATUS.COMPLETED] || 0;
  const performance = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;

  return sendSuccess(res, {
    data: {
      role: ROLES.OWNER,
      stats: {
        totalEmployees,
        totalTasks,
        completed,
        pending: statuses[TASK_STATUS.PENDING] || 0,
        inProgress: statuses[TASK_STATUS.IN_PROGRESS] || 0,
        overdue,
        critical: priorities[TASK_PRIORITY.CRITICAL] || 0,
        performance,
        avgPerformanceScore: Math.round(perfAgg[0]?.avg || 0),
      },
      charts: { statuses, priorities },
      recentActivities: recent,
      notifications,
    },
  });
};

const managerDashboard = async (req, res) => {
  const deptId = req.user.department?._id || req.user.department;
  const match = deptId ? { department: deptId } : {};
  const now = new Date();

  const [statuses, priorities, employees, deadlines, overdue, totalTasks] = await Promise.all([
    statusBreakdown(match),
    priorityBreakdown(match),
    User.countDocuments(deptId ? { department: deptId } : {}),
    Task.find({ isDeleted: false, ...match, dueDate: { $gte: now }, status: { $in: openStatuses } })
      .populate('assignedTo', 'name profileImage')
      .sort('dueDate')
      .limit(8),
    Task.countDocuments({ isDeleted: false, ...match, dueDate: { $lt: now }, status: { $in: openStatuses } }),
    Task.countDocuments({ isDeleted: false, ...match }),
  ]);

  const completed = statuses[TASK_STATUS.COMPLETED] || 0;
  return sendSuccess(res, {
    data: {
      role: ROLES.MANAGER,
      stats: {
        assignedTasks: totalTasks,
        completed,
        pending: statuses[TASK_STATUS.PENDING] || 0,
        inProgress: statuses[TASK_STATUS.IN_PROGRESS] || 0,
        overdue,
        employees,
        critical: priorities[TASK_PRIORITY.CRITICAL] || 0,
        departmentProgress: totalTasks ? Math.round((completed / totalTasks) * 100) : 0,
      },
      charts: { statuses, priorities },
      deadlines,
    },
  });
};

const employeeDashboard = async (req, res) => {
  const uid = req.user._id;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  const match = { assignedTo: uid };
  const [statuses, todays, activeTimer, notifications, performance] = await Promise.all([
    statusBreakdown(match),
    Task.find({
      isDeleted: false,
      assignedTo: uid,
      dueDate: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort('priority')
      .limit(10),
    TimeLog.findOne({ user: uid, endedAt: null }).populate('task', 'title'),
    Notification.find({ recipient: uid }).sort('-createdAt').limit(8),
    Performance.findOne({ user: uid }),
  ]);

  const myTasks = Object.values(statuses).reduce((a, b) => a + b, 0);
  return sendSuccess(res, {
    data: {
      role: ROLES.EMPLOYEE,
      stats: {
        myTasks,
        completed: statuses[TASK_STATUS.COMPLETED] || 0,
        pending: statuses[TASK_STATUS.PENDING] || 0,
        inProgress: statuses[TASK_STATUS.IN_PROGRESS] || 0,
        todaysTasks: todays.length,
        performanceScore: performance?.performanceScore || 0,
      },
      charts: { statuses },
      todaysTasks: todays,
      currentTimer: activeTimer ? { ...activeTimer.toObject(), liveSeconds: activeTimer.liveDuration() } : null,
      notifications,
    },
  });
};

import { TimeLog } from '../models/TimeLog.js';
import { Task } from '../models/Task.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { syncTaskActualHours, aggregateTime } from '../services/timeService.js';
import { TASK_STATUS } from '../config/constants.js';

const startOf = (unit) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (unit === 'week') d.setDate(d.getDate() - d.getDay());
  if (unit === 'month') d.setDate(1);
  return d;
};

/** A user may only have one running timer at a time. */
export const startTimer = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.taskId);
  if (!task || task.isDeleted) return next(AppError.notFound('Task not found'));

  const running = await TimeLog.findOne({ user: req.user._id, endedAt: null });
  if (running) return next(AppError.conflict('You already have a running timer. Stop it first.'));

  const log = await TimeLog.create({ task: task._id, user: req.user._id, startedAt: new Date() });
  if (task.status === TASK_STATUS.PENDING) {
    task.status = TASK_STATUS.IN_PROGRESS;
    if (!task.startDate) task.startDate = new Date();
    await task.save();
  }
  return sendSuccess(res, { statusCode: 201, message: 'Timer started', data: { log } });
});

export const pauseTimer = catchAsync(async (req, res, next) => {
  const log = await TimeLog.findOne({ _id: req.params.id, user: req.user._id, endedAt: null });
  if (!log) return next(AppError.notFound('No running timer found'));
  if (log.isPaused) return next(AppError.badRequest('Timer already paused'));
  log.isPaused = true;
  log.pausedAt = new Date();
  await log.save();
  return sendSuccess(res, { message: 'Timer paused', data: { log } });
});

export const resumeTimer = catchAsync(async (req, res, next) => {
  const log = await TimeLog.findOne({ _id: req.params.id, user: req.user._id, endedAt: null });
  if (!log) return next(AppError.notFound('No running timer found'));
  if (!log.isPaused) return next(AppError.badRequest('Timer is not paused'));
  log.pausedMs += Date.now() - log.pausedAt.getTime();
  log.isPaused = false;
  log.pausedAt = null;
  await log.save();
  return sendSuccess(res, { message: 'Timer resumed', data: { log } });
});

export const stopTimer = catchAsync(async (req, res, next) => {
  const log = await TimeLog.findOne({ _id: req.params.id, user: req.user._id, endedAt: null });
  if (!log) return next(AppError.notFound('No running timer found'));
  if (log.isPaused) {
    log.pausedMs += Date.now() - log.pausedAt.getTime();
    log.isPaused = false;
    log.pausedAt = null;
  }
  log.endedAt = new Date();
  log.durationSeconds = log.liveDuration();
  if (req.body.note) log.note = req.body.note;
  await log.save();

  const actualHours = await syncTaskActualHours(log.task);
  return sendSuccess(res, { message: 'Timer stopped', data: { log, actualHours } });
});

/** Currently running/paused timer for the logged-in user, if any. */
export const getActiveTimer = catchAsync(async (req, res) => {
  const log = await TimeLog.findOne({ user: req.user._id, endedAt: null }).populate('task', 'title');
  return sendSuccess(res, {
    data: { log: log ? { ...log.toObject(), liveSeconds: log.liveDuration() } : null },
  });
});

export const getTaskTimeLogs = catchAsync(async (req, res) => {
  const logs = await TimeLog.find({ task: req.params.taskId })
    .populate('user', 'name profileImage')
    .sort('-startedAt');
  const totalSeconds = logs.reduce((s, l) => s + (l.durationSeconds || l.liveDuration()), 0);
  return sendSuccess(res, { data: { logs, totalSeconds } });
});

export const getMyTimeSummary = catchAsync(async (req, res) => {
  const [daily, weekly, monthly] = await Promise.all([
    aggregateTime(req.user._id, startOf('day')),
    aggregateTime(req.user._id, startOf('week')),
    aggregateTime(req.user._id, startOf('month')),
  ]);
  return sendSuccess(res, {
    data: {
      dailySeconds: daily,
      weeklySeconds: weekly,
      monthlySeconds: monthly,
      dailyHours: Math.round((daily / 3600) * 100) / 100,
      weeklyHours: Math.round((weekly / 3600) * 100) / 100,
      monthlyHours: Math.round((monthly / 3600) * 100) / 100,
    },
  });
});

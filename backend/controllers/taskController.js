import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { TaskHistory } from '../models/TaskHistory.js';
import { Comment } from '../models/Comment.js';
import { Attachment } from '../models/Attachment.js';
import { TimeLog } from '../models/TimeLog.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendPaginated } from '../utils/apiResponse.js';
import { ApiFeatures } from '../helpers/apiFeatures.js';
import { recordHistory } from '../services/historyService.js';
import { notify } from '../services/notificationService.js';
import { calculateUserPerformance } from '../services/performanceService.js';
import { normaliseFile } from '../middleware/upload.js';
import { emitToUsers, broadcast } from '../sockets/io.js';
import { getEffectiveRole } from '../helpers/access.js';
import {
  ROLES,
  TASK_STATUS,
  HISTORY_ACTIONS,
  NOTIFICATION_TYPES,
  SOCKET_EVENTS,
} from '../config/constants.js';

const POPULATE = [
  { path: 'assignedTo', select: 'name email profileImage role leaveStatus' },
  { path: 'assignedBy', select: 'name email profileImage role' },
  { path: 'department', select: 'name color' },
];

/**
 * Visibility scope. Owner (and IT-department users, who are elevated to Owner)
 * see everything; Managers see their department; Employees see only their own.
 */
const scopeForUser = (user) => {
  const role = getEffectiveRole(user);
  if (role === ROLES.OWNER) return {};
  if (role === ROLES.MANAGER) {
    return user.department
      ? { $or: [{ department: user.department._id || user.department }, { assignedBy: user._id }, { assignedTo: user._id }] }
      : {};
  }
  return { assignedTo: user._id };
};

/**
 * Notify (in-app + email) the users newly assigned to a task. `task` must be
 * populated (assignedTo with name+email). `newIds` is the list of user ids that
 * were just added. Every assignee is emailed at their registered address.
 */
const notifyAssignees = async ({ req, task, newIds, type = NOTIFICATION_TYPES.ASSIGNMENT, title = 'You were assigned a task' }) => {
  const ids = (newIds || []).map((x) => x.toString());
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const users = (task.assignedTo || []).filter((u) => idSet.has((u._id || u).toString()));
  await notify({
    recipients: ids,
    sender: req.user._id,
    type,
    title,
    message: `${req.user.name} assigned you "${task.title}"`,
    task: task._id,
    link: `/tasks/${task._id}`,
    email: { template: 'taskAssigned', users, task },
  });
};

export const listTasks = catchAsync(async (req, res) => {
  const baseFilter = {
    isDeleted: req.query.includeDeleted === 'true' ? undefined : false,
    isArchived: req.query.archived === 'true' ? true : false,
    ...scopeForUser(req.user),
  };
  Object.keys(baseFilter).forEach((k) => baseFilter[k] === undefined && delete baseFilter[k]);

  const features = new ApiFeatures(Task.find(baseFilter).populate(POPULATE), req.query)
    .filter()
    .search(['title', 'description'])
    .sort()
    .paginate();

  const countFilter = { ...baseFilter, ...new ApiFeatures(Task.find(), req.query).filter().query.getFilter() };
  const [tasks, total] = await Promise.all([features.query, Task.countDocuments(countFilter)]);

  return sendPaginated(res, { data: tasks, page: features.page, limit: features.limit, total });
});

export const getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate(POPULATE);
  if (!task || task.isDeleted) return next(AppError.notFound('Task not found'));
  return sendSuccess(res, { data: { task } });
});

export const createTask = catchAsync(async (req, res, next) => {
  const payload = { ...req.body, assignedBy: req.user._id };
  if (payload.status === TASK_STATUS.IN_PROGRESS && !payload.startDate) payload.startDate = new Date();

  const task = await Task.create(payload);
  await task.populate(POPULATE);

  await recordHistory({ task: task._id, user: req.user._id, action: HISTORY_ACTIONS.CREATED, req });

  const assignees = (task.assignedTo || []).map((u) => u._id || u);
  if (assignees.length) {
    await notifyAssignees({
      req,
      task,
      newIds: assignees,
      type: NOTIFICATION_TYPES.NEW_TASK,
      title: 'New task assigned',
    });
    emitToUsers(assignees, SOCKET_EVENTS.TASK_CREATED, task);
  }

  return sendSuccess(res, { statusCode: 201, message: 'Task created', data: { task } });
});

/** Diff-aware update that records history + fires notifications per changed field. */
export const updateTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task || task.isDeleted) return next(AppError.notFound('Task not found'));

  const tracked = ['title', 'description', 'priority', 'status', 'dueDate', 'estimatedHours', 'actualHours', 'department', 'tags'];
  const historyEntries = [];

  // Assignee changes also flow through here (the edit form sends assignedTo).
  let newlyAssigned = [];
  if (Array.isArray(req.body.assignedTo)) {
    const beforeIds = (task.assignedTo || []).map((x) => x.toString());
    const afterIds = req.body.assignedTo.map((x) => x.toString());
    if (JSON.stringify([...beforeIds].sort()) !== JSON.stringify([...afterIds].sort())) {
      newlyAssigned = afterIds.filter((id) => !beforeIds.includes(id));
      task.assignedTo = req.body.assignedTo;
      historyEntries.push({ action: HISTORY_ACTIONS.ASSIGNED, field: 'assignedTo', from: beforeIds, to: afterIds });
    }
  }

  for (const field of tracked) {
    if (req.body[field] === undefined) continue;
    const before = task[field];
    const after = req.body[field];
    const changed = JSON.stringify(before) !== JSON.stringify(after);
    if (!changed) continue;

    task[field] = after;

    if (field === 'status') {
      historyEntries.push({ action: HISTORY_ACTIONS.STATUS_CHANGED, field, from: before, to: after });
      if (after === TASK_STATUS.IN_PROGRESS && !task.startDate) task.startDate = new Date();
      if (after === TASK_STATUS.COMPLETED) task.completedDate = new Date();
      if (before === TASK_STATUS.COMPLETED && after !== TASK_STATUS.COMPLETED) task.completedDate = null;
    } else if (field === 'priority') {
      historyEntries.push({ action: HISTORY_ACTIONS.PRIORITY_CHANGED, field, from: before, to: after });
    } else if (field === 'dueDate') {
      historyEntries.push({ action: HISTORY_ACTIONS.DUE_DATE_CHANGED, field, from: before, to: after });
    } else {
      historyEntries.push({ action: HISTORY_ACTIONS.UPDATED, field, from: before, to: after });
    }
  }

  await task.save();
  await task.populate(POPULATE);

  await Promise.all(
    historyEntries.map((e) => recordHistory({ task: task._id, user: req.user._id, req, ...e }))
  );

  // Notifications for meaningful transitions
  const assignees = (task.assignedTo || []).map((u) => u._id || u);
  const statusEntry = historyEntries.find((e) => e.field === 'status');
  if (statusEntry) {
    const recipients = [...assignees, task.assignedBy].map((x) => x.toString());
    let type = NOTIFICATION_TYPES.COMPLETED;
    if (statusEntry.to === TASK_STATUS.REVIEW) type = NOTIFICATION_TYPES.REVIEW_REQUIRED;
    else if (statusEntry.to === TASK_STATUS.REJECTED) type = NOTIFICATION_TYPES.REJECTED;
    else type = NOTIFICATION_TYPES.COMPLETED;

    await notify({
      recipients,
      sender: req.user._id,
      type,
      title: `Task ${statusEntry.to}`,
      message: `"${task.title}" moved to ${statusEntry.to}`,
      task: task._id,
      link: `/tasks/${task._id}`,
    });

    if (statusEntry.to === TASK_STATUS.COMPLETED) {
      assignees.forEach((id) => calculateUserPerformance(id).catch(() => {}));
    }
  }

  // Email + in-app notify anyone newly assigned during this edit.
  if (newlyAssigned.length) {
    await notifyAssignees({ req, task, newIds: newlyAssigned });
    emitToUsers(newlyAssigned, SOCKET_EVENTS.TASK_CREATED, task);
  }

  emitToUsers([...assignees, task.assignedBy], SOCKET_EVENTS.TASK_UPDATED, task);
  return sendSuccess(res, { message: 'Task updated', data: { task } });
});

export const deleteTask = catchAsync(async (req, res, next) => {
  const hard = req.query.hard === 'true' && req.user.role === ROLES.OWNER;
  const task = await Task.findById(req.params.id);
  if (!task) return next(AppError.notFound('Task not found'));

  if (hard) {
    await Promise.all([
      Comment.deleteMany({ task: task._id }),
      TaskHistory.deleteMany({ task: task._id }),
      Attachment.deleteMany({ task: task._id }),
      TimeLog.deleteMany({ task: task._id }),
      task.deleteOne(),
    ]);
  } else {
    task.isDeleted = true;
    task.deletedAt = new Date();
    await task.save();
    await recordHistory({ task: task._id, user: req.user._id, action: HISTORY_ACTIONS.DELETED, req });
  }

  broadcast(SOCKET_EVENTS.TASK_DELETED, { id: task._id });
  return sendSuccess(res, { message: hard ? 'Task permanently deleted' : 'Task deleted' });
});

export const assignTask = catchAsync(async (req, res, next) => {
  const { assignedTo } = req.body;
  if (!Array.isArray(assignedTo)) return next(AppError.badRequest('assignedTo must be an array'));

  const task = await Task.findById(req.params.id);
  if (!task || task.isDeleted) return next(AppError.notFound('Task not found'));

  const before = task.assignedTo.map((x) => x.toString());
  task.assignedTo = assignedTo;
  await task.save();
  await task.populate(POPULATE);

  await recordHistory({
    task: task._id,
    user: req.user._id,
    action: HISTORY_ACTIONS.ASSIGNED,
    field: 'assignedTo',
    from: before,
    to: assignedTo,
    req,
  });

  const newlyAdded = assignedTo.map(String).filter((id) => !before.includes(id));
  if (newlyAdded.length) {
    await notifyAssignees({ req, task, newIds: newlyAdded });
  }
  emitToUsers(assignedTo, SOCKET_EVENTS.TASK_UPDATED, task);
  return sendSuccess(res, { message: 'Task assigned', data: { task } });
});

export const duplicateTask = catchAsync(async (req, res, next) => {
  const src = await Task.findById(req.params.id).lean();
  if (!src || src.isDeleted) return next(AppError.notFound('Task not found'));

  delete src._id;
  delete src.createdAt;
  delete src.updatedAt;
  const copy = await Task.create({
    ...src,
    title: `${src.title} (Copy)`,
    status: TASK_STATUS.PENDING,
    assignedBy: req.user._id,
    completedDate: null,
    startDate: null,
    actualHours: 0,
    commentCount: 0,
    attachments: [],
  });
  await copy.populate(POPULATE);
  await recordHistory({ task: copy._id, user: req.user._id, action: HISTORY_ACTIONS.DUPLICATED, req });
  return sendSuccess(res, { statusCode: 201, message: 'Task duplicated', data: { task: copy } });
});

export const archiveTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(AppError.notFound('Task not found'));
  task.isArchived = req.body.archive !== false;
  await task.save();
  await recordHistory({
    task: task._id,
    user: req.user._id,
    action: task.isArchived ? HISTORY_ACTIONS.ARCHIVED : HISTORY_ACTIONS.RESTORED,
    req,
  });
  return sendSuccess(res, { message: task.isArchived ? 'Task archived' : 'Task restored', data: { task } });
});

export const restoreTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(AppError.notFound('Task not found'));
  task.isDeleted = false;
  task.deletedAt = null;
  task.isArchived = false;
  await task.save();
  await recordHistory({ task: task._id, user: req.user._id, action: HISTORY_ACTIONS.RESTORED, req });
  return sendSuccess(res, { message: 'Task restored', data: { task } });
});

/* ---------------- Checklist ---------------- */

export const addChecklistItem = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(AppError.notFound('Task not found'));
  task.checklist.push({ text: req.body.text });
  await task.save();
  return sendSuccess(res, { message: 'Checklist item added', data: { task } });
});

export const toggleChecklistItem = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(AppError.notFound('Task not found'));
  const item = task.checklist.id(req.params.itemId);
  if (!item) return next(AppError.notFound('Checklist item not found'));
  item.completed = !item.completed;
  item.completedAt = item.completed ? new Date() : null;
  item.completedBy = item.completed ? req.user._id : null;
  await task.save();
  return sendSuccess(res, { message: 'Checklist updated', data: { task } });
});

export const removeChecklistItem = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(AppError.notFound('Task not found'));
  task.checklist.pull(req.params.itemId);
  await task.save();
  return sendSuccess(res, { message: 'Checklist item removed', data: { task } });
});

/* ---------------- Attachments ---------------- */

export const uploadAttachments = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next(AppError.badRequest('No files uploaded'));
  const task = await Task.findById(req.params.id);
  if (!task) return next(AppError.notFound('Task not found'));

  const normalised = req.files.map((f) => ({ ...normaliseFile(f), uploadedBy: req.user._id, uploadedAt: new Date() }));
  task.attachments.push(...normalised);
  await task.save();

  await Attachment.insertMany(
    normalised.map((n) => ({ task: task._id, uploadedBy: req.user._id, ...n }))
  );
  await recordHistory({ task: task._id, user: req.user._id, action: HISTORY_ACTIONS.ATTACHMENT_UPLOADED, req });

  return sendSuccess(res, { message: 'Files uploaded', data: { attachments: task.attachments } });
});

export const removeAttachment = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(AppError.notFound('Task not found'));
  task.attachments.pull(req.params.attachmentId);
  await task.save();
  await Attachment.deleteOne({ _id: req.params.attachmentId });
  return sendSuccess(res, { message: 'Attachment removed', data: { task } });
});

/* ---------------- History ---------------- */

export const getTaskHistory = catchAsync(async (req, res) => {
  const history = await TaskHistory.find({ task: req.params.id })
    .populate('user', 'name profileImage')
    .sort('-createdAt')
    .limit(200);
  return sendSuccess(res, { data: { history } });
});

/* ---------------- Bulk operations ---------------- */

export const bulkAction = catchAsync(async (req, res, next) => {
  const { ids, action, value } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return next(AppError.badRequest('ids array required'));
  const objectIds = ids.filter((id) => mongoose.isValidObjectId(id));

  let update = null;
  let historyAction = HISTORY_ACTIONS.UPDATED;

  switch (action) {
    case 'delete':
      update = { isDeleted: true, deletedAt: new Date() };
      historyAction = HISTORY_ACTIONS.DELETED;
      break;
    case 'archive':
      update = { isArchived: true };
      historyAction = HISTORY_ACTIONS.ARCHIVED;
      break;
    case 'status':
      update = { status: value };
      historyAction = HISTORY_ACTIONS.STATUS_CHANGED;
      break;
    case 'priority':
      update = { priority: value };
      historyAction = HISTORY_ACTIONS.PRIORITY_CHANGED;
      break;
    case 'assign':
      update = { assignedTo: value };
      historyAction = HISTORY_ACTIONS.ASSIGNED;
      break;
    default:
      return next(AppError.badRequest('Unknown bulk action'));
  }

  const result = await Task.updateMany({ _id: { $in: objectIds } }, update);
  await TaskHistory.insertMany(
    objectIds.map((task) => ({ task, user: req.user._id, action: historyAction, to: value ?? null }))
  );
  broadcast(SOCKET_EVENTS.TASK_UPDATED, { bulk: true, ids: objectIds });

  return sendSuccess(res, { message: `Bulk ${action} applied`, data: { matched: result.matchedCount, modified: result.modifiedCount } });
});

/** Kanban reorder / move column. */
export const moveTask = catchAsync(async (req, res, next) => {
  const { status, boardOrder } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task || task.isDeleted) return next(AppError.notFound('Task not found'));

  const prevStatus = task.status;
  if (status !== undefined) task.status = status;
  if (boardOrder !== undefined) task.boardOrder = boardOrder;
  if (status === TASK_STATUS.COMPLETED) task.completedDate = new Date();
  await task.save();
  await task.populate(POPULATE);

  if (status && status !== prevStatus) {
    await recordHistory({
      task: task._id,
      user: req.user._id,
      action: HISTORY_ACTIONS.STATUS_CHANGED,
      field: 'status',
      from: prevStatus,
      to: status,
      req,
    });
  }
  emitToUsers([...task.assignedTo.map((u) => u._id || u), task.assignedBy], SOCKET_EVENTS.TASK_UPDATED, task);
  return sendSuccess(res, { message: 'Task moved', data: { task } });
});

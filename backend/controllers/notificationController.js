import { Notification } from '../models/Notification.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendPaginated } from '../utils/apiResponse.js';
import { markAllRead } from '../services/notificationService.js';

export const listNotifications = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const filter = { recipient: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('sender', 'name profileImage')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  return sendPaginated(res, { data: items, page, limit, total, meta: { unreadCount } });
});

export const unreadCount = catchAsync(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  return sendSuccess(res, { data: { count } });
});

export const markRead = catchAsync(async (req, res, next) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notif) return next(AppError.notFound('Notification not found'));
  return sendSuccess(res, { message: 'Marked as read', data: { notification: notif } });
});

export const markAll = catchAsync(async (req, res) => {
  await markAllRead(req.user._id);
  return sendSuccess(res, { message: 'All notifications marked as read' });
});

export const removeNotification = catchAsync(async (req, res, next) => {
  const notif = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  if (!notif) return next(AppError.notFound('Notification not found'));
  return sendSuccess(res, { message: 'Notification deleted' });
});

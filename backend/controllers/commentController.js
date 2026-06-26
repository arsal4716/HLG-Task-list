import { Comment } from '../models/Comment.js';
import { Task } from '../models/Task.js';
import { Attachment } from '../models/Attachment.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { recordHistory } from '../services/historyService.js';
import { notify } from '../services/notificationService.js';
import { normaliseFile } from '../middleware/upload.js';
import { getIO } from '../sockets/io.js';
import { HISTORY_ACTIONS, NOTIFICATION_TYPES, SOCKET_EVENTS } from '../config/constants.js';

export const listComments = catchAsync(async (req, res) => {
  const comments = await Comment.find({ task: req.params.taskId, isDeleted: false })
    .populate('author', 'name profileImage role')
    .populate('mentions', 'name')
    .sort('createdAt');
  return sendSuccess(res, { data: { comments } });
});

export const addComment = catchAsync(async (req, res, next) => {
  const { text, codeBlock, mentions, parent } = req.body;
  const task = await Task.findById(req.params.taskId);
  if (!task || task.isDeleted) return next(AppError.notFound('Task not found'));

  const attachments = (req.files || []).map((f) => {
    const n = normaliseFile(f);
    return { fileName: n.fileName, url: n.url, publicId: n.publicId, fileType: n.fileType, size: n.size };
  });

  if (!text && !codeBlock && attachments.length === 0) {
    return next(AppError.badRequest('Comment must include text, code, or an attachment'));
  }

  const mentionIds = Array.isArray(mentions) ? mentions : mentions ? [mentions] : [];

  const comment = await Comment.create({
    task: task._id,
    author: req.user._id,
    text: text || '',
    codeBlock: codeBlock || '',
    mentions: mentionIds,
    parent: parent || null,
    attachments,
  });
  await comment.populate('author', 'name profileImage role');

  task.commentCount += 1;
  await task.save();

  if (attachments.length) {
    await Attachment.insertMany(
      attachments.map((a) => ({ ...a, task: task._id, comment: comment._id, uploadedBy: req.user._id }))
    );
  }

  await recordHistory({ task: task._id, user: req.user._id, action: HISTORY_ACTIONS.COMMENT_ADDED, req });

  // notify assignees + author of task (excluding commenter)
  const recipients = [...task.assignedTo, task.assignedBy].map((x) => x.toString());
  await notify({
    recipients,
    sender: req.user._id,
    type: NOTIFICATION_TYPES.COMMENT,
    title: 'New comment',
    message: `${req.user.name} commented on "${task.title}"`,
    task: task._id,
    link: `/tasks/${task._id}`,
  });

  if (mentionIds.length) {
    await notify({
      recipients: mentionIds,
      sender: req.user._id,
      type: NOTIFICATION_TYPES.MENTION,
      title: 'You were mentioned',
      message: `${req.user.name} mentioned you on "${task.title}"`,
      task: task._id,
      link: `/tasks/${task._id}`,
    });
  }

  getIO().to(`task:${task._id}`).emit(SOCKET_EVENTS.COMMENT_ADDED, comment);
  return sendSuccess(res, { statusCode: 201, message: 'Comment added', data: { comment } });
});

export const updateComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.isDeleted) return next(AppError.notFound('Comment not found'));
  if (comment.author.toString() !== req.user._id.toString()) {
    return next(AppError.forbidden('You can only edit your own comments'));
  }
  comment.text = req.body.text ?? comment.text;
  comment.codeBlock = req.body.codeBlock ?? comment.codeBlock;
  comment.isEdited = true;
  await comment.save();
  return sendSuccess(res, { message: 'Comment updated', data: { comment } });
});

export const deleteComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.isDeleted) return next(AppError.notFound('Comment not found'));
  const isAuthor = comment.author.toString() === req.user._id.toString();
  if (!isAuthor && req.user.role === 'Employee') {
    return next(AppError.forbidden('You can only delete your own comments'));
  }
  comment.isDeleted = true;
  await comment.save();
  await Task.findByIdAndUpdate(comment.task, { $inc: { commentCount: -1 } });
  return sendSuccess(res, { message: 'Comment deleted' });
});

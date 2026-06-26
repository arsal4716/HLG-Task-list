import { Router } from 'express';
import * as tasks from '../controllers/taskController.js';
import * as comments from '../controllers/commentController.js';
import * as time from '../controllers/timeLogController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import { createTaskRules, updateTaskRules } from '../validators/taskValidator.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(protect);

const managerOrOwner = authorize(ROLES.OWNER, ROLES.MANAGER);

// Collection
router.get('/', tasks.listTasks);
router.post('/', managerOrOwner, validate(createTaskRules), tasks.createTask);

// Bulk
router.post('/bulk', managerOrOwner, tasks.bulkAction);

// Single task
router.get('/:id', tasks.getTask);
router.patch('/:id', validate(updateTaskRules), tasks.updateTask);
router.delete('/:id', managerOrOwner, tasks.deleteTask);

// Actions
router.patch('/:id/assign', managerOrOwner, tasks.assignTask);
router.post('/:id/duplicate', managerOrOwner, tasks.duplicateTask);
router.patch('/:id/archive', managerOrOwner, tasks.archiveTask);
router.patch('/:id/restore', managerOrOwner, tasks.restoreTask);
router.patch('/:id/move', tasks.moveTask);
router.get('/:id/history', tasks.getTaskHistory);

// Checklist
router.post('/:id/checklist', tasks.addChecklistItem);
router.patch('/:id/checklist/:itemId', tasks.toggleChecklistItem);
router.delete('/:id/checklist/:itemId', tasks.removeChecklistItem);

// Attachments
router.post('/:id/attachments', upload.array('files', 10), tasks.uploadAttachments);
router.delete('/:id/attachments/:attachmentId', tasks.removeAttachment);

// Comments (nested)
router.get('/:taskId/comments', comments.listComments);
router.post('/:taskId/comments', upload.array('files', 5), comments.addComment);

// Time tracking (nested)
router.get('/:taskId/timelogs', time.getTaskTimeLogs);
router.post('/:taskId/timer/start', time.startTimer);

export default router;

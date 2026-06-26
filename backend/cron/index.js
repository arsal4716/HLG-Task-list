import cron from 'node-cron';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { Settings } from '../models/Settings.js';
import { notify } from '../services/notificationService.js';
import { calculateAllPerformance } from '../services/performanceService.js';
import { NOTIFICATION_TYPES, TASK_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

const openStatuses = [TASK_STATUS.PENDING, TASK_STATUS.IN_PROGRESS, TASK_STATUS.REVIEW, TASK_STATUS.TESTING];

/** Hourly: warn assignees about tasks due within the reminder window. */
const deadlineReminderJob = async () => {
  try {
    const settings = await Settings.getSingleton();
    const hours = settings.notificationSettings.deadlineReminderHours || 24;
    const now = new Date();
    const soon = new Date(now.getTime() + hours * 36e5);

    const tasks = await Task.find({
      isDeleted: false,
      status: { $in: openStatuses },
      dueDate: { $gte: now, $lte: soon },
    }).populate('assignedTo', 'name email');

    for (const task of tasks) {
      const recipients = (task.assignedTo || []).map((u) => u._id);
      if (!recipients.length) continue;
      // eslint-disable-next-line no-await-in-loop
      await notify({
        recipients,
        type: NOTIFICATION_TYPES.DEADLINE,
        title: 'Deadline approaching',
        message: `"${task.title}" is due ${new Date(task.dueDate).toLocaleString()}`,
        task: task._id,
        link: `/tasks/${task._id}`,
        email: task.assignedTo[0]
          ? { template: 'deadlineReminder', user: task.assignedTo[0], task }
          : null,
      });
    }
    if (tasks.length) logger.info(`Deadline reminders sent for ${tasks.length} task(s)`);
  } catch (err) {
    logger.error(`deadlineReminderJob failed: ${err.message}`);
  }
};

/** Nightly: notify about overdue tasks. */
const overdueJob = async () => {
  try {
    const now = new Date();
    const tasks = await Task.find({
      isDeleted: false,
      status: { $in: openStatuses },
      dueDate: { $lt: now },
    });
    for (const task of tasks) {
      const recipients = [...(task.assignedTo || []), task.assignedBy];
      // eslint-disable-next-line no-await-in-loop
      await notify({
        recipients,
        type: NOTIFICATION_TYPES.DEADLINE,
        title: 'Task overdue',
        message: `"${task.title}" is overdue`,
        task: task._id,
        link: `/tasks/${task._id}`,
      });
    }
    if (tasks.length) logger.info(`Overdue notifications sent for ${tasks.length} task(s)`);
  } catch (err) {
    logger.error(`overdueJob failed: ${err.message}`);
  }
};

/** Nightly: recompute everyone's performance snapshot. */
const performanceJob = async () => {
  try {
    const users = await User.find().select('_id');
    await calculateAllPerformance(users.map((u) => u._id));
    logger.info(`Performance recalculated for ${users.length} users`);
  } catch (err) {
    logger.error(`performanceJob failed: ${err.message}`);
  }
};

export const startCronJobs = () => {
  // every hour
  cron.schedule('0 * * * *', deadlineReminderJob);
  // every day at 02:00
  cron.schedule('0 2 * * *', overdueJob);
  // every day at 03:00
  cron.schedule('0 3 * * *', performanceJob);
  logger.info('Cron jobs scheduled (deadline reminders, overdue, performance)');
};

export default startCronJobs;

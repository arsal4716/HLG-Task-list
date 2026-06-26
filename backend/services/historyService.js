import { TaskHistory } from '../models/TaskHistory.js';
import { logger } from '../utils/logger.js';

/**
 * Append an immutable audit record for a task. `req` is optional and used to
 * capture IP / user-agent.
 */
export const recordHistory = async ({ task, user, action, field = '', from = null, to = null, note = '', req = null }) => {
  try {
    return await TaskHistory.create({
      task,
      user,
      action,
      field,
      from,
      to,
      note,
      ip: req ? req.ip || req.headers['x-forwarded-for'] || '' : '',
      userAgent: req ? req.headers['user-agent'] || '' : '',
    });
  } catch (err) {
    logger.error(`recordHistory failed: ${err.message}`);
    return null;
  }
};

export default recordHistory;

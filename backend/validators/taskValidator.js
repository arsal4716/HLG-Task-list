import { required, maxLen, isIn, isArray, isDate, isNumber } from './rules.js';
import { TASK_STATUS_VALUES, TASK_PRIORITY_VALUES } from '../config/constants.js';

export const createTaskRules = {
  title: [required, maxLen(160)],
  priority: [isIn(TASK_PRIORITY_VALUES)],
  status: [isIn(TASK_STATUS_VALUES)],
  assignedTo: [isArray],
  dueDate: [isDate],
  estimatedHours: [isNumber],
};

export const updateTaskRules = {
  title: [maxLen(160)],
  priority: [isIn(TASK_PRIORITY_VALUES)],
  status: [isIn(TASK_STATUS_VALUES)],
  dueDate: [isDate],
  estimatedHours: [isNumber],
};

export const commentRules = {
  // text OR codeBlock OR attachments — soft validated in controller
};

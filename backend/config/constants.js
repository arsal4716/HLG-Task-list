/**
 * Centralised enums / constants shared across models, validators and controllers.
 * Keeping them here avoids "magic strings" scattered through the codebase.
 */

export const ROLES = Object.freeze({
  OWNER: 'Owner',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
});

export const ROLE_VALUES = Object.values(ROLES);

export const TASK_STATUS = Object.freeze({
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  TESTING: 'Testing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
});

export const TASK_STATUS_VALUES = Object.values(TASK_STATUS);

export const TASK_PRIORITY = Object.freeze({
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
});

export const TASK_PRIORITY_VALUES = Object.values(TASK_PRIORITY);

export const LEAVE_STATUS = Object.freeze({
  AVAILABLE: 'Available',
  BUSY: 'Busy',
  MEETING: 'Meeting',
  LEAVE: 'Leave',
  WFH: 'Work From Home',
});

export const LEAVE_STATUS_VALUES = Object.values(LEAVE_STATUS);

export const USER_STATUS = Object.freeze({
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
});

export const USER_STATUS_VALUES = Object.values(USER_STATUS);

export const HISTORY_ACTIONS = Object.freeze({
  CREATED: 'Task Created',
  UPDATED: 'Task Updated',
  ASSIGNED: 'Assigned',
  STATUS_CHANGED: 'Status Changed',
  PRIORITY_CHANGED: 'Priority Changed',
  DUE_DATE_CHANGED: 'Due Date Changed',
  COMMENT_ADDED: 'Comment Added',
  ATTACHMENT_UPLOADED: 'Attachment Uploaded',
  COMPLETED: 'Completed',
  REOPENED: 'Reopened',
  DELETED: 'Deleted',
  ARCHIVED: 'Archived',
  RESTORED: 'Restored',
  DUPLICATED: 'Duplicated',
});

export const NOTIFICATION_TYPES = Object.freeze({
  NEW_TASK: 'New Task',
  COMMENT: 'Comment',
  MENTION: 'Mention',
  ASSIGNMENT: 'Assignment',
  DEADLINE: 'Deadline',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  REVIEW_REQUIRED: 'Review Required',
});

export const ENTITY_STATUS = Object.freeze({
  ACTIVE: 'Active',
  PAUSED: 'Paused',
});
export const ENTITY_STATUS_VALUES = Object.values(ENTITY_STATUS);

export const PERFORMANCE_RATING = Object.freeze({
  GOOD: 'Good',
  AVERAGE: 'Average',
  BAD: 'Bad',
});
export const PERFORMANCE_RATING_VALUES = Object.values(PERFORMANCE_RATING);

export const SOCKET_EVENTS = Object.freeze({
  NOTIFICATION: 'notification:new',
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  COMMENT_ADDED: 'comment:added',
  TIMER_UPDATED: 'timer:updated',
  PRESENCE: 'presence:update',
});

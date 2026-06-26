export const ROLES = { OWNER: 'Owner', MANAGER: 'Manager', EMPLOYEE: 'Employee' };

export const TASK_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  TESTING: 'Testing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
};

export const TASK_PRIORITY = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' };

export const LEAVE_STATUS = ['Available', 'Busy', 'Meeting', 'Leave', 'Work From Home'];

export const KANBAN_COLUMNS = [
  TASK_STATUS.PENDING,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.REVIEW,
  TASK_STATUS.TESTING,
  TASK_STATUS.COMPLETED,
];

export const STATUS_STYLES = {
  Pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Testing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Cancelled: 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export const PRIORITY_STYLES = {
  Low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  Medium: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export const PRIORITY_DOT = {
  Low: 'bg-slate-400',
  Medium: 'bg-sky-500',
  High: 'bg-orange-500',
  Critical: 'bg-red-500',
};

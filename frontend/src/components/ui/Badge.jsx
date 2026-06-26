import { STATUS_STYLES, PRIORITY_STYLES, PRIORITY_DOT } from '../../utils/constants.js';

export const StatusBadge = ({ status }) => (
  <span className={`badge ${STATUS_STYLES[status] || STATUS_STYLES.Pending}`}>{status}</span>
);

export const PriorityBadge = ({ priority }) => (
  <span className={`badge ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.Medium}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[priority] || 'bg-gray-400'}`} />
    {priority}
  </span>
);

export default StatusBadge;

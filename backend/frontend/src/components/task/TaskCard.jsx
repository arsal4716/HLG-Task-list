import { Link } from 'react-router-dom';
import { FiMessageSquare, FiPaperclip, FiCheckSquare, FiClock } from 'react-icons/fi';
import { StatusBadge, PriorityBadge } from '../ui/Badge.jsx';
import { AvatarGroup } from '../ui/Avatar.jsx';
import { fmtDate } from '../../utils/format.js';

const checklistPct = (checklist = []) => {
  if (!checklist.length) return null;
  return Math.round((checklist.filter((c) => c.completed).length / checklist.length) * 100);
};

export const TaskCard = ({ task, draggable, onDragStart, compact }) => {
  const overdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    !['Completed', 'Cancelled', 'Rejected'].includes(task.status);
  const pct = checklistPct(task.checklist);

  return (
    <Link
      to={`/tasks/${task._id}`}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, task)}
      className="card group block p-4 transition hover:shadow-md hover:ring-1 hover:ring-brand-500/30"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        {!compact && <StatusBadge status={task.status} />}
      </div>

      <h3 className="mb-1 line-clamp-2 font-medium leading-snug group-hover:text-brand-600">
        {task.title}
      </h3>
      {!compact && task.description && (
        <p className="mb-3 line-clamp-2 text-sm text-gray-500">{task.description}</p>
      )}

      {task.tags?.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-gray-800">
              #{t}
            </span>
          ))}
        </div>
      )}

      {pct !== null && (
        <div className="mb-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <AvatarGroup users={task.assignedTo || []} />
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {task.commentCount > 0 && (
            <span className="flex items-center gap-1">
              <FiMessageSquare className="h-3.5 w-3.5" /> {task.commentCount}
            </span>
          )}
          {task.attachments?.length > 0 && (
            <span className="flex items-center gap-1">
              <FiPaperclip className="h-3.5 w-3.5" /> {task.attachments.length}
            </span>
          )}
          {pct !== null && (
            <span className="flex items-center gap-1">
              <FiCheckSquare className="h-3.5 w-3.5" /> {pct}%
            </span>
          )}
          {task.dueDate && (
            <span className={`flex items-center gap-1 ${overdue ? 'font-medium text-red-500' : ''}`}>
              <FiClock className="h-3.5 w-3.5" /> {fmtDate(task.dueDate, 'MMM d')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default TaskCard;

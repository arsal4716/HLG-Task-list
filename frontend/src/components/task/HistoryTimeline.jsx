import { useQuery } from '@tanstack/react-query';
import { taskService } from '../../services/index.js';
import { fromNow } from '../../utils/format.js';

const fmtVal = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  if (Array.isArray(v)) return `${v.length} item(s)`;
  return String(v).slice(0, 40);
};

export const HistoryTimeline = ({ taskId }) => {
  const { data } = useQuery({ queryKey: ['history', taskId], queryFn: () => taskService.history(taskId) });
  const history = data?.data?.history || [];

  return (
    <div>
      <h3 className="mb-4 font-semibold">Activity & History</h3>
      {history.length === 0 ? (
        <p className="text-sm text-gray-400">No history yet.</p>
      ) : (
        <ul className="relative space-y-4 border-l border-gray-200 pl-4 dark:border-gray-800">
          {history.map((h) => (
            <li key={h._id} className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white dark:ring-gray-900" />
              <p className="text-sm">
                <span className="font-medium">{h.user?.name || 'System'}</span>{' '}
                <span className="text-gray-500">— {h.action}</span>
                {h.field && (
                  <span className="text-gray-400">
                    {' '}({h.field}: {fmtVal(h.from)} → {fmtVal(h.to)})
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400">{fromNow(h.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HistoryTimeline;

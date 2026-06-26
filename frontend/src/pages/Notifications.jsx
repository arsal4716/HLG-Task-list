import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiCheck, FiTrash2, FiBell } from 'react-icons/fi';
import { notificationService } from '../services/index.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { fromNow } from '../utils/format.js';

const typeColor = {
  'New Task': 'bg-brand-500',
  Comment: 'bg-blue-500',
  Mention: 'bg-purple-500',
  Assignment: 'bg-brand-500',
  Deadline: 'bg-amber-500',
  Completed: 'bg-green-500',
  Rejected: 'bg-red-500',
  'Review Required': 'bg-purple-500',
};

const Notifications = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationService.list({ limit: 50 }) });
  const items = data?.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unread-count'] });
  };

  const markRead = useMutation({ mutationFn: (id) => notificationService.markRead(id), onSuccess: invalidate });
  const markAll = useMutation({ mutationFn: () => notificationService.markAll(), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id) => notificationService.remove(id), onSuccess: invalidate });

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${data?.meta?.unreadCount || 0} unread`}
        actions={items.length > 0 && <button className="btn-secondary" onClick={() => markAll.mutate()}><FiCheck className="h-4 w-4" /> Mark all read</button>}
      />

      {items.length === 0 ? (
        <EmptyState icon={FiBell} title="No notifications" subtitle="You're all caught up." />
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((n) => (
            <div key={n._id} className={`flex items-start gap-3 p-4 ${!n.isRead ? 'bg-brand-50/40 dark:bg-brand-900/10' : ''}`}>
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${typeColor[n.type] || 'bg-gray-400'}`} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-gray-500">{n.message}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                  <span>{fromNow(n.createdAt)}</span>
                  {n.link && <Link to={n.link} onClick={() => markRead.mutate(n._id)} className="text-brand-600 hover:underline">View</Link>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {!n.isRead && (
                  <button onClick={() => markRead.mutate(n._id)} className="btn-ghost p-1.5" title="Mark read"><FiCheck className="h-4 w-4" /></button>
                )}
                <button onClick={() => remove.mutate(n._id)} className="btn-ghost p-1.5 text-red-500" title="Delete"><FiTrash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

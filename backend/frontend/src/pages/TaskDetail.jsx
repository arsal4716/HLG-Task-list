import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiEdit2,
  FiCopy,
  FiTrash2,
  FiPlay,
  FiArchive,
  FiClock,
  FiCalendar,
} from 'react-icons/fi';
import { taskService, timeService } from '../services/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSocket } from '../contexts/SocketContext.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { TaskFormModal } from '../components/task/TaskFormModal.jsx';
import { CommentSection } from '../components/task/CommentSection.jsx';
import { Checklist } from '../components/task/Checklist.jsx';
import { Attachments } from '../components/task/Attachments.jsx';
import { HistoryTimeline } from '../components/task/HistoryTimeline.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { fmtDate, fmtDateTime } from '../utils/format.js';
import { TASK_STATUS, ROLES } from '../utils/constants.js';
import { errMessage } from '../lib/axios.js';

const TABS = ['Comments', 'Checklist', 'Attachments', 'History'];

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isManager } = useAuth();
  const { socket } = useSocket();
  const [tab, setTab] = useState('Comments');
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskService.get(id),
  });
  const task = data?.data?.task;

  const canManage = isManager;
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['task', id] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  // join the realtime room for this task
  useEffect(() => {
    if (!socket || !id) return undefined;
    socket.emit('task:join', id);
    const refresh = () => invalidate();
    socket.on('comment:added', refresh);
    socket.on('task:updated', refresh);
    return () => {
      socket.emit('task:leave', id);
      socket.off('comment:added', refresh);
      socket.off('task:updated', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, id]);

  const updateStatus = useMutation({
    mutationFn: (status) => taskService.update(id, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      invalidate();
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const startTimer = useMutation({
    mutationFn: () => timeService.start(id),
    onSuccess: () => {
      toast.success('Timer started');
      queryClient.invalidateQueries({ queryKey: ['active-timer'] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const duplicate = useMutation({
    mutationFn: () => taskService.duplicate(id),
    onSuccess: (res) => {
      toast.success('Task duplicated');
      navigate(`/tasks/${res.data.task._id}`);
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const archive = useMutation({
    mutationFn: () => taskService.archive(id, !task.isArchived),
    onSuccess: () => {
      toast.success(task.isArchived ? 'Restored' : 'Archived');
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: () => taskService.remove(id),
    onSuccess: () => {
      toast.success('Task deleted');
      navigate('/tasks');
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  if (isLoading) return <PageLoader />;
  if (isError || !task)
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Task not found.</p>
        <Link to="/tasks" className="btn-primary mt-4 inline-flex">Back to tasks</Link>
      </div>
    );

  return (
    <div>
      <button onClick={() => navigate(-1)} className="btn-ghost mb-4 -ml-2">
        <FiArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              {task.isArchived && <span className="badge bg-gray-200 text-gray-600">Archived</span>}
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => startTimer.mutate()} className="btn-ghost p-2" title="Start timer">
                  <FiPlay className="h-4 w-4" />
                </button>
                {canManage && (
                  <>
                    <button onClick={() => setEditing(true)} className="btn-ghost p-2" title="Edit">
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => duplicate.mutate()} className="btn-ghost p-2" title="Duplicate">
                      <FiCopy className="h-4 w-4" />
                    </button>
                    <button onClick={() => archive.mutate()} className="btn-ghost p-2" title="Archive">
                      <FiArchive className="h-4 w-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(true)} className="btn-ghost p-2 text-red-500" title="Delete">
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <h1 className="text-2xl font-bold">{task.title}</h1>
            {task.description && (
              <p className="mt-3 whitespace-pre-wrap text-gray-600 dark:text-gray-300">{task.description}</p>
            )}

            {task.tags?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {task.tags.map((t) => (
                  <span key={t} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800">#{t}</span>
                ))}
              </div>
            )}

            {/* Quick status changer */}
            <div className="mt-5 flex flex-wrap gap-1.5">
              {Object.values(TASK_STATUS).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus.mutate(s)}
                  disabled={task.status === s}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                    task.status === s
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'border-gray-200 text-gray-500 hover:border-brand-400 dark:border-gray-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="card p-6">
            <div className="mb-5 flex gap-1 border-b border-gray-200 dark:border-gray-800">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
                    tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {tab === 'Comments' && <CommentSection taskId={id} />}
            {tab === 'Checklist' && <Checklist task={task} />}
            {tab === 'Attachments' && <Attachments task={task} canEdit />}
            {tab === 'History' && <HistoryTimeline taskId={id} />}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="mb-4 font-semibold">Details</h3>
            <dl className="space-y-3 text-sm">
              <Meta label="Assigned by">
                <div className="flex items-center gap-2">
                  <Avatar user={task.assignedBy} size="sm" />
                  <span>{task.assignedBy?.name}</span>
                </div>
              </Meta>
              <Meta label="Assigned to">
                <div className="space-y-1">
                  {(task.assignedTo || []).map((u) => (
                    <div key={u._id} className="flex items-center gap-2">
                      <Avatar user={u} size="sm" />
                      <span>{u.name}</span>
                    </div>
                  ))}
                  {(task.assignedTo || []).length === 0 && <span className="text-gray-400">Unassigned</span>}
                </div>
              </Meta>
              <Meta label="Department">{task.department?.name || '—'}</Meta>
              <Meta label="Due date">
                <span className="flex items-center gap-1.5"><FiCalendar className="h-3.5 w-3.5" /> {fmtDate(task.dueDate)}</span>
              </Meta>
              <Meta label="Start date">{fmtDate(task.startDate)}</Meta>
              <Meta label="Completed">{fmtDate(task.completedDate)}</Meta>
              <Meta label="Estimated">{task.estimatedHours || 0}h</Meta>
              <Meta label="Actual">
                <span className="flex items-center gap-1.5"><FiClock className="h-3.5 w-3.5" /> {task.actualHours || 0}h</span>
              </Meta>
              <Meta label="Created">{fmtDateTime(task.createdAt)}</Meta>
            </dl>
          </div>
        </div>
      </div>

      <TaskFormModal open={editing} onClose={() => setEditing(false)} task={task} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
        title="Delete task?"
        message="This task will be moved to trash."
        confirmText="Delete"
        loading={remove.isPending}
      />
    </div>
  );
};

const Meta = ({ label, children }) => (
  <div className="flex justify-between gap-4">
    <dt className="shrink-0 text-gray-400">{label}</dt>
    <dd className="text-right font-medium">{children}</dd>
  </div>
);

export default TaskDetail;

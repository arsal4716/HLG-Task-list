import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiPlus } from 'react-icons/fi';
import { taskService } from '../services/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { TaskCard } from '../components/task/TaskCard.jsx';
import { TaskFormModal } from '../components/task/TaskFormModal.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { KANBAN_COLUMNS, ROLES, STATUS_STYLES } from '../utils/constants.js';
import { errMessage } from '../lib/axios.js';

const KanbanBoard = () => {
  const { isManager } = useAuth();
  const queryClient = useQueryClient();
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const canManage = isManager;

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { board: true }],
    queryFn: () => taskService.list({ limit: 100, sort: 'boardOrder' }),
  });

  const move = useMutation({
    mutationFn: ({ id, status }) => taskService.move(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', { board: true }] });
      const prev = queryClient.getQueryData(['tasks', { board: true }]);
      queryClient.setQueryData(['tasks', { board: true }], (old) => {
        if (!old) return old;
        return { ...old, data: old.data.map((t) => (t._id === id ? { ...t, status } : t)) };
      });
      return { prev };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['tasks', { board: true }], ctx.prev);
      toast.error(errMessage(e));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  if (isLoading) return <PageLoader />;
  const tasks = data?.data || [];
  const byCol = (col) => tasks.filter((t) => t.status === col);

  const onDrop = (col) => {
    setOverCol(null);
    if (dragId) {
      const task = tasks.find((t) => t._id === dragId);
      if (task && task.status !== col) move.mutate({ id: dragId, status: col });
    }
    setDragId(null);
  };

  return (
    <div>
      <PageHeader
        title="Kanban Board"
        subtitle="Drag tasks across columns to update their status."
        actions={canManage && <button className="btn-primary" onClick={() => setShowForm(true)}><FiPlus /> New Task</button>}
      />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = byCol(col);
          return (
            <div
              key={col}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(col);
              }}
              onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
              onDrop={() => onDrop(col)}
              className={`flex w-72 shrink-0 flex-col rounded-xl border p-3 transition ${
                overCol === col
                  ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-900/10'
                  : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40'
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <span className={`badge ${STATUS_STYLES[col]}`}>{col}</span>
                <span className="text-xs font-medium text-gray-400">{colTasks.length}</span>
              </div>
              <div className="flex-1 space-y-3">
                {colTasks.map((task) => (
                  <div
                    key={task._id}
                    onDragEnd={() => setDragId(null)}
                    className={dragId === task._id ? 'opacity-40' : ''}
                  >
                    <TaskCard
                      task={task}
                      compact
                      draggable
                      onDragStart={() => setDragId(task._id)}
                    />
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-xs text-gray-400 dark:border-gray-700">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskFormModal open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
};

export default KanbanBoard;

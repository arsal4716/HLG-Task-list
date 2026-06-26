import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiGrid, FiList, FiTrash2 } from 'react-icons/fi';
import { taskService, departmentService } from '../services/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { TaskCard } from '../components/task/TaskCard.jsx';
import { TaskFormModal } from '../components/task/TaskFormModal.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { TASK_STATUS, TASK_PRIORITY, ROLES } from '../utils/constants.js';
import { errMessage } from '../lib/axios.js';

const Tasks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = [ROLES.OWNER, ROLES.MANAGER].includes(user?.role);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', department: '', sort: '-createdAt' });
  const [page, setPage] = useState(1);
  const [view, setView] = useState('grid');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState([]);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const debouncedSearch = useDebounce(search);

  const params = {
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    department: filters.department || undefined,
    sort: filters.sort,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['tasks', params],
    queryFn: () => taskService.list(params),
    keepPreviousData: true,
  });

  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: () => departmentService.list() });
  const departments = deptData?.data?.departments || [];

  const tasks = data?.data || [];
  const meta = data?.meta || {};

  const bulk = useMutation({
    mutationFn: (payload) => taskService.bulk(payload),
    onSuccess: () => {
      toast.success('Bulk action applied');
      setSelected([]);
      setConfirmBulk(false);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const toggleSelect = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const applyBulkStatus = (status) => bulk.mutate({ ids: selected, action: 'status', value: status });

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${meta.total ?? 0} tasks`}
        actions={
          canManage && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <FiPlus className="h-4 w-4" /> New Task
            </button>
          )
        }
      />

      {/* Toolbar */}
      <div className="card mb-5 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All status</option>
            {Object.values(TASK_STATUS).map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="input w-auto" value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
            <option value="">All priority</option>
            {Object.values(TASK_PRIORITY).map((p) => <option key={p}>{p}</option>)}
          </select>
          <select className="input w-auto" value={filters.department} onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}>
            <option value="">All depts</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select className="input w-auto" value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}>
            <option value="-createdAt">Newest</option>
            <option value="createdAt">Oldest</option>
            <option value="dueDate">Due date</option>
            <option value="-priority">Priority</option>
          </select>
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-700">
            <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'text-brand-600' : 'text-gray-400'}`}>
              <FiGrid className="h-5 w-5" />
            </button>
            <button onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'text-brand-600' : 'text-gray-400'}`}>
              <FiList className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk bar */}
      {canManage && selected.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-brand-50 p-3 text-sm dark:bg-brand-900/20">
          <span className="font-medium">{selected.length} selected</span>
          <select className="input w-auto py-1" onChange={(e) => e.target.value && applyBulkStatus(e.target.value)} defaultValue="">
            <option value="" disabled>Set status…</option>
            {Object.values(TASK_STATUS).map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="btn-danger py-1" onClick={() => setConfirmBulk(true)}>
            <FiTrash2 className="h-4 w-4" /> Delete
          </button>
          <button className="btn-ghost py-1" onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size={8} /></div>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          subtitle="Try adjusting filters, or create a new task."
          action={canManage && <button className="btn-primary" onClick={() => setShowForm(true)}><FiPlus /> New Task</button>}
        />
      ) : (
        <div className={view === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
          {tasks.map((task) => (
            <div key={task._id} className="relative">
              {canManage && (
                <input
                  type="checkbox"
                  className="absolute left-3 top-3 z-10 h-4 w-4 accent-brand-600"
                  checked={selected.includes(task._id)}
                  onChange={() => toggleSelect(task._id)}
                />
              )}
              <TaskCard task={task} compact={view === 'list'} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button className="btn-secondary" disabled={!meta.hasPrevPage} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {meta.page} of {meta.totalPages} {isFetching && '…'}
          </span>
          <button className="btn-secondary" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}

      <TaskFormModal open={showForm} onClose={() => setShowForm(false)} />
      <ConfirmDialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        onConfirm={() => bulk.mutate({ ids: selected, action: 'delete' })}
        title="Delete tasks?"
        message={`This will move ${selected.length} task(s) to trash.`}
        confirmText="Delete"
        loading={bulk.isPending}
      />
    </div>
  );
};

export default Tasks;

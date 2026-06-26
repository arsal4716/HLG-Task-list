import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal.jsx';
import { taskService, departmentService, userService } from '../../services/index.js';
import { TASK_PRIORITY, TASK_STATUS } from '../../utils/constants.js';
import { errMessage } from '../../lib/axios.js';

const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export const TaskFormModal = ({ open, onClose, task }) => {
  const isEdit = !!task;
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: () => departmentService.list(), enabled: open });
  const { data: userData } = useQuery({ queryKey: ['assignable'], queryFn: () => userService.assignable(), enabled: open });

  const departments = deptData?.data?.departments || [];
  const users = userData?.data?.users || [];

  useEffect(() => {
    if (!open) return;
    reset({
      title: task?.title || '',
      description: task?.description || '',
      priority: task?.priority || TASK_PRIORITY.MEDIUM,
      status: task?.status || TASK_STATUS.PENDING,
      department: task?.department?._id || task?.department || '',
      dueDate: toInputDate(task?.dueDate),
      estimatedHours: task?.estimatedHours || 0,
      assignedTo: (task?.assignedTo || []).map((u) => u._id || u),
      tags: (task?.tags || []).join(', '),
    });
  }, [open, task, reset]);

  const save = useMutation({
    mutationFn: (payload) => (isEdit ? taskService.update(task._id, payload) : taskService.create(payload)),
    onSuccess: () => {
      toast.success(isEdit ? 'Task updated' : 'Task created');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', task?._id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const onSubmit = (values) => {
    const payload = {
      ...values,
      estimatedHours: Number(values.estimatedHours) || 0,
      dueDate: values.dueDate || null,
      department: values.department || null,
      tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      assignedTo: Array.isArray(values.assignedTo) ? values.assignedTo : [values.assignedTo].filter(Boolean),
    };
    save.mutate(payload);
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Task' : 'Create Task'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input className="input" {...register('title', { required: 'Title is required' })} placeholder="What needs to be done?" />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[90px]" {...register('description')} placeholder="Add details…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Priority</label>
            <select className="input" {...register('priority')}>
              {Object.values(TASK_PRIORITY).map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" {...register('status')}>
              {Object.values(TASK_STATUS).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Department</label>
            <select className="input" {...register('department')}>
              <option value="">— None —</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Due date</label>
            <input type="date" className="input" {...register('dueDate')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Estimated hours</label>
            <input type="number" min="0" step="0.5" className="input" {...register('estimatedHours')} />
          </div>
          <div>
            <label className="label">Tags (comma separated)</label>
            <input className="input" {...register('tags')} placeholder="design, urgent" />
          </div>
        </div>

        <div>
          <label className="label">Assign to</label>
          <select multiple className="input min-h-[120px]" {...register('assignedTo')}>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} · {u.role}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">Hold Ctrl/Cmd to select multiple.</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskFormModal;

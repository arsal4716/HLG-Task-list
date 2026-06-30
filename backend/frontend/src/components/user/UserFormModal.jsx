import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal.jsx';
import { userService, departmentService } from '../../services/index.js';
import { ROLES } from '../../utils/constants.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { errMessage } from '../../lib/axios.js';

export const UserFormModal = ({ open, onClose, editUser }) => {
  const isEdit = !!editUser;
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: () => departmentService.list(), enabled: open });
  const departments = deptData?.data?.departments || [];

  useEffect(() => {
    if (!open) return;
    reset({
      name: editUser?.name || '',
      email: editUser?.email || '',
      phone: editUser?.phone || '',
      role: editUser?.role || ROLES.EMPLOYEE,
      department: editUser?.department?._id || editUser?.department || '',
      status: editUser?.status || 'Active',
      password: '',
    });
  }, [open, editUser, reset]);

  const save = useMutation({
    mutationFn: (payload) => (isEdit ? userService.update(editUser._id, payload) : userService.create(payload)),
    onSuccess: () => {
      toast.success(isEdit ? 'User updated' : 'User created');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const onSubmit = (values) => {
    const payload = { ...values, department: values.department || null };
    if (isEdit && !payload.password) delete payload.password;
    save.mutate(payload);
  };

  const roleOptions = role === ROLES.OWNER ? Object.values(ROLES) : [ROLES.EMPLOYEE];

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Team Member' : 'Add Team Member'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Name *</label>
          <input className="input" {...register('name', { required: 'Name is required' })} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Email *</label>
          <input className="input" {...register('email', { required: 'Email is required' })} />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register('phone')} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" {...register('role')}>
              {roleOptions.map((r) => <option key={r}>{r}</option>)}
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
            <label className="label">Status</label>
            <select className="input" {...register('status')}>
              <option>Active</option>
              <option>Inactive</option>
              <option>Suspended</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">{isEdit ? 'New password (leave blank to keep)' : 'Password *'}</label>
          <input
            type="password"
            className="input"
            {...register('password', isEdit ? {} : { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;

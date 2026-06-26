import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiUserPlus, FiSearch, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { userService } from '../services/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSocket } from '../contexts/SocketContext.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { UserFormModal } from '../components/user/UserFormModal.jsx';
import { ROLES } from '../utils/constants.js';
import { fmtDate } from '../utils/format.js';
import { errMessage } from '../lib/axios.js';

const roleBadge = {
  Owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Employee: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

const Users = () => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debounced = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ['users', debounced],
    queryFn: () => userService.list({ search: debounced || undefined, limit: 50 }),
  });
  const users = data?.data || [];

  const remove = useMutation({
    mutationFn: (id) => userService.remove(id),
    onSuccess: () => {
      toast.success('User removed');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const openCreate = () => {
    setEditUser(null);
    setShowForm(true);
  };
  const openEdit = (u) => {
    setEditUser(u);
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle={`${users.length} members`}
        actions={<button className="btn-primary" onClick={openCreate}><FiUserPlus className="h-4 w-4" /> Add Member</button>}
      />

      <div className="card mb-5 p-4">
        <div className="relative max-w-sm">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search team…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : users.length === 0 ? (
        <EmptyState title="No team members" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="hidden px-4 py-3 md:table-cell">Department</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Status</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <Link to={`/users/${u._id}`} className="flex items-center gap-3">
                        <Avatar user={u} online={isUserOnline(u._id)} />
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${roleBadge[u.role]}`}>{u.role}</span>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">{u.department?.name || '—'}</td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="text-xs text-gray-500">{u.leaveStatus}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{fmtDate(u.joiningDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="btn-ghost p-1.5"><FiEdit2 className="h-4 w-4" /></button>
                        {user?.role === ROLES.OWNER && u.role !== ROLES.OWNER && (
                          <button onClick={() => setDeleteTarget(u)} className="btn-ghost p-1.5 text-red-500"><FiTrash2 className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <UserFormModal open={showForm} onClose={() => setShowForm(false)} editUser={editUser} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => remove.mutate(deleteTarget._id)}
        title="Remove member?"
        message={`This will permanently remove ${deleteTarget?.name}.`}
        confirmText="Remove"
        loading={remove.isPending}
      />
    </div>
  );
};

export default Users;

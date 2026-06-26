import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiCamera } from 'react-icons/fi';
import { authService, userService, timeService } from '../services/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { LEAVE_STATUS } from '../utils/constants.js';
import { fmtDuration } from '../utils/format.js';
import { errMessage } from '../lib/axios.js';

const Profile = () => {
  const { user, performance, refreshUser, setUser } = useAuth();
  const fileRef = useRef(null);

  const profileForm = useForm({
    defaultValues: { name: user?.name, phone: user?.phone, leaveStatus: user?.leaveStatus },
  });
  const passwordForm = useForm();

  const { data: timeSummary } = useQuery({ queryKey: ['time-summary'], queryFn: () => timeService.summary() });
  const summary = timeSummary?.data || {};

  const saveProfile = useMutation({
    mutationFn: (payload) => authService.updateMe(payload),
    onSuccess: async () => {
      toast.success('Profile updated');
      await refreshUser();
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const changePassword = useMutation({
    mutationFn: (payload) => authService.changePassword(payload),
    onSuccess: () => {
      toast.success('Password changed — please sign in again.');
      passwordForm.reset();
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const uploadAvatar = useMutation({
    mutationFn: (formData) => userService.uploadAvatar(formData),
    onSuccess: (res) => {
      toast.success('Photo updated');
      setUser((u) => ({ ...u, profileImage: res.data.profileImage }));
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const onAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    uploadAvatar.mutate(fd);
  };

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your account and preferences." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="card flex flex-col items-center p-6 text-center">
            <div className="relative">
              <Avatar user={user} size="xl" />
              <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 rounded-full bg-brand-600 p-1.5 text-white shadow hover:bg-brand-700">
                <FiCamera className="h-3.5 w-3.5" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatar} />
            </div>
            <h2 className="mt-3 text-lg font-bold">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.role}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 font-semibold">Time tracked</h3>
            <div className="space-y-2 text-sm">
              <Row label="Today" value={fmtDuration(summary.dailySeconds)} />
              <Row label="This week" value={fmtDuration(summary.weeklySeconds)} />
              <Row label="This month" value={fmtDuration(summary.monthlySeconds)} />
            </div>
          </div>

          {performance && (
            <div className="card p-5 text-center">
              <h3 className="mb-2 font-semibold">Performance score</h3>
              <p className="text-4xl font-extrabold text-brand-600">{performance.performanceScore}</p>
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <h3 className="mb-4 font-semibold">Account details</h3>
            <form onSubmit={profileForm.handleSubmit((v) => saveProfile.mutate(v))} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input className="input" {...profileForm.register('name', { required: true })} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Phone</label>
                  <input className="input" {...profileForm.register('phone')} />
                </div>
                <div>
                  <label className="label">Availability</label>
                  <select className="input" {...profileForm.register('leaveStatus')}>
                    {LEAVE_STATUS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn-primary" disabled={saveProfile.isPending}>
                {saveProfile.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>

          <div className="card p-6">
            <h3 className="mb-4 font-semibold">Change password</h3>
            <form onSubmit={passwordForm.handleSubmit((v) => changePassword.mutate(v))} className="space-y-4">
              <div>
                <label className="label">Current password</label>
                <input type="password" className="input" {...passwordForm.register('currentPassword', { required: true })} />
              </div>
              <div>
                <label className="label">New password</label>
                <input type="password" className="input" {...passwordForm.register('newPassword', { required: true, minLength: 6 })} />
              </div>
              <button className="btn-primary" disabled={changePassword.isPending}>
                {changePassword.isPending ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-400">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default Profile;

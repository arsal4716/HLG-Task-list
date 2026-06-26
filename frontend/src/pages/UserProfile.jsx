import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiMail, FiPhone, FiCalendar, FiBriefcase } from 'react-icons/fi';
import { userService } from '../services/index.js';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { StatCard } from '../components/dashboard/StatCard.jsx';
import { fmtDate } from '../utils/format.js';

const UserProfile = () => {
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['user', id], queryFn: () => userService.get(id) });

  if (isLoading) return <PageLoader />;
  const { user, performance, taskStats } = data?.data || {};
  const stats = Object.fromEntries((taskStats || []).map((s) => [s._id, s.count]));

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-brand-500 to-brand-700" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <Avatar user={user} size="xl" className="ring-4 ring-white dark:ring-gray-900" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{user?.name}</h1>
              <p className="text-sm text-gray-500">{user?.role} · {user?.department?.name || 'No department'}</p>
            </div>
            <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">{user?.leaveStatus}</span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Info icon={FiMail} label="Email" value={user?.email} />
            <Info icon={FiPhone} label="Phone" value={user?.phone || '—'} />
            <Info icon={FiBriefcase} label="Status" value={user?.status} />
            <Info icon={FiCalendar} label="Joined" value={fmtDate(user?.joiningDate)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Completed" value={stats.Completed || 0} tone="green" />
        <StatCard label="In Progress" value={stats['In Progress'] || 0} tone="blue" />
        <StatCard label="Pending" value={stats.Pending || 0} tone="amber" />
        <StatCard label="Performance" value={performance?.performanceScore ?? 0} tone="brand" hint="score / 100" />
      </div>

      {performance && (
        <div className="card p-6">
          <h3 className="mb-4 font-semibold">Performance breakdown</h3>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="Completed" value={performance.completedTasks} />
            <Metric label="Late" value={performance.lateTasks} />
            <Metric label="On-time" value={performance.onTimeTasks} />
            <Metric label="Workload" value={performance.currentWorkload} />
            <Metric label="Avg hours" value={performance.averageCompletionHours} />
            <Metric label="Efficiency" value={`${performance.efficiency}%`} />
          </div>
        </div>
      )}
    </div>
  );
};

const Info = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
    <Icon className="h-4 w-4 text-gray-400" />
    <div className="min-w-0">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="truncate font-medium">{value}</p>
    </div>
  </div>
);

const Metric = ({ label, value }) => (
  <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800/50">
    <p className="text-xl font-bold text-brand-600">{value}</p>
    <p className="text-xs text-gray-400">{label}</p>
  </div>
);

export default UserProfile;

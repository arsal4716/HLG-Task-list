import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiCheckSquare,
  FiClock,
  FiActivity,
  FiAlertOctagon,
  FiTrendingUp,
  FiZap,
  FiCheckCircle,
} from 'react-icons/fi';
import { dashboardService } from '../services/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { StatCard } from '../components/dashboard/StatCard.jsx';
import { StatusPie, PriorityBars } from '../components/dashboard/Charts.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { fmtClock, fromNow, fmtDate } from '../utils/format.js';
import { ROLES } from '../utils/constants.js';

const Dashboard = () => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.get(),
    refetchInterval: 60000,
  });

  if (isLoading) return <PageLoader />;
  const d = data?.data || {};
  const stats = d.stats || {};

  return (
    <div>
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0] || 'there'} 👋`}
        subtitle={`Here's your ${user?.role} overview for today.`}
      />

      {d.role === ROLES.OWNER && <OwnerView d={d} stats={stats} />}
      {d.role === ROLES.MANAGER && <ManagerView d={d} stats={stats} />}
      {d.role === ROLES.EMPLOYEE && <EmployeeView d={d} stats={stats} />}
    </div>
  );
};

const OwnerView = ({ d, stats }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Employees" value={stats.totalEmployees} icon={FiUsers} tone="brand" />
      <StatCard label="Total Tasks" value={stats.totalTasks} icon={FiCheckSquare} tone="blue" />
      <StatCard label="Completed" value={stats.completed} icon={FiCheckCircle} tone="green" />
      <StatCard label="In Progress" value={stats.inProgress} icon={FiActivity} tone="amber" />
      <StatCard label="Pending" value={stats.pending} icon={FiClock} tone="purple" />
      <StatCard label="Overdue" value={stats.overdue} icon={FiAlertOctagon} tone="red" />
      <StatCard label="Critical" value={stats.critical} icon={FiZap} tone="red" />
      <StatCard label="Performance" value={`${stats.performance}%`} icon={FiTrendingUp} tone="green" hint={`Avg score ${stats.avgPerformanceScore}`} />
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <h3 className="mb-4 font-semibold">Tasks by status</h3>
        <StatusPie data={d.charts?.statuses} />
      </div>
      <div className="card p-5">
        <h3 className="mb-4 font-semibold">Tasks by priority</h3>
        <PriorityBars data={d.charts?.priorities} />
      </div>
    </div>

    <div className="card p-5">
      <h3 className="mb-4 font-semibold">Recent activity</h3>
      <ul className="space-y-3">
        {(d.recentActivities || []).map((a) => (
          <li key={a._id} className="flex items-center gap-3 text-sm">
            <Avatar user={a.user} size="sm" />
            <span className="min-w-0 flex-1 truncate">
              <span className="font-medium">{a.user?.name || 'Someone'}</span>{' '}
              <span className="text-gray-500">{a.action.toLowerCase()}</span>{' '}
              {a.task && (
                <Link to={`/tasks/${a.task._id}`} className="text-brand-600 hover:underline">
                  {a.task.title}
                </Link>
              )}
            </span>
            <span className="shrink-0 text-xs text-gray-400">{fromNow(a.createdAt)}</span>
          </li>
        ))}
        {(d.recentActivities || []).length === 0 && (
          <p className="text-sm text-gray-400">No activity yet.</p>
        )}
      </ul>
    </div>
  </div>
);

const ManagerView = ({ d, stats }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Dept Tasks" value={stats.assignedTasks} icon={FiCheckSquare} tone="brand" />
      <StatCard label="Completed" value={stats.completed} icon={FiCheckCircle} tone="green" />
      <StatCard label="In Progress" value={stats.inProgress} icon={FiActivity} tone="blue" />
      <StatCard label="Overdue" value={stats.overdue} icon={FiAlertOctagon} tone="red" />
      <StatCard label="Employees" value={stats.employees} icon={FiUsers} tone="purple" />
      <StatCard label="Critical" value={stats.critical} icon={FiZap} tone="red" />
      <StatCard label="Pending" value={stats.pending} icon={FiClock} tone="amber" />
      <StatCard label="Dept Progress" value={`${stats.departmentProgress}%`} icon={FiTrendingUp} tone="green" />
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <h3 className="mb-4 font-semibold">Tasks by status</h3>
        <StatusPie data={d.charts?.statuses} />
      </div>
      <div className="card p-5">
        <h3 className="mb-4 font-semibold">Upcoming deadlines</h3>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {(d.deadlines || []).map((t) => (
            <li key={t._id} className="flex items-center justify-between py-2.5">
              <Link to={`/tasks/${t._id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-brand-600">
                {t.title}
              </Link>
              <span className="ml-3 shrink-0 text-xs text-gray-400">{fmtDate(t.dueDate, 'MMM d')}</span>
            </li>
          ))}
          {(d.deadlines || []).length === 0 && <p className="py-4 text-sm text-gray-400">No upcoming deadlines.</p>}
        </ul>
      </div>
    </div>
  </div>
);

const EmployeeView = ({ d, stats }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="My Tasks" value={stats.myTasks} icon={FiCheckSquare} tone="brand" />
      <StatCard label="Today" value={stats.todaysTasks} icon={FiClock} tone="amber" />
      <StatCard label="In Progress" value={stats.inProgress} icon={FiActivity} tone="blue" />
      <StatCard label="Completed" value={stats.completed} icon={FiCheckCircle} tone="green" />
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="card p-5 lg:col-span-2">
        <h3 className="mb-4 font-semibold">Today's tasks</h3>
        <ul className="space-y-2">
          {(d.todaysTasks || []).map((t) => (
            <li key={t._id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
              <Link to={`/tasks/${t._id}`} className="min-w-0 flex-1 truncate font-medium hover:text-brand-600">
                {t.title}
              </Link>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                <PriorityBadge priority={t.priority} />
                <StatusBadge status={t.status} />
              </div>
            </li>
          ))}
          {(d.todaysTasks || []).length === 0 && (
            <p className="text-sm text-gray-400">Nothing due today. Nice and calm. 🌤️</p>
          )}
        </ul>
      </div>

      <div className="space-y-6">
        <div className="card p-5">
          <h3 className="mb-2 font-semibold">Current timer</h3>
          {d.currentTimer ? (
            <Link to={`/tasks/${d.currentTimer.task?._id || d.currentTimer.task}`} className="block">
              <p className="font-mono text-3xl font-bold text-brand-600">{fmtClock(d.currentTimer.liveSeconds)}</p>
              <p className="mt-1 truncate text-sm text-gray-500">{d.currentTimer.task?.title}</p>
            </Link>
          ) : (
            <p className="text-sm text-gray-400">No active timer.</p>
          )}
        </div>
        <div className="card p-5 text-center">
          <h3 className="mb-2 font-semibold">Performance</h3>
          <p className="text-4xl font-extrabold text-brand-600">{stats.performanceScore}</p>
          <p className="text-xs text-gray-400">out of 100</p>
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;

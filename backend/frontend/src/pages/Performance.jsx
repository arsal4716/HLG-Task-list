import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiRefreshCw } from 'react-icons/fi';
import { performanceService } from '../services/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { ROLES } from '../utils/constants.js';
import { errMessage } from '../lib/axios.js';

const scoreColor = (s) => (s >= 75 ? 'text-green-600' : s >= 50 ? 'text-amber-600' : 'text-red-600');

const Performance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['performance'], queryFn: () => performanceService.list() });

  const recalc = useMutation({
    mutationFn: () => performanceService.recalcAll(),
    onSuccess: () => {
      toast.success('Performance recalculated');
      queryClient.invalidateQueries({ queryKey: ['performance'] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  if (isLoading) return <PageLoader />;
  const rows = data?.data?.performance || [];

  return (
    <div>
      <PageHeader
        title="Performance"
        subtitle="Weighted score: 40% completion · 30% on-time · 20% quality · 10% attendance"
        actions={
          user?.role === ROLES.OWNER && (
            <button className="btn-secondary" onClick={() => recalc.mutate()} disabled={recalc.isPending}>
              <FiRefreshCw className={`h-4 w-4 ${recalc.isPending ? 'animate-spin' : ''}`} /> Recalculate
            </button>
          )
        }
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3 text-center">Completed</th>
                <th className="px-4 py-3 text-center">Late</th>
                <th className="hidden px-4 py-3 text-center md:table-cell">Workload</th>
                <th className="hidden px-4 py-3 text-center md:table-cell">Efficiency</th>
                <th className="px-4 py-3 text-center">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((p, i) => (
                <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link to={`/users/${p.user?._id}`} className="flex items-center gap-3">
                      <Avatar user={p.user} size="sm" />
                      <div>
                        <p className="font-medium">{p.user?.name}</p>
                        <p className="text-xs text-gray-400">{p.user?.role}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">{p.completedTasks}</td>
                  <td className="px-4 py-3 text-center">{p.lateTasks}</td>
                  <td className="hidden px-4 py-3 text-center md:table-cell">{p.currentWorkload}</td>
                  <td className="hidden px-4 py-3 text-center md:table-cell">{p.efficiency}%</td>
                  <td className={`px-4 py-3 text-center text-base font-bold ${scoreColor(p.performanceScore)}`}>
                    {p.performanceScore}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No performance data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Performance;

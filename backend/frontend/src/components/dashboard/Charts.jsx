import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const STATUS_COLORS = {
  Pending: '#9ca3af',
  'In Progress': '#3b82f6',
  Review: '#a855f7',
  Testing: '#f59e0b',
  Completed: '#22c55e',
  Cancelled: '#6b7280',
  Rejected: '#ef4444',
};

const PRIORITY_COLORS = {
  Low: '#94a3b8',
  Medium: '#0ea5e9',
  High: '#f97316',
  Critical: '#ef4444',
};

export const StatusPie = ({ data = {} }) => {
  const rows = Object.entries(data).map(([name, value]) => ({ name, value }));
  if (!rows.length) return <p className="py-10 text-center text-sm text-gray-400">No data yet</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {rows.map((r) => (
            <Cell key={r.name} fill={STATUS_COLORS[r.name] || '#6366f1'} />
          ))}
        </Pie>
        <Tooltip />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const PriorityBars = ({ data = {} }) => {
  const rows = Object.entries(data).map(([name, value]) => ({ name, value }));
  if (!rows.length) return <p className="py-10 text-center text-sm text-gray-400">No data yet</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {rows.map((r) => (
            <Cell key={r.name} fill={PRIORITY_COLORS[r.name] || '#6366f1'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export const TrendBars = ({ data = [], dataKey = 'completed', xKey = 'period' }) => {
  if (!data.length) return <p className="py-10 text-center text-sm text-gray-400">No data yet</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey={dataKey} fill="#4f46e5" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

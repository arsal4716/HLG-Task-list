import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiDownload } from 'react-icons/fi';
import { reportService } from '../services/index.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { TrendBars } from '../components/dashboard/Charts.jsx';
import { errMessage } from '../lib/axios.js';

const TABS = [
  { key: 'employees', label: 'Employees' },
  { key: 'departments', label: 'Departments' },
  { key: 'completion', label: 'Completion Trend' },
  { key: 'late', label: 'Late Tasks' },
  { key: 'performance', label: 'Performance' },
];

const Reports = () => {
  const [tab, setTab] = useState('employees');

  const { data, isFetching } = useQuery({
    queryKey: ['report', tab],
    queryFn: () => reportService[tab]({}),
  });

  const report = data?.data?.report || [];

  const download = async () => {
    if (tab === 'completion') return; // trend chart only
    try {
      const res = await reportService.download(tab, {});
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tab}-report.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const columns = report.length ? Object.keys(report[0]) : [];

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Analyse productivity across the team and export to CSV."
        actions={
          tab !== 'completion' && (
            <button className="btn-primary" onClick={download}><FiDownload className="h-4 w-4" /> Export CSV</button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t.key ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isFetching ? (
        <div className="flex justify-center py-20"><Spinner size={8} /></div>
      ) : tab === 'completion' ? (
        <div className="card p-6">
          <h3 className="mb-4 font-semibold">Tasks completed over time</h3>
          <TrendBars data={report} dataKey="completed" xKey="period" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900">
                <tr>
                  {columns.map((c) => <th key={c} className="px-4 py-3 capitalize">{c.replace(/([A-Z])/g, ' $1')}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {report.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    {columns.map((c) => <td key={c} className="px-4 py-3">{String(row[c])}</td>)}
                  </tr>
                ))}
                {report.length === 0 && (
                  <tr><td colSpan={columns.length || 1} className="px-4 py-10 text-center text-gray-400">No data for this report.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

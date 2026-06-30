import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { settingsService, departmentService } from '../services/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { fmtDate } from '../utils/format.js';
import { ROLES } from '../utils/constants.js';
import { errMessage } from '../lib/axios.js';

// Owners configure everything; Managers can only manage Holidays.
const OWNER_TABS = ['Departments', 'Holidays', 'Company', 'Performance'];
const MANAGER_TABS = ['Holidays'];

const Settings = () => {
  const { role } = useAuth();
  const TABS = role === ROLES.OWNER ? OWNER_TABS : MANAGER_TABS;
  const [tab, setTab] = useState(TABS[0]);
  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your workspace." />
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Departments' && <Departments />}
      {tab === 'Holidays' && <Holidays />}
      {tab === 'Company' && <Company />}
      {tab === 'Performance' && <PerformanceWeights />}
    </div>
  );
};

const Departments = () => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const { data, isLoading } = useQuery({ queryKey: ['departments'], queryFn: () => departmentService.list() });
  const departments = data?.data?.departments || [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['departments'] });

  const create = useMutation({
    mutationFn: (payload) => departmentService.create(payload),
    onSuccess: () => { toast.success('Department added'); reset(); invalidate(); },
    onError: (e) => toast.error(errMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id) => departmentService.remove(id),
    onSuccess: () => { toast.success('Removed'); invalidate(); },
    onError: (e) => toast.error(errMessage(e)),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="card p-5 lg:col-span-2">
        <h3 className="mb-4 font-semibold">Departments</h3>
        <ul className="space-y-2">
          {departments.map((d) => (
            <li key={d._id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
              <span className="h-4 w-4 rounded" style={{ background: d.color }} />
              <div className="flex-1">
                <p className="font-medium">{d.name}</p>
                <p className="text-xs text-gray-400">{d.employeeCount} members · {d.taskCount} tasks</p>
              </div>
              <button onClick={() => remove.mutate(d._id)} className="btn-ghost p-1.5 text-red-500"><FiTrash2 className="h-4 w-4" /></button>
            </li>
          ))}
          {departments.length === 0 && <p className="text-sm text-gray-400">No departments yet.</p>}
        </ul>
      </div>
      <div className="card h-fit p-5">
        <h3 className="mb-4 font-semibold">Add department</h3>
        <form onSubmit={handleSubmit((v) => create.mutate(v))} className="space-y-3">
          <input className="input" placeholder="Department name" {...register('name', { required: true })} />
          <div className="flex items-center gap-2">
            <label className="label mb-0">Color</label>
            <input type="color" defaultValue="#6366f1" className="h-9 w-16 rounded" {...register('color')} />
          </div>
          <textarea className="input" placeholder="Description (optional)" {...register('description')} />
          <button className="btn-primary w-full" disabled={create.isPending}><FiPlus className="h-4 w-4" /> Add</button>
        </form>
      </div>
    </div>
  );
};

const Holidays = () => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const year = new Date().getFullYear();
  const { data } = useQuery({ queryKey: ['holidays', year], queryFn: () => settingsService.holidays({ year }) });
  const holidays = data?.data?.holidays || [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['holidays'] });

  const create = useMutation({
    mutationFn: (payload) => settingsService.addHoliday(payload),
    onSuccess: () => { toast.success('Holiday added'); reset(); invalidate(); },
    onError: (e) => toast.error(errMessage(e)),
  });
  const remove = useMutation({ mutationFn: (id) => settingsService.removeHoliday(id), onSuccess: invalidate });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="card p-5 lg:col-span-2">
        <h3 className="mb-4 font-semibold">Company holidays ({year})</h3>
        <ul className="space-y-2">
          {holidays.map((h) => (
            <li key={h._id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
              <div className="flex-1">
                <p className="font-medium">{h.name}</p>
                <p className="text-xs text-gray-400">{fmtDate(h.date)}</p>
              </div>
              <button onClick={() => remove.mutate(h._id)} className="btn-ghost p-1.5 text-red-500"><FiTrash2 className="h-4 w-4" /></button>
            </li>
          ))}
          {holidays.length === 0 && <p className="text-sm text-gray-400">No holidays added.</p>}
        </ul>
      </div>
      <div className="card h-fit p-5">
        <h3 className="mb-4 font-semibold">Add holiday</h3>
        <form onSubmit={handleSubmit((v) => create.mutate(v))} className="space-y-3">
          <input className="input" placeholder="Holiday name" {...register('name', { required: true })} />
          <input type="date" className="input" {...register('date', { required: true })} />
          <button className="btn-primary w-full" disabled={create.isPending}><FiPlus className="h-4 w-4" /> Add</button>
        </form>
      </div>
    </div>
  );
};

const Company = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsService.get() });
  const settings = data?.data?.settings;
  const { register, handleSubmit } = useForm({ values: settings });

  const save = useMutation({
    mutationFn: (payload) => settingsService.update(payload),
    onSuccess: () => { toast.success('Saved'); queryClient.invalidateQueries({ queryKey: ['settings'] }); },
    onError: (e) => toast.error(errMessage(e)),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="card max-w-lg p-6">
      <h3 className="mb-4 font-semibold">Company & working hours</h3>
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <div>
          <label className="label">Company name</label>
          <input className="input" {...register('companyName')} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Start</label>
            <input type="time" className="input" {...register('workingHours.start')} />
          </div>
          <div>
            <label className="label">End</label>
            <input type="time" className="input" {...register('workingHours.end')} />
          </div>
          <div>
            <label className="label">Hours/day</label>
            <input type="number" className="input" {...register('workingHours.hoursPerDay')} />
          </div>
        </div>
        <button className="btn-primary" disabled={save.isPending}>Save settings</button>
      </form>
    </div>
  );
};

const PerformanceWeights = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsService.get() });
  const settings = data?.data?.settings;
  const { register, handleSubmit } = useForm({ values: settings });

  const save = useMutation({
    mutationFn: (payload) => settingsService.update(payload),
    onSuccess: () => { toast.success('Saved'); queryClient.invalidateQueries({ queryKey: ['settings'] }); },
    onError: (e) => toast.error(errMessage(e)),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="card max-w-lg p-6">
      <h3 className="mb-1 font-semibold">Performance score weights</h3>
      <p className="mb-4 text-sm text-gray-400">Should add up to 100.</p>
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {['completed', 'onTime', 'quality', 'attendance'].map((k) => (
            <div key={k}>
              <label className="label capitalize">{k.replace(/([A-Z])/g, ' $1')} %</label>
              <input type="number" className="input" {...register(`performanceWeights.${k}`)} />
            </div>
          ))}
        </div>
        <button className="btn-primary" disabled={save.isPending}>Save weights</button>
      </form>
    </div>
  );
};

export default Settings;

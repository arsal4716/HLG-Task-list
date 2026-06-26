import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
} from 'date-fns';
import { dashboardService } from '../services/index.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { PRIORITY_DOT } from '../utils/constants.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar = () => {
  const [cursor, setCursor] = useState(new Date());

  const { data } = useQuery({
    queryKey: ['calendar', cursor.getFullYear(), cursor.getMonth()],
    queryFn: () => dashboardService.calendar({ year: cursor.getFullYear(), month: cursor.getMonth() }),
  });

  const tasks = data?.data?.tasks || [];
  const holidays = data?.data?.holidays || [];

  const monthStart = startOfMonth(cursor);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(cursor)),
  });

  const tasksOn = (day) => tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
  const holidayOn = (day) => holidays.find((h) => isSameDay(new Date(h.date), day));

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Task deadlines and company holidays."
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary p-2" onClick={() => setCursor((c) => addMonths(c, -1))}>
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[140px] text-center font-semibold">{format(cursor, 'MMMM yyyy')}</span>
            <button className="btn-secondary p-2" onClick={() => setCursor((c) => addMonths(c, 1))}>
              <FiChevronRight className="h-4 w-4" />
            </button>
            <button className="btn-ghost" onClick={() => setCursor(new Date())}>Today</button>
          </div>
        }
      />

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayTasks = tasksOn(day);
            const holiday = holidayOn(day);
            const inMonth = isSameMonth(day, cursor);
            const today = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[96px] border-b border-r border-gray-100 p-1.5 dark:border-gray-800 ${
                  inMonth ? '' : 'bg-gray-50/60 dark:bg-gray-900/40'
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      today ? 'bg-brand-600 font-bold text-white' : inMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {holiday && <span className="truncate rounded bg-amber-100 px-1 text-[9px] text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{holiday.name}</span>}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((t) => (
                    <Link
                      key={t._id}
                      to={`/tasks/${t._id}`}
                      className="flex items-center gap-1 truncate rounded bg-gray-100 px-1 py-0.5 text-[11px] hover:bg-gray-200 dark:bg-gray-800"
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`} />
                      <span className="truncate">{t.title}</span>
                    </Link>
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="px-1 text-[10px] text-gray-400">+{dayTasks.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;

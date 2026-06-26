import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlay, FiPause, FiSquare, FiClock } from 'react-icons/fi';
import { timeService } from '../../services/index.js';
import { useTimer } from '../../hooks/useTimer.js';
import { fmtClock } from '../../utils/format.js';
import { errMessage } from '../../lib/axios.js';

/** Compact running-timer control shown in the navbar. */
export const TimerWidget = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['active-timer'],
    queryFn: () => timeService.active(),
    refetchInterval: 30000,
  });

  const log = data?.data?.log;
  const running = !!log && !log.isPaused;
  const seconds = useTimer(log?.liveSeconds || 0, running);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['active-timer'] });
    queryClient.invalidateQueries({ queryKey: ['task'] });
  };

  const pause = useMutation({ mutationFn: () => timeService.pause(log._id), onSuccess: invalidate });
  const resume = useMutation({ mutationFn: () => timeService.resume(log._id), onSuccess: invalidate });
  const stop = useMutation({
    mutationFn: () => timeService.stop(log._id),
    onSuccess: () => {
      toast.success('Timer stopped');
      invalidate();
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  if (!log) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-800">
      <FiClock className={`h-4 w-4 ${running ? 'text-green-500' : 'text-amber-500'}`} />
      <Link to={`/tasks/${log.task?._id || log.task}`} className="hidden font-mono text-sm tabular-nums sm:inline">
        {fmtClock(seconds)}
      </Link>
      {running ? (
        <button onClick={() => pause.mutate()} className="btn-ghost p-1" title="Pause">
          <FiPause className="h-4 w-4" />
        </button>
      ) : (
        <button onClick={() => resume.mutate()} className="btn-ghost p-1" title="Resume">
          <FiPlay className="h-4 w-4" />
        </button>
      )}
      <button onClick={() => stop.mutate()} className="btn-ghost p-1 text-red-500" title="Stop">
        <FiSquare className="h-4 w-4" />
      </button>
    </div>
  );
};

export default TimerWidget;

import { TimeLog } from '../models/TimeLog.js';
import { Task } from '../models/Task.js';

/** Sum committed durations (in seconds) into actualHours on the task. */
export const syncTaskActualHours = async (taskId) => {
  const logs = await TimeLog.find({ task: taskId, endedAt: { $ne: null } });
  const totalSeconds = logs.reduce((s, l) => s + (l.durationSeconds || 0), 0);
  const hours = Math.round((totalSeconds / 3600) * 100) / 100;
  await Task.findByIdAndUpdate(taskId, { actualHours: hours });
  return hours;
};

/** Aggregate a user's tracked time over a window. */
export const aggregateTime = async (userId, since) => {
  const match = { user: userId, endedAt: { $ne: null } };
  if (since) match.startedAt = { $gte: since };
  const logs = await TimeLog.find(match);
  return logs.reduce((s, l) => s + (l.durationSeconds || 0), 0);
};

export default syncTaskActualHours;

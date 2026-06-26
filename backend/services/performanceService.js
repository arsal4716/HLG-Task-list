import { Task } from '../models/Task.js';
import { Performance } from '../models/Performance.js';
import { Settings } from '../models/Settings.js';
import { TASK_STATUS, TASK_PRIORITY } from '../config/constants.js';

/**
 * Recalculate and persist performance metrics for a single user.
 * Score = 40% completed + 30% on-time + 20% quality + 10% attendance (configurable).
 */
export const calculateUserPerformance = async (userId) => {
  const tasks = await Task.find({ assignedTo: userId, isDeleted: false });

  const totalAssigned = tasks.length;
  const completed = tasks.filter((t) => t.status === TASK_STATUS.COMPLETED);
  const rejected = tasks.filter((t) => t.status === TASK_STATUS.REJECTED);
  const critical = tasks.filter((t) => t.priority === TASK_PRIORITY.CRITICAL);
  const open = tasks.filter(
    (t) => ![TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED, TASK_STATUS.REJECTED].includes(t.status)
  );

  let onTime = 0;
  let late = 0;
  let totalCompletionHours = 0;
  let completionSamples = 0;

  completed.forEach((t) => {
    if (t.dueDate && t.completedDate) {
      if (new Date(t.completedDate) <= new Date(t.dueDate)) onTime += 1;
      else late += 1;
    }
    if (t.startDate && t.completedDate) {
      const hrs = (new Date(t.completedDate) - new Date(t.startDate)) / 36e5;
      if (hrs >= 0) {
        totalCompletionHours += hrs;
        completionSamples += 1;
      }
    }
  });

  const avgCompletionHours = completionSamples ? totalCompletionHours / completionSamples : 0;

  const totalEstimated = completed.reduce((s, t) => s + (t.estimatedHours || 0), 0);
  const totalActual = completed.reduce((s, t) => s + (t.actualHours || 0), 0);
  const efficiency = totalActual > 0 ? Math.min(150, Math.round((totalEstimated / totalActual) * 100)) : 0;

  // Quality drops 10 points per rejected task, floored at 0.
  const qualityScore = Math.max(0, 100 - rejected.length * 10);
  const attendanceScore = 100; // placeholder hook for future leave/attendance integration

  const completedRatio = totalAssigned ? completed.length / totalAssigned : 0;
  const onTimeRatio = completed.length ? onTime / completed.length : 0;

  const weights = (await Settings.getSingleton()).performanceWeights;
  const performanceScore = Math.round(
    completedRatio * weights.completed +
      onTimeRatio * weights.onTime +
      (qualityScore / 100) * weights.quality +
      (attendanceScore / 100) * weights.attendance
  );

  const update = {
    user: userId,
    completedTasks: completed.length,
    lateTasks: late,
    onTimeTasks: onTime,
    totalAssigned,
    criticalTasks: critical.length,
    currentWorkload: open.length,
    averageCompletionHours: Math.round(avgCompletionHours * 10) / 10,
    efficiency,
    qualityScore,
    attendanceScore,
    performanceScore,
    lastCalculatedAt: new Date(),
  };

  return Performance.findOneAndUpdate({ user: userId }, update, { upsert: true, new: true });
};

export const calculateAllPerformance = async (userIds) => {
  const results = [];
  for (const id of userIds) {
    // sequential to avoid hammering the DB; volume is small (employee count)
    // eslint-disable-next-line no-await-in-loop
    results.push(await calculateUserPerformance(id));
  }
  return results;
};

export default calculateUserPerformance;

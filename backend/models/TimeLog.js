import mongoose from 'mongoose';

/**
 * A single timer session for a user on a task. `endedAt === null` means the
 * timer is currently running (or paused — see `isPaused`).
 */
const timeLogSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date, default: null },
    isPaused: { type: Boolean, default: false },
    pausedAt: { type: Date, default: null },
    // accumulated paused milliseconds so we can exclude them from the total
    pausedMs: { type: Number, default: 0 },
    // final computed duration in seconds (set on stop)
    durationSeconds: { type: Number, default: 0 },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

timeLogSchema.index({ user: 1, endedAt: 1 });

/** Live duration in seconds, accounting for paused time. */
timeLogSchema.methods.liveDuration = function liveDuration() {
  const end = this.endedAt ? this.endedAt.getTime() : Date.now();
  const gross = end - this.startedAt.getTime();
  let paused = this.pausedMs;
  if (this.isPaused && this.pausedAt) paused += Date.now() - this.pausedAt.getTime();
  return Math.max(0, Math.floor((gross - paused) / 1000));
};

export const TimeLog = mongoose.model('TimeLog', timeLogSchema);
export default TimeLog;

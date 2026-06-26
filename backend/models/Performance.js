import mongoose from 'mongoose';

/**
 * Cached / snapshot performance metrics per user. Recomputed on demand and by a
 * nightly cron so dashboards stay fast.
 */
const performanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    completedTasks: { type: Number, default: 0 },
    lateTasks: { type: Number, default: 0 },
    onTimeTasks: { type: Number, default: 0 },
    totalAssigned: { type: Number, default: 0 },
    criticalTasks: { type: Number, default: 0 },
    currentWorkload: { type: Number, default: 0 }, // open tasks
    averageCompletionHours: { type: Number, default: 0 },
    efficiency: { type: Number, default: 0 }, // estimated/actual %
    qualityScore: { type: Number, default: 100 }, // 0-100, lowered by rejections
    attendanceScore: { type: Number, default: 100 },
    performanceScore: { type: Number, default: 0 }, // weighted composite 0-100
    lastCalculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Performance = mongoose.model('Performance', performanceSchema);
export default Performance;

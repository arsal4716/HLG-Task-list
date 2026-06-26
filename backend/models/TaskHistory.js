import mongoose from 'mongoose';
import { HISTORY_ACTIONS } from '../config/constants.js';

const taskHistorySchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: Object.values(HISTORY_ACTIONS), required: true },
    field: { type: String, default: '' },
    from: { type: mongoose.Schema.Types.Mixed, default: null },
    to: { type: mongoose.Schema.Types.Mixed, default: null },
    note: { type: String, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

taskHistorySchema.index({ task: 1, createdAt: -1 });

export const TaskHistory = mongoose.model('TaskHistory', taskHistorySchema);
export default TaskHistory;

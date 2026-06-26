import mongoose from 'mongoose';
import {
  TASK_STATUS_VALUES,
  TASK_STATUS,
  TASK_PRIORITY_VALUES,
  TASK_PRIORITY,
} from '../config/constants.js';

const checklistItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: true, timestamps: false }
);

const attachmentSubSchema = new mongoose.Schema(
  {
    fileName: String,
    url: { type: String, required: true },
    publicId: String,
    fileType: String,
    size: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 160 },
    description: { type: String, default: '', trim: true },
    priority: { type: String, enum: TASK_PRIORITY_VALUES, default: TASK_PRIORITY.MEDIUM },
    status: { type: String, enum: TASK_STATUS_VALUES, default: TASK_STATUS.PENDING },

    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },

    dueDate: { type: Date, default: null },
    startDate: { type: Date, default: null },
    completedDate: { type: Date, default: null },

    estimatedHours: { type: Number, default: 0, min: 0 },
    actualHours: { type: Number, default: 0, min: 0 },

    tags: [{ type: String, trim: true }],
    checklist: [checklistItemSchema],
    attachments: [attachmentSubSchema],

    // Lifecycle flags
    isArchived: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    // Denormalised counters (kept in sync by services) for fast list rendering
    commentCount: { type: Number, default: 0 },

    // Ordering position for Kanban columns
    boardOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

taskSchema.index({ status: 1, priority: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ department: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ isDeleted: 1, isArchived: 1 });
taskSchema.index({ title: 'text', description: 'text', tags: 'text' });

taskSchema.virtual('checklistProgress').get(function () {
  if (!this.checklist || this.checklist.length === 0) return 0;
  const done = this.checklist.filter((c) => c.completed).length;
  return Math.round((done / this.checklist.length) * 100);
});

taskSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate) return false;
  const open = ![TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED, TASK_STATUS.REJECTED].includes(
    this.status
  );
  return open && new Date(this.dueDate) < new Date();
});

export const Task = mongoose.model('Task', taskSchema);
export default Task;

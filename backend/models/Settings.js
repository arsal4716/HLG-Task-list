import mongoose from 'mongoose';
import {
  TASK_STATUS_VALUES,
  TASK_PRIORITY_VALUES,
} from '../config/constants.js';

/**
 * Singleton company-wide settings document. Use Settings.getSingleton().
 */
const settingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: 'HLG Team' },
    logo: { type: String, default: '' },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
      workingDays: { type: [Number], default: [1, 2, 3, 4, 5] }, // 0=Sun
      hoursPerDay: { type: Number, default: 8 },
    },
    taskStatuses: { type: [String], default: TASK_STATUS_VALUES },
    taskPriorities: { type: [String], default: TASK_PRIORITY_VALUES },
    notificationSettings: {
      email: { type: Boolean, default: true },
      realtime: { type: Boolean, default: true },
      deadlineReminderHours: { type: Number, default: 24 },
    },
    performanceWeights: {
      completed: { type: Number, default: 40 },
      onTime: { type: Number, default: 30 },
      quality: { type: Number, default: 20 },
      attendance: { type: Number, default: 10 },
    },
  },
  { timestamps: true }
);

settingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

export const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;

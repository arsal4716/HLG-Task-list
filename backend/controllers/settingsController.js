import { Settings } from '../models/Settings.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getSettings = catchAsync(async (_req, res) => {
  const settings = await Settings.getSingleton();
  return sendSuccess(res, { data: { settings } });
});

export const updateSettings = catchAsync(async (req, res) => {
  const settings = await Settings.getSingleton();
  const fields = [
    'companyName',
    'logo',
    'workingHours',
    'taskStatuses',
    'taskPriorities',
    'notificationSettings',
    'performanceWeights',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) settings[f] = req.body[f];
  });
  await settings.save();
  return sendSuccess(res, { message: 'Settings updated', data: { settings } });
});

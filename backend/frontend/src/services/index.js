import { api } from '../lib/axios.js';

/** Thin, typed-ish wrappers around the REST API. Each returns response.data. */

export const authService = {
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updateMe: (payload) => api.patch('/auth/me', payload).then((r) => r.data),
  changePassword: (payload) => api.patch('/auth/change-password', payload).then((r) => r.data),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload).then((r) => r.data),
  resetPassword: (token, payload) =>
    api.patch(`/auth/reset-password/${token}`, payload).then((r) => r.data),
};

export const userService = {
  list: (params) => api.get('/users', { params }).then((r) => r.data),
  assignable: (params) => api.get('/users/assignable', { params }).then((r) => r.data),
  get: (id) => api.get(`/users/${id}`).then((r) => r.data),
  create: (payload) => api.post('/users', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/users/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/users/${id}`).then((r) => r.data),
  uploadAvatar: (formData) =>
    api.patch('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
};

export const taskService = {
  list: (params) => api.get('/tasks', { params }).then((r) => r.data),
  get: (id) => api.get(`/tasks/${id}`).then((r) => r.data),
  create: (payload) => api.post('/tasks', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/tasks/${id}`, payload).then((r) => r.data),
  remove: (id, hard) => api.delete(`/tasks/${id}`, { params: { hard } }).then((r) => r.data),
  assign: (id, assignedTo) => api.patch(`/tasks/${id}/assign`, { assignedTo }).then((r) => r.data),
  duplicate: (id) => api.post(`/tasks/${id}/duplicate`).then((r) => r.data),
  archive: (id, archive) => api.patch(`/tasks/${id}/archive`, { archive }).then((r) => r.data),
  move: (id, payload) => api.patch(`/tasks/${id}/move`, payload).then((r) => r.data),
  bulk: (payload) => api.post('/tasks/bulk', payload).then((r) => r.data),
  history: (id) => api.get(`/tasks/${id}/history`).then((r) => r.data),
  addChecklist: (id, text) => api.post(`/tasks/${id}/checklist`, { text }).then((r) => r.data),
  toggleChecklist: (id, itemId) => api.patch(`/tasks/${id}/checklist/${itemId}`).then((r) => r.data),
  removeChecklist: (id, itemId) => api.delete(`/tasks/${id}/checklist/${itemId}`).then((r) => r.data),
  uploadAttachments: (id, formData) =>
    api.post(`/tasks/${id}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  removeAttachment: (id, attId) => api.delete(`/tasks/${id}/attachments/${attId}`).then((r) => r.data),
};

export const commentService = {
  list: (taskId) => api.get(`/tasks/${taskId}/comments`).then((r) => r.data),
  add: (taskId, formData) =>
    api.post(`/tasks/${taskId}/comments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  update: (id, payload) => api.patch(`/comments/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/comments/${id}`).then((r) => r.data),
};

export const timeService = {
  start: (taskId) => api.post(`/tasks/${taskId}/timer/start`).then((r) => r.data),
  pause: (id) => api.patch(`/timelogs/${id}/pause`).then((r) => r.data),
  resume: (id) => api.patch(`/timelogs/${id}/resume`).then((r) => r.data),
  stop: (id, note) => api.patch(`/timelogs/${id}/stop`, { note }).then((r) => r.data),
  active: () => api.get('/timelogs/active').then((r) => r.data),
  summary: () => api.get('/timelogs/summary').then((r) => r.data),
  taskLogs: (taskId) => api.get(`/tasks/${taskId}/timelogs`).then((r) => r.data),
};

export const departmentService = {
  list: () => api.get('/departments').then((r) => r.data),
  create: (payload) => api.post('/departments', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/departments/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/departments/${id}`).then((r) => r.data),
};

export const notificationService = {
  list: (params) => api.get('/notifications', { params }).then((r) => r.data),
  unreadCount: () => api.get('/notifications/unread-count').then((r) => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAll: () => api.patch('/notifications/read-all').then((r) => r.data),
  remove: (id) => api.delete(`/notifications/${id}`).then((r) => r.data),
};

export const dashboardService = {
  get: () => api.get('/dashboard').then((r) => r.data),
  calendar: (params) => api.get('/dashboard/calendar', { params }).then((r) => r.data),
};

export const reportService = {
  employees: (params) => api.get('/reports/employees', { params }).then((r) => r.data),
  departments: (params) => api.get('/reports/departments', { params }).then((r) => r.data),
  completion: (params) => api.get('/reports/completion', { params }).then((r) => r.data),
  late: (params) => api.get('/reports/late', { params }).then((r) => r.data),
  performance: (params) => api.get('/reports/performance', { params }).then((r) => r.data),
  download: (path, params) =>
    api.get(`/reports/${path}`, { params: { ...params, format: 'csv' }, responseType: 'blob' }),
};

export const performanceService = {
  list: () => api.get('/performance').then((r) => r.data),
  get: (id) => api.get(`/performance/${id}`).then((r) => r.data),
  recalcAll: () => api.post('/performance/recalc-all').then((r) => r.data),
};

export const settingsService = {
  get: () => api.get('/settings').then((r) => r.data),
  update: (payload) => api.patch('/settings', payload).then((r) => r.data),
  holidays: (params) => api.get('/settings/holidays', { params }).then((r) => r.data),
  addHoliday: (payload) => api.post('/settings/holidays', payload).then((r) => r.data),
  removeHoliday: (id) => api.delete(`/settings/holidays/${id}`).then((r) => r.data),
};

export const buyerService = {
  list: (params) => api.get('/buyers', { params }).then((r) => r.data),
  get: (id) => api.get(`/buyers/${id}`).then((r) => r.data),
  create: (payload) => api.post('/buyers', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/buyers/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/buyers/${id}`).then((r) => r.data),
  campaigns: (buyerId) => api.get(`/buyers/${buyerId}/campaigns`).then((r) => r.data),
  createCampaign: (buyerId, payload) =>
    api.post(`/buyers/${buyerId}/campaigns`, payload).then((r) => r.data),
};

export const campaignService = {
  get: (id) => api.get(`/campaigns/${id}`).then((r) => r.data),
  update: (id, payload) => api.patch(`/campaigns/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/campaigns/${id}`).then((r) => r.data),
  publishers: (campaignId) => api.get(`/campaigns/${campaignId}/publishers`).then((r) => r.data),
  createPublisher: (campaignId, payload) =>
    api.post(`/campaigns/${campaignId}/publishers`, payload).then((r) => r.data),
};

export const publisherService = {
  update: (id, payload) => api.patch(`/publishers/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/publishers/${id}`).then((r) => r.data),
};

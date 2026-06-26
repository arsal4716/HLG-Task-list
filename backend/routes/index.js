import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import taskRoutes from './taskRoutes.js';
import commentRoutes from './commentRoutes.js';
import timeRoutes from './timeRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import reportRoutes from './reportRoutes.js';
import performanceRoutes from './performanceRoutes.js';
import settingsRoutes from './settingsRoutes.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'HLG Task API is healthy', timestamp: new Date().toISOString() })
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/comments', commentRoutes);
router.use('/timelogs', timeRoutes);
router.use('/departments', departmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/performance', performanceRoutes);
router.use('/settings', settingsRoutes);

export default router;

import { Router } from 'express';
import * as time from '../controllers/timeLogController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/active', time.getActiveTimer);
router.get('/summary', time.getMyTimeSummary);
router.patch('/:id/pause', time.pauseTimer);
router.patch('/:id/resume', time.resumeTimer);
router.patch('/:id/stop', time.stopTimer);

export default router;

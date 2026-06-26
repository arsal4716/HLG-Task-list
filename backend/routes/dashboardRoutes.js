import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import { getCalendar } from '../controllers/calendarController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', getDashboard);
router.get('/calendar', getCalendar);

export default router;

import { Router } from 'express';
import * as settings from '../controllers/settingsController.js';
import * as holidays from '../controllers/holidayController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(protect);

router.get('/', settings.getSettings);
router.patch('/', authorize(ROLES.OWNER), settings.updateSettings);

router.get('/holidays', holidays.listHolidays);
router.post('/holidays', authorize(ROLES.OWNER, ROLES.MANAGER), holidays.createHoliday);
router.patch('/holidays/:id', authorize(ROLES.OWNER, ROLES.MANAGER), holidays.updateHoliday);
router.delete('/holidays/:id', authorize(ROLES.OWNER, ROLES.MANAGER), holidays.deleteHoliday);

export default router;

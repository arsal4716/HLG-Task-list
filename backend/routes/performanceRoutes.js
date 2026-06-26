import { Router } from 'express';
import * as performance from '../controllers/performanceController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(protect);

router.get('/', authorize(ROLES.OWNER, ROLES.MANAGER), performance.listPerformance);
router.post('/recalc-all', authorize(ROLES.OWNER), performance.recalcAll);
router.get('/:id', performance.getUserPerformance);

export default router;

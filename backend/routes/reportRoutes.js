import { Router } from 'express';
import * as reports from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(protect, authorize(ROLES.OWNER, ROLES.MANAGER));

router.get('/employees', reports.employeeReport);
router.get('/departments', reports.departmentReport);
router.get('/completion', reports.taskCompletionReport);
router.get('/late', reports.lateTasksReport);
router.get('/performance', reports.performanceReport);

export default router;

import { Router } from 'express';
import * as departments from '../controllers/departmentController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(protect);

router.get('/', departments.listDepartments);
router.post('/', authorize(ROLES.OWNER, ROLES.MANAGER), departments.createDepartment);
router.patch('/:id', authorize(ROLES.OWNER, ROLES.MANAGER), departments.updateDepartment);
router.delete('/:id', authorize(ROLES.OWNER), departments.deleteDepartment);

export default router;

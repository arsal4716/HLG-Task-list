import { Router } from 'express';
import * as ctrl from '../controllers/buyerController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(protect, authorize(ROLES.OWNER, ROLES.MANAGER));

router.patch('/:id', ctrl.updatePublisher);
router.delete('/:id', ctrl.deletePublisher);

export default router;

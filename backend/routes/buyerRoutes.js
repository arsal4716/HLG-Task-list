import { Router } from 'express';
import * as ctrl from '../controllers/buyerController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Owner + Manager (and IT-department users, elevated to Owner) manage the
// buyer / campaign / publisher database.
router.use(protect, authorize(ROLES.OWNER, ROLES.MANAGER));

// Buyers
router.get('/', ctrl.listBuyers);
router.post('/', ctrl.createBuyer);
router.get('/:id', ctrl.getBuyer);
router.patch('/:id', ctrl.updateBuyer);
router.delete('/:id', ctrl.deleteBuyer);

// Campaigns (nested under a buyer)
router.get('/:buyerId/campaigns', ctrl.listCampaigns);
router.post('/:buyerId/campaigns', ctrl.createCampaign);

export default router;

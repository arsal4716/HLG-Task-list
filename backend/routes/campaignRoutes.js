import { Router } from 'express';
import * as ctrl from '../controllers/buyerController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(protect, authorize(ROLES.OWNER, ROLES.MANAGER));

router.get('/:id', ctrl.getCampaign);
router.patch('/:id', ctrl.updateCampaign);
router.delete('/:id', ctrl.deleteCampaign);

// Publishers (nested under a campaign)
router.get('/:campaignId/publishers', ctrl.listPublishers);
router.post('/:campaignId/publishers', ctrl.createPublisher);

export default router;

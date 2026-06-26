import { Router } from 'express';
import * as comments from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.patch('/:id', comments.updateComment);
router.delete('/:id', comments.deleteComment);

export default router;

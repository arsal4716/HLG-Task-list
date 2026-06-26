import { Router } from 'express';
import * as users from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import { createUserRules, updateUserRules } from '../validators/userValidator.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(protect);

router.get('/assignable', users.listAssignable);
router.patch('/avatar', upload.single('avatar'), users.uploadAvatar);

router.get('/', authorize(ROLES.OWNER, ROLES.MANAGER), users.listUsers);
router.post('/', authorize(ROLES.OWNER, ROLES.MANAGER), validate(createUserRules), users.createUser);
router.get('/:id', users.getUser);
router.patch('/:id', authorize(ROLES.OWNER, ROLES.MANAGER), validate(updateUserRules), users.updateUser);
router.delete('/:id', authorize(ROLES.OWNER), users.deleteUser);
router.post('/:id/recalc-performance', authorize(ROLES.OWNER, ROLES.MANAGER), users.recalcUserPerformance);

export default router;

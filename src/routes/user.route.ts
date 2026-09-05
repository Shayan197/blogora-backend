import express from 'express';

import * as userCtrl from '@/controllers/user.controller.js';
import { authorizeRoles, verifyToken, VerifyTokenNSetUser } from '@/middlewares/auth.middleware.js';

const router = express.Router();

// All user management routes require admin privileges
router.use(verifyToken, VerifyTokenNSetUser);

router.get('/', authorizeRoles('super-admin', 'admin'), userCtrl.listUsers);
router.get('/:uuid', authorizeRoles('super-admin', 'admin'), userCtrl.getUserByUuid);
router.patch('/:uuid/role', authorizeRoles('super-admin'), userCtrl.updateUserRole);
router.patch('/:uuid/status', authorizeRoles('super-admin', 'admin'), userCtrl.updateUserStatus);

export default router;

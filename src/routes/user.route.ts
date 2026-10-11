import express from 'express';

import * as userCtrl from '@/controllers/user.controller.js';
import { authorizeRoles, verifyToken, VerifyTokenNSetUser } from '@/middlewares/auth.middleware.js';

const router = express.Router();

// All user management routes require admin privileges
router.use(verifyToken, VerifyTokenNSetUser);

router.get('/', authorizeRoles('super-admin', 'admin'), userCtrl.listUsers);
router.get('/roles', authorizeRoles('super-admin', 'admin'), userCtrl.listRoles);
router.get(
    '/analytics/overview',
    authorizeRoles('super-admin', 'admin'),
    userCtrl.getAdminAnalytics,
);
router.get('/:uuid', authorizeRoles('super-admin', 'admin'), userCtrl.getUserByUuid);
router.patch('/:uuid/role', authorizeRoles('super-admin'), userCtrl.updateUserRole);
router.patch('/:uuid/status', authorizeRoles('super-admin', 'admin'), userCtrl.updateUserStatus);
router.patch('/:uuid/verify', authorizeRoles('super-admin', 'admin'), userCtrl.verifyUserManually);

export default router;

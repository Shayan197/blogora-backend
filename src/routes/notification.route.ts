import express from 'express';

import * as notifCtrl from '@/controllers/notification.controller.js';
import { verifyToken, VerifyTokenNSetUser } from '@/middlewares/auth.middleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(verifyToken, VerifyTokenNSetUser);

router.get('/', notifCtrl.getNotifications);
router.patch('/read-all', notifCtrl.markAllAsRead);
router.patch('/:uuid/read', notifCtrl.markAsRead);
router.delete('/:uuid', notifCtrl.deleteNotification);

export default router;

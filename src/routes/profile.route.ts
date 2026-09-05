import express from 'express';

import * as profileCtrl from '@/controllers/profile.controller.js';
import { verifyToken, VerifyTokenNSetUser } from '@/middlewares/auth.middleware.js';

const router = express.Router();

router.get('/me', verifyToken, VerifyTokenNSetUser, profileCtrl.getMyProfile);
router.put('/me', verifyToken, VerifyTokenNSetUser, profileCtrl.updateMyProfile);
router.get('/author/:userUuid', profileCtrl.getPublicProfile);

export default router;

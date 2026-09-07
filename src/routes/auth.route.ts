// import required modules and configuration
import express from 'express';

import * as authCtrl from '@/controllers/auth.controller.js';
import { verifyToken, verifyRefreshToken, optionalAuth } from '@/middlewares/auth.middleware.js';

const router = express.Router();

router.post('/signup', authCtrl.registerUser);

router.post('/otp-verify', authCtrl.verifyOTP);

router.post('/otp-resend', authCtrl.resendOtp);

router.post('/login', authCtrl.loginUser);

router.post('/logout', optionalAuth, authCtrl.logoutUser);

router.post('/token-refresh', verifyRefreshToken, authCtrl.regenerateAccessToken);

router.route('/me').get(verifyToken, authCtrl.getUser).patch(verifyToken, authCtrl.updateUser);

router.post('/password/update', verifyToken, authCtrl.updatePassword);

router.post('/password/forget', authCtrl.forgotPassword);

router.post('/password/otp-verify', authCtrl.forgotPasswordOtpVerify);

router.post('/password/reset', authCtrl.forgotPasswordReset);

export default router;

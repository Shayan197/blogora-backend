import express from 'express';

import * as commentCtrl from '@/controllers/comment.controller.js';
import { verifyToken, VerifyTokenNSetUser } from '@/middlewares/auth.middleware.js';

const router = express.Router();

// Public: Get comments for a blog
router.get('/blog/:blogUuid', commentCtrl.getBlogComments);

// Protected: Post, update, delete comments
router.post('/blog/:blogUuid', verifyToken, VerifyTokenNSetUser, commentCtrl.createComment);
router.patch('/:uuid', verifyToken, VerifyTokenNSetUser, commentCtrl.updateComment);
router.delete('/:uuid', verifyToken, VerifyTokenNSetUser, commentCtrl.deleteComment);

export default router;

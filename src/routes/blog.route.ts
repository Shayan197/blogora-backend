import express from 'express';

import * as blogCtrl from '@/controllers/blog.controller.js';
import * as likeCtrl from '@/controllers/like.controller.js';
import {
    authorizeRoles,
    optionalAuth,
    verifyToken,
    VerifyTokenNSetUser,
} from '@/middlewares/auth.middleware.js';

const router = express.Router();

// ======================= Public & Feed Routes =======================
router.get('/', optionalAuth, blogCtrl.listBlogs);
router.get('/trending', blogCtrl.getTrendingBlogs);

// ======================= Author Story Management =======================
router.get('/me', verifyToken, VerifyTokenNSetUser, blogCtrl.getMyBlogs);

// ======================= Single Blog Read View =======================
router.get('/:slugOrUuid', optionalAuth, blogCtrl.getBlogBySlug);

// ======================= Blog CRUD Operations =======================
router.post(
    '/',
    verifyToken,
    VerifyTokenNSetUser,
    authorizeRoles('super-admin', 'admin', 'editor', 'author'),
    blogCtrl.createBlog,
);

router.patch('/:uuid', verifyToken, VerifyTokenNSetUser, blogCtrl.updateBlog);
router.delete('/:uuid', verifyToken, VerifyTokenNSetUser, blogCtrl.deleteBlog);
router.patch('/:uuid/publish', verifyToken, VerifyTokenNSetUser, blogCtrl.togglePublishStatus);

// ======================= Like Routes on Blog =======================
router.post('/:blogUuid/likes', verifyToken, VerifyTokenNSetUser, likeCtrl.toggleLike);
router.get('/:blogUuid/likes', likeCtrl.getBlogLikers);

export default router;

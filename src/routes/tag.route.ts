import express from 'express';

import * as tagCtrl from '@/controllers/tag.controller.js';
import { authorizeRoles, verifyToken, VerifyTokenNSetUser } from '@/middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', tagCtrl.listTags);
router.get('/:slug', tagCtrl.getTagBySlug);

// Protected routes
router.post('/', verifyToken, VerifyTokenNSetUser, tagCtrl.createTag);
router.patch(
    '/:uuid',
    verifyToken,
    VerifyTokenNSetUser,
    authorizeRoles('super-admin', 'admin', 'editor'),
    tagCtrl.updateTag,
);
router.delete(
    '/:uuid',
    verifyToken,
    VerifyTokenNSetUser,
    authorizeRoles('super-admin', 'admin'),
    tagCtrl.deleteTag,
);

export default router;

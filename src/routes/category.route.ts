import express from 'express';

import * as categoryCtrl from '@/controllers/category.controller.js';
import { authorizeRoles, verifyToken, VerifyTokenNSetUser } from '@/middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', categoryCtrl.listCategories);
router.get('/:slug', categoryCtrl.getCategoryBySlug);

// Protected routes (Admin / Editor)
router.post(
    '/',
    verifyToken,
    VerifyTokenNSetUser,
    authorizeRoles('super-admin', 'admin', 'editor'),
    categoryCtrl.createCategory,
);
router.patch(
    '/:uuid',
    verifyToken,
    VerifyTokenNSetUser,
    authorizeRoles('super-admin', 'admin', 'editor'),
    categoryCtrl.updateCategory,
);
router.delete(
    '/:uuid',
    verifyToken,
    VerifyTokenNSetUser,
    authorizeRoles('super-admin', 'admin'),
    categoryCtrl.deleteCategory,
);

export default router;

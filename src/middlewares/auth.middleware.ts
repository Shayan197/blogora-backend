import { Request, Response, NextFunction } from 'express';

import { jwtVerifier } from '@/config/jwt.config.js';
import Role from '@/models/auth/role.model.js';
import User from '@/models/auth/user.model.js';
import { unauthorizedError, forbiddenError } from '@/utils/response.util.js';

// Middleware to validate JWT tokens

//================== Verify Token =====================
export const verifyToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const accessToken = req.cookies.accessToken as string | undefined;
        if (!accessToken) {
            unauthorizedError(res, 'No access token, authorization denied');
            return;
        }

        const decode = jwtVerifier(accessToken);
        if (decode.token !== 'access') {
            unauthorizedError(res, 'Invalid access token');
            return;
        }
        req.userUid = decode.userUid;
        next();
    } catch (_error) {
        unauthorizedError(res, 'Invalid access token');
    }
};

// ================== Verify Refresh Token =====================
export const verifyRefreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const refreshToken = req.cookies.refreshToken as string | undefined;
        if (!refreshToken) {
            unauthorizedError(res, 'No refresh token, authorization denied');
            return;
        }

        const decode = jwtVerifier(refreshToken);
        if (decode.token !== 'refresh') {
            unauthorizedError(res, 'Invalid refresh token');
            return;
        }
        req.userUid = decode.userUid;
        next();
    } catch (_error) {
        unauthorizedError(res, 'Invalid refresh token');
    }
};

// =================== VerifyTokenNSetUser ======================
export const VerifyTokenNSetUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const uuid = req.userUid;
        const user = await User.findOne({
            where: { uuid },
            include: [{ model: Role, as: 'role' }],
        });
        if (!user) {
            unauthorizedError(res, 'Invalid token');
            return;
        }
        if (!user.isActive) {
            forbiddenError(res, 'Account is not active');
            return;
        }
        req.user = user;
        next();
    } catch (_error) {
        unauthorizedError(res, 'Invalid token');
    }
};

// =================== Authorize Roles ======================
export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || !req.user.role) {
            forbiddenError(res, 'Access denied. Role information missing.');
            return;
        }
        const userRoleSlug = req.user.role.slug?.toLowerCase();
        const userRoleName = req.user.role.name?.toLowerCase();

        const isAllowed = allowedRoles.some((role) => {
            const normalized = role.toLowerCase();
            return normalized === userRoleSlug || normalized === userRoleName;
        });

        if (!isAllowed) {
            forbiddenError(
                res,
                'Access denied. You do not have permission to perform this action.',
            );
            return;
        }
        next();
    };
};

// =================== Optional Auth ======================
export const optionalAuth = async (
    req: Request,
    _res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const accessToken = req.cookies.accessToken as string | undefined;
        if (accessToken) {
            const decode = jwtVerifier(accessToken);
            if (decode && decode.token === 'access') {
                req.userUid = decode.userUid;
                const user = await User.findOne({
                    where: { uuid: decode.userUid },
                    include: [{ model: Role, as: 'role' }],
                });
                if (user && user.isActive) {
                    req.user = user;
                }
            }
        }
    } catch (_error) {
        // Silently continue without setting req.user
    }
    next();
};

import { Request, Response } from 'express';
import { Op } from 'sequelize';

import Profile from '@/models/auth/profile.model.js';
import Role from '@/models/auth/role.model.js';
import User from '@/models/auth/user.model.js';
import { formatPaginationData, getPaginationOptions } from '@/utils/pagination.util.js';
import { bodyReqFields } from '@/utils/requiredFields.util.js';
import {
    catchError,
    catchWithSequelizeValidationError,
    notFound,
    successOk,
    successOkWithData,
    validationError,
} from '@/utils/response.util.js';

// =================================== listUsers (Admin) ===================================
export const listUsers = async (req: Request, res: Response) => {
    try {
        const { page, limit, offset } = getPaginationOptions(req);
        const { roleId, status, search } = req.query as {
            roleId?: string;
            status?: string;
            search?: string;
        };

        const whereCondition: Record<string | symbol, unknown> = {};

        if (roleId) {
            whereCondition.roleId = parseInt(roleId, 10);
        }
        if (status) {
            whereCondition.status = status;
        }
        if (search) {
            whereCondition[Op.or] = [
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const { rows: users, count: totalItems } = await User.findAndCountAll({
            where: whereCondition,
            attributes: { exclude: ['password', 'otp', 'otpCount', 'deletedAt'] },
            include: [
                { model: Role, as: 'role', attributes: ['id', 'uuid', 'name', 'slug', 'color'] },
                {
                    model: Profile,
                    as: 'profile',
                    attributes: ['headline', 'avatar', 'location', 'bio'],
                },
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        });

        const result = formatPaginationData(users, totalItems, page, limit);
        return successOkWithData(res, result, 'Users fetched successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== getUserByUuid ===================================
export const getUserByUuid = async (req: Request, res: Response) => {
    try {
        const { uuid } = req.params;
        const user = await User.findOne({
            where: { uuid },
            attributes: { exclude: ['password', 'otp', 'otpCount', 'deletedAt'] },
            include: [
                { model: Role, as: 'role', attributes: ['id', 'uuid', 'name', 'slug', 'color'] },
                { model: Profile, as: 'profile' },
            ],
        });

        if (!user) {
            return notFound(res, 'User not found');
        }

        return successOkWithData(res, { user }, 'User details fetched successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== updateUserRole (Admin) ===================================
export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { uuid } = req.params;
        const reqBody = bodyReqFields(req, res, ['roleId']);
        if (reqBody.error) {
            return reqBody.response;
        }

        const { roleId } = req.body as { roleId: number };

        const targetRole = await Role.findByPk(roleId);
        if (!targetRole) {
            return validationError(res, 'Specified role does not exist');
        }

        const user = await User.findOne({ where: { uuid } });
        if (!user) {
            return notFound(res, 'User not found');
        }

        user.roleId = roleId;
        await user.save({ fields: ['roleId'] });

        return successOk(res, `User role updated to ${targetRole.name} successfully`);
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

// =================================== updateUserStatus (Admin) ===================================
export const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { uuid } = req.params;
        const reqBody = bodyReqFields(req, res, ['status']);
        if (reqBody.error) {
            return reqBody.response;
        }

        const { status } = req.body as { status: 'pending' | 'active' | 'blocked' | 'suspended' };
        const validStatuses = ['pending', 'active', 'blocked', 'suspended'];
        if (!validStatuses.includes(status)) {
            return validationError(
                res,
                `Invalid status. Allowed values: ${validStatuses.join(', ')}`,
            );
        }

        const user = await User.findOne({ where: { uuid } });
        if (!user) {
            return notFound(res, 'User not found');
        }

        user.status = status;
        if (status === 'blocked' || status === 'suspended') {
            user.isActive = false;
            await user.save({ fields: ['status', 'isActive'] });
        } else {
            await user.save({ fields: ['status'] });
        }

        return successOk(res, `User status updated to ${status} successfully`);
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

import { Request, Response } from 'express';

import Profile from '@/models/auth/profile.model.js';
import User from '@/models/auth/user.model.js';
import Notification from '@/models/notification/notification.model.js';
import { formatPaginationData, getPaginationOptions } from '@/utils/pagination.util.js';
import {
    catchError,
    catchWithSequelizeValidationError,
    notFound,
    successOk,
    successOkWithData,
    unauthorizedError,
} from '@/utils/response.util.js';

// =================================== getNotifications ===================================
export const getNotifications = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return unauthorizedError(res, 'Authentication required');
        }

        const { page, limit, offset } = getPaginationOptions(req, 15);

        const unreadCount = await Notification.count({
            where: { recipientId: req.user.id, isRead: false },
        });

        const { rows: notifications, count: totalItems } = await Notification.findAndCountAll({
            where: { recipientId: req.user.id },
            include: [
                {
                    model: User,
                    as: 'actor',
                    attributes: ['uuid', 'firstName', 'lastName', 'avatar'],
                    include: [
                        { model: Profile, as: 'profile', attributes: ['headline', 'avatar'] },
                    ],
                },
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        });

        const paginatedResult = formatPaginationData(notifications, totalItems, page, limit);

        return successOkWithData(
            res,
            {
                ...paginatedResult,
                unreadCount,
            },
            'Notifications fetched successfully',
        );
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== markAsRead ===================================
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { uuid } = req.params;
        if (!req.user) {
            return unauthorizedError(res, 'Authentication required');
        }

        const notification = await Notification.findOne({
            where: { uuid, recipientId: req.user.id },
        });

        if (!notification) {
            return notFound(res, 'Notification not found');
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save({ fields: ['isRead', 'readAt'] });

        return successOk(res, 'Notification marked as read');
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

// =================================== markAllAsRead ===================================
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return unauthorizedError(res, 'Authentication required');
        }

        await Notification.update(
            { isRead: true, readAt: new Date() },
            { where: { recipientId: req.user.id, isRead: false } },
        );

        return successOk(res, 'All notifications marked as read');
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

// =================================== deleteNotification ===================================
export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const { uuid } = req.params;
        if (!req.user) {
            return unauthorizedError(res, 'Authentication required');
        }

        const notification = await Notification.findOne({
            where: { uuid, recipientId: req.user.id },
        });

        if (!notification) {
            return notFound(res, 'Notification not found');
        }

        await notification.destroy();
        return successOk(res, 'Notification deleted successfully');
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

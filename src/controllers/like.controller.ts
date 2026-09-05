import { Request, Response } from 'express';
import Sequelize from 'sequelize';

import sequelize from '@/config/db.config.js';
import Profile from '@/models/auth/profile.model.js';
import User from '@/models/auth/user.model.js';
import Blog from '@/models/blog/blog.model.js';
import Like from '@/models/blog/like.model.js';
import Notification from '@/models/notification/notification.model.js';
import { formatPaginationData, getPaginationOptions } from '@/utils/pagination.util.js';
import {
    catchError,
    catchWithSequelizeValidationError,
    notFound,
    successOkWithData,
    unauthorizedError,
} from '@/utils/response.util.js';

// =================================== toggleLike ===================================
export const toggleLike = async (req: Request, res: Response) => {
    const { blogUuid } = req.params;
    if (!req.user) {
        return unauthorizedError(res, 'Authentication required');
    }

    const blog = await Blog.findOne({ where: { uuid: blogUuid } });
    if (!blog) {
        return notFound(res, 'Blog story not found');
    }

    const transaction = await sequelize.transaction();

    try {
        const existingLike = await Like.findOne({
            where: { blogId: blog.id, userId: req.user.id },
            transaction,
        });

        let liked = false;

        if (existingLike) {
            // Unlike
            await existingLike.destroy({ transaction });
            await blog.decrement('likesCount', {
                by: 1,
                where: { id: blog.id, likesCount: { [Sequelize.Op.gt]: 0 } },
                transaction,
            });
            liked = false;
        } else {
            // Like
            await Like.create({ blogId: blog.id, userId: req.user.id }, { transaction });
            await blog.increment('likesCount', { by: 1, transaction });
            liked = true;

            // Trigger notification to author (unless liking own post)
            if (blog.authorId !== req.user.id) {
                await Notification.create(
                    {
                        recipientId: blog.authorId,
                        actorId: req.user.id,
                        type: 'like',
                        entityId: blog.id,
                        message: `${req.user.fullName} liked your story "${blog.title}".`,
                    },
                    { transaction },
                );
            }
        }

        await transaction.commit();

        const updatedBlog = await Blog.findByPk(blog.id, { attributes: ['likesCount'] });

        return successOkWithData(
            res,
            {
                liked,
                likesCount: updatedBlog?.likesCount ?? 0,
            },
            liked ? 'Story liked successfully' : 'Story unliked successfully',
        );
    } catch (error) {
        if (!(transaction as unknown as { finished?: string }).finished) {
            await transaction.rollback();
        }
        return catchWithSequelizeValidationError(res, error);
    }
};

// =================================== getBlogLikers ===================================
export const getBlogLikers = async (req: Request, res: Response) => {
    try {
        const { blogUuid } = req.params;
        const blog = await Blog.findOne({ where: { uuid: blogUuid } });
        if (!blog) {
            return notFound(res, 'Blog story not found');
        }

        const { page, limit, offset } = getPaginationOptions(req, 20);

        const { rows: likes, count: totalItems } = await Like.findAndCountAll({
            where: { blogId: blog.id },
            include: [
                {
                    model: User,
                    as: 'user',
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

        const users = likes.map((l) => l.get('user'));
        const paginatedResult = formatPaginationData(users, totalItems, page, limit);

        return successOkWithData(res, paginatedResult, 'Story likers fetched successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

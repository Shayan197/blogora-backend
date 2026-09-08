import { Request, Response } from 'express';
import { Op } from 'sequelize';

import sequelize from '@/config/db.config.js';
import Profile from '@/models/auth/profile.model.js';
import User from '@/models/auth/user.model.js';
import Blog from '@/models/blog/blog.model.js';
import Comment from '@/models/blog/comment.model.js';
import Notification from '@/models/notification/notification.model.js';
import { bodyReqFields } from '@/utils/requiredFields.util.js';
import {
    catchError,
    catchWithSequelizeValidationError,
    createdWithData,
    forbiddenError,
    notFound,
    successOk,
    successOkWithData,
    unauthorizedError,
    validationError,
} from '@/utils/response.util.js';

// =================================== getBlogComments ===================================
export const getBlogComments = async (req: Request, res: Response) => {
    try {
        const { blogUuid } = req.params;

        const blog = await Blog.findOne({ where: { uuid: blogUuid } });
        if (!blog) {
            return notFound(res, 'Blog story not found');
        }

        const comments = await Comment.findAll({
            where: {
                blogId: blog.id,
                parentId: null,
                status: 'approved',
            },
            attributes: ['id', 'uuid', 'content', 'likesCount', 'createdAt', 'updatedAt'],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['uuid', 'firstName', 'lastName', 'avatar'],
                    include: [
                        { model: Profile, as: 'profile', attributes: ['headline', 'avatar'] },
                    ],
                },
                {
                    model: Comment,
                    as: 'replies',
                    where: { status: 'approved' },
                    required: false,
                    attributes: [
                        'id',
                        'uuid',
                        'parentId',
                        'content',
                        'likesCount',
                        'createdAt',
                        'updatedAt',
                    ],
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['uuid', 'firstName', 'lastName', 'avatar'],
                            include: [
                                {
                                    model: Profile,
                                    as: 'profile',
                                    attributes: ['headline', 'avatar'],
                                },
                            ],
                        },
                    ],
                },
            ],
            order: [
                ['createdAt', 'DESC'],
                [{ model: Comment, as: 'replies' }, 'createdAt', 'ASC'],
            ],
        });

        return successOkWithData(res, { comments }, 'Comments fetched successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== createComment ===================================
export const createComment = async (req: Request, res: Response) => {
    const { blogUuid } = req.params;
    if (!req.user) {
        return unauthorizedError(res, 'Authentication required');
    }

    const reqBody = bodyReqFields(req, res, ['content']);
    if (reqBody.error) {
        return reqBody.response;
    }

    const { content, parentCommentUuid } = req.body as {
        content: string;
        parentCommentUuid?: string;
    };

    const blog = await Blog.findOne({ where: { uuid: blogUuid } });
    if (!blog) {
        return notFound(res, 'Blog story not found');
    }

    let parentId: number | null = null;
    let parentComment: Comment | null = null;

    if (parentCommentUuid) {
        parentComment = await Comment.findOne({
            where: { uuid: parentCommentUuid, blogId: blog.id },
        });
        if (!parentComment) {
            return validationError(res, 'Parent comment not found for this story');
        }
        parentId = parentComment.id;
    }

    const transaction = await sequelize.transaction();

    try {
        const comment = await Comment.create(
            {
                blogId: blog.id,
                userId: req.user.id,
                parentId,
                content,
                status: 'approved',
                likesCount: 0,
            },
            { transaction },
        );

        // Increment commentsCount on Blog
        await blog.increment('commentsCount', { by: 1, transaction });

        // Trigger notification
        if (parentId && parentComment && parentComment.userId !== req.user.id) {
            // Notification to parent comment author
            await Notification.create(
                {
                    recipientId: parentComment.userId,
                    actorId: req.user.id,
                    type: 'reply',
                    entityId: blog.id,
                    message: `${req.user.fullName} replied to your comment on "${blog.title}".`,
                },
                { transaction },
            );
        } else if (blog.authorId !== req.user.id) {
            // Notification to blog author
            await Notification.create(
                {
                    recipientId: blog.authorId,
                    actorId: req.user.id,
                    type: 'comment',
                    entityId: blog.id,
                    message: `${req.user.fullName} commented on your story "${blog.title}".`,
                },
                { transaction },
            );
        }

        await transaction.commit();

        const createdComment = await Comment.findByPk(comment.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['uuid', 'firstName', 'lastName', 'avatar'],
                },
            ],
        });

        return createdWithData(res, { comment: createdComment }, 'Comment posted successfully');
    } catch (error) {
        if (!(transaction as unknown as { finished?: string }).finished) {
            await transaction.rollback();
        }
        return catchWithSequelizeValidationError(res, error);
    }
};

// =================================== updateComment ===================================
export const updateComment = async (req: Request, res: Response) => {
    try {
        const { uuid } = req.params;
        if (!req.user) {
            return unauthorizedError(res, 'Authentication required');
        }

        const reqBody = bodyReqFields(req, res, ['content']);
        if (reqBody.error) {
            return reqBody.response;
        }

        const { content } = req.body as { content: string };

        const comment = await Comment.findOne({ where: { uuid } });
        if (!comment) {
            return notFound(res, 'Comment not found');
        }

        if (comment.userId !== req.user.id) {
            return forbiddenError(res, 'You can only edit your own comments');
        }

        comment.content = content;
        await comment.save({ fields: ['content'] });

        return successOkWithData(res, { comment }, 'Comment updated successfully');
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

// =================================== deleteComment ===================================
export const deleteComment = async (req: Request, res: Response) => {
    const { uuid } = req.params;
    if (!req.user) {
        return unauthorizedError(res, 'Authentication required');
    }

    const comment = await Comment.findOne({ where: { uuid } });
    if (!comment) {
        return notFound(res, 'Comment not found');
    }

    const isOwner = comment.userId === req.user.id;
    const blog = await Blog.findByPk(comment.blogId, { attributes: ['authorId'] });
    const isBlogAuthor = blog?.authorId === req.user.id;
    const userRoleSlug = req.user.role?.slug?.toLowerCase() || '';
    const isModeratorOrAdmin = ['super-admin', 'admin', 'moderator'].includes(userRoleSlug);

    if (!isOwner && !isBlogAuthor && !isModeratorOrAdmin) {
        return forbiddenError(res, 'You do not have permission to delete this comment');
    }

    const transaction = await sequelize.transaction();

    try {
        await comment.destroy({ transaction });

        // Decrement commentsCount on Blog
        await Blog.decrement('commentsCount', {
            by: 1,
            where: { id: comment.blogId, commentsCount: { [Op.gt]: 0 } },
            transaction,
        });

        await transaction.commit();
        return successOk(res, 'Comment deleted successfully');
    } catch (error) {
        if (!(transaction as unknown as { finished?: string }).finished) {
            await transaction.rollback();
        }
        return catchWithSequelizeValidationError(res, error);
    }
};

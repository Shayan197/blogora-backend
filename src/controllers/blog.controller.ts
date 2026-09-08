import { Request, Response } from 'express';
import Sequelize, { Op } from 'sequelize';

import sequelize from '@/config/db.config.js';
import Profile from '@/models/auth/profile.model.js';
import User from '@/models/auth/user.model.js';
import Blog from '@/models/blog/blog.model.js';
import BlogTag from '@/models/blog/blogTag.model.js';
import Category from '@/models/blog/category.model.js';
import Like from '@/models/blog/like.model.js';
import Tag from '@/models/blog/tag.model.js';
import { formatPaginationData, getPaginationOptions } from '@/utils/pagination.util.js';
import { calculateReadingTime } from '@/utils/readingTime.util.js';
import { bodyReqFields } from '@/utils/requiredFields.util.js';
import {
    catchError,
    catchWithSequelizeValidationError,
    conflictError,
    createdWithData,
    forbiddenError,
    notFound,
    successOk,
    successOkWithData,
    unauthorizedError,
    validationError,
} from '@/utils/response.util.js';
import { generateSlug } from '@/utils/slug.util.js';
import { extractFieldsToUpdate, isValidUuid } from '@/utils/utils.js';

// =================================== listBlogs (Public Feed) ===================================
export const listBlogs = async (req: Request, res: Response) => {
    try {
        const { page, limit, offset } = getPaginationOptions(req, 10);
        const { category, tag, author, search, featured, sort } = req.query as {
            category?: string;
            tag?: string;
            author?: string;
            search?: string;
            featured?: string;
            sort?: 'latest' | 'popular' | 'top';
        };

        const whereCondition: Record<string | symbol, unknown> = {
            status: 'published',
        };

        if (featured === 'true') {
            whereCondition.isFeatured = true;
        }

        if (search) {
            whereCondition[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { subtitle: { [Op.iLike]: `%${search}%` } },
                { content: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const includeClause: Sequelize.Includeable[] = [
            {
                model: User,
                as: 'author',
                attributes: ['uuid', 'firstName', 'lastName', 'avatar'],
                include: [{ model: Profile, as: 'profile', attributes: ['headline', 'avatar'] }],
            },
            {
                model: Category,
                as: 'category',
                attributes: ['id', 'uuid', 'name', 'slug', 'color'],
            },
            {
                model: Tag,
                as: 'tags',
                attributes: ['id', 'uuid', 'name', 'slug'],
                through: { attributes: [] },
            },
        ];

        if (author) {
            const authorUser = await User.findOne({ where: { uuid: author } });
            if (authorUser) {
                whereCondition.authorId = authorUser.id;
            } else {
                whereCondition.authorId = -1;
            }
        }

        if (category) {
            const cat = await Category.findOne({
                where: {
                    [Op.or]: [
                        { slug: category },
                        ...(isNaN(Number(category)) ? [] : [{ id: Number(category) }]),
                    ],
                },
            });
            if (cat) {
                whereCondition.categoryId = cat.id;
            } else {
                whereCondition.categoryId = -1;
            }
        }

        if (tag) {
            const tagRecord = await Tag.findOne({
                where: {
                    [Op.or]: [{ slug: tag }, ...(isNaN(Number(tag)) ? [] : [{ id: Number(tag) }])],
                },
            });
            if (tagRecord) {
                includeClause[2] = {
                    model: Tag,
                    as: 'tags',
                    where: { id: tagRecord.id },
                    attributes: ['id', 'uuid', 'name', 'slug'],
                    through: { attributes: [] },
                };
            } else {
                includeClause[2] = {
                    model: Tag,
                    as: 'tags',
                    where: { id: -1 },
                    attributes: ['id', 'uuid', 'name', 'slug'],
                    through: { attributes: [] },
                };
            }
        }

        let orderClause: Sequelize.Order = [['publishedAt', 'DESC']];
        if (sort === 'popular') {
            orderClause = [
                ['viewsCount', 'DESC'],
                ['publishedAt', 'DESC'],
            ];
        } else if (sort === 'top') {
            orderClause = [
                ['likesCount', 'DESC'],
                ['publishedAt', 'DESC'],
            ];
        }

        const { rows: blogs, count: totalItems } = await Blog.findAndCountAll({
            where: whereCondition,
            attributes: [
                'id',
                'uuid',
                'title',
                'slug',
                'subtitle',
                'coverImage',
                'readingTime',
                'viewsCount',
                'likesCount',
                'commentsCount',
                'isFeatured',
                'isPremium',
                'publishedAt',
                'createdAt',
            ],
            include: includeClause,
            order: orderClause,
            distinct: true,
            limit,
            offset,
        });

        const paginatedResult = formatPaginationData(blogs, totalItems, page, limit);
        return successOkWithData(res, paginatedResult, 'Blogs feed fetched successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== getTrendingBlogs ===================================
export const getTrendingBlogs = async (_req: Request, res: Response) => {
    try {
        const blogs = await Blog.findAll({
            where: { status: 'published' },
            attributes: [
                'id',
                'uuid',
                'title',
                'slug',
                'subtitle',
                'coverImage',
                'readingTime',
                'viewsCount',
                'likesCount',
                'commentsCount',
                'isFeatured',
                'publishedAt',
            ],
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['uuid', 'firstName', 'lastName', 'avatar'],
                },
                {
                    model: Category,
                    as: 'category',
                    attributes: ['name', 'slug', 'color'],
                },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['name', 'slug'],
                    through: { attributes: [] },
                },
            ],
            order: [
                ['isFeatured', 'DESC'],
                ['likesCount', 'DESC'],
                ['viewsCount', 'DESC'],
            ],
            limit: 6,
        });

        return successOkWithData(res, { blogs }, 'Trending blogs fetched successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== getBlogBySlug (Read View) ===================================
export const getBlogBySlug = async (req: Request, res: Response) => {
    try {
        const rawSlugOrUuid = req.params.slugOrUuid;
        const slugOrUuid = Array.isArray(rawSlugOrUuid) ? rawSlugOrUuid[0] : rawSlugOrUuid;

        if (!slugOrUuid) {
            return notFound(res, 'Blog story not found');
        }

        const isUuid = isValidUuid(slugOrUuid);
        const whereClause = isUuid ? { uuid: slugOrUuid } : { slug: slugOrUuid };

        const blog = await Blog.findOne({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'uuid', 'firstName', 'lastName', 'avatar', 'createdAt'],
                    include: [
                        {
                            model: Profile,
                            as: 'profile',
                            attributes: [
                                'headline',
                                'bio',
                                'avatar',
                                'websiteUrl',
                                'twitterUrl',
                                'githubUrl',
                                'linkedinUrl',
                            ],
                        },
                    ],
                },
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'uuid', 'name', 'slug', 'color', 'description'],
                },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['id', 'uuid', 'name', 'slug'],
                    through: { attributes: [] },
                },
            ],
        });

        if (!blog) {
            return notFound(res, 'Blog story not found');
        }

        // Only author or admin can view non-published stories
        if (blog.status !== 'published') {
            if (
                !req.user ||
                (req.user.id !== blog.authorId && (req.user.role?.priority ?? 999) > 2)
            ) {
                return notFound(res, 'Blog story not found');
            }
        } else {
            // Increment view count atomically to prevent race conditions
            await blog.increment('viewsCount', { by: 1, silent: true });
            blog.viewsCount += 1;
        }

        let isLikedByMe = false;
        if (req.user) {
            const like = await Like.findOne({
                where: { blogId: blog.id, userId: req.user.id },
            });
            isLikedByMe = !!like;
        }

        return successOkWithData(
            res,
            {
                blog,
                isLikedByMe,
            },
            'Blog story fetched successfully',
        );
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== getMyBlogs (Author Dashboard) ===================================
export const getMyBlogs = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return unauthorizedError(res, 'User authentication required');
        }

        const { page, limit, offset } = getPaginationOptions(req, 10);
        const { status } = req.query as { status?: string };

        const whereCondition: Record<string, unknown> = {
            authorId: req.user.id,
        };

        if (status && ['draft', 'published', 'archived'].includes(status)) {
            whereCondition.status = status;
        }

        const { rows: blogs, count: totalItems } = await Blog.findAndCountAll({
            where: whereCondition,
            include: [
                { model: Category, as: 'category', attributes: ['name', 'slug'] },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['name', 'slug'],
                    through: { attributes: [] },
                },
            ],
            order: [['updatedAt', 'DESC']],
            distinct: true,
            limit,
            offset,
        });

        const paginatedResult = formatPaginationData(blogs, totalItems, page, limit);
        return successOkWithData(res, paginatedResult, 'Author stories fetched successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== createBlog ===================================
export const createBlog = async (req: Request, res: Response) => {
    const reqBody = bodyReqFields(req, res, ['title', 'content', 'categoryId']);
    if (reqBody.error) {
        return reqBody.response;
    }

    const {
        title,
        subtitle,
        content,
        categoryId,
        tagIds,
        coverImage,
        status = 'draft',
        isFeatured = false,
        isPremium = false,
        slug: customSlug,
    } = req.body as {
        title: string;
        subtitle?: string;
        content: string;
        categoryId: number;
        tagIds?: number[];
        coverImage?: string;
        status?: 'draft' | 'published' | 'archived';
        isFeatured?: boolean;
        isPremium?: boolean;
        slug?: string;
    };

    if (!req.user) {
        return unauthorizedError(res, 'Authentication required');
    }

    const category = await Category.findByPk(categoryId);
    if (!category) {
        return validationError(res, 'Specified category does not exist');
    }

    const baseSlug = customSlug ? generateSlug(customSlug) : generateSlug(title);
    let finalSlug = baseSlug;

    // Check slug collision and add suffix if necessary
    const existingWithSlug = await Blog.findOne({ where: { slug: finalSlug } });
    if (existingWithSlug) {
        finalSlug = generateSlug(title, true);
    }

    const readingTime = calculateReadingTime(content);
    const publishedAt = status === 'published' ? new Date() : null;

    const transaction = await sequelize.transaction();

    try {
        const blog = await Blog.create(
            {
                authorId: req.user.id,
                categoryId,
                title,
                slug: finalSlug,
                subtitle: subtitle || null,
                content,
                coverImage: coverImage || null,
                readingTime,
                status,
                publishedAt,
                isFeatured,
                isPremium,
            },
            { transaction },
        );

        if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
            const blogTagsData = tagIds.map((tagId) => ({
                blogId: blog.id,
                tagId,
            }));
            await BlogTag.bulkCreate(blogTagsData, { transaction, ignoreDuplicates: true });
            await Tag.increment('usageCount', {
                by: 1,
                where: { id: tagIds },
                transaction,
            });
        }

        await transaction.commit();

        const createdBlog = await Blog.findByPk(blog.id, {
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['uuid', 'firstName', 'lastName', 'avatar'],
                },
                { model: Category, as: 'category', attributes: ['name', 'slug'] },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['name', 'slug'],
                    through: { attributes: [] },
                },
            ],
        });

        return createdWithData(res, { blog: createdBlog }, 'Blog story created successfully');
    } catch (error) {
        if (!(transaction as unknown as { finished?: string }).finished) {
            await transaction.rollback();
        }
        return catchWithSequelizeValidationError(res, error);
    }
};

// =================================== updateBlog ===================================
export const updateBlog = async (req: Request, res: Response) => {
    const { uuid } = req.params;
    if (!req.user) {
        return unauthorizedError(res, 'Authentication required');
    }

    if (!isValidUuid(uuid)) {
        return notFound(res, 'Blog story not found');
    }

    const blog = await Blog.findOne({ where: { uuid } });
    if (!blog) {
        return notFound(res, 'Blog story not found');
    }

    // Authorization: only author or Admin/Super Admin (priority <= 2) can edit
    const isAuthor = blog.authorId === req.user.id;
    const isAdmin = req.user.role && req.user.role.priority <= 2;
    if (!isAuthor && !isAdmin) {
        return forbiddenError(res, 'You do not have permission to edit this story');
    }

    const fieldsToUpdate = extractFieldsToUpdate(req.body, [
        'title',
        'subtitle',
        'content',
        'categoryId',
        'coverImage',
        'status',
        'isFeatured',
        'isPremium',
        'slug',
    ]);

    const { tagIds } = req.body as { tagIds?: number[] };

    if (Object.keys(fieldsToUpdate).length === 0 && !tagIds) {
        return validationError(res, 'No fields provided to update');
    }

    if (fieldsToUpdate.categoryId) {
        const cat = await Category.findByPk(fieldsToUpdate.categoryId as number);
        if (!cat) {
            return validationError(res, 'Specified category does not exist');
        }
    }

    if (fieldsToUpdate.content) {
        fieldsToUpdate.readingTime = calculateReadingTime(fieldsToUpdate.content as string);
    }

    if (fieldsToUpdate.slug) {
        const slugFormatted = generateSlug(fieldsToUpdate.slug as string);
        const existing = await Blog.findOne({
            where: { slug: slugFormatted, id: { [Op.ne]: blog.id } },
        });
        if (existing) {
            return conflictError(res, 'Another story already uses this slug');
        }
        fieldsToUpdate.slug = slugFormatted;
    }

    if (fieldsToUpdate.status === 'published' && blog.status !== 'published') {
        fieldsToUpdate.publishedAt = new Date();
    }

    const transaction = await sequelize.transaction();

    try {
        await blog.update(fieldsToUpdate, { transaction });

        if (tagIds && Array.isArray(tagIds)) {
            // Find existing tags to adjust usage counts
            const existingTags = await BlogTag.findAll({
                where: { blogId: blog.id },
                transaction,
            });
            const oldTagIds = existingTags.map((t) => t.tagId);

            // Remove old tags
            await BlogTag.destroy({ where: { blogId: blog.id }, transaction });
            if (oldTagIds.length > 0) {
                await Tag.decrement('usageCount', {
                    by: 1,
                    where: { id: oldTagIds, usageCount: { [Op.gt]: 0 } },
                    transaction,
                });
            }

            // Add new tags
            if (tagIds.length > 0) {
                const newBlogTags = tagIds.map((tagId) => ({
                    blogId: blog.id,
                    tagId,
                }));
                await BlogTag.bulkCreate(newBlogTags, { transaction, ignoreDuplicates: true });
                await Tag.increment('usageCount', {
                    by: 1,
                    where: { id: tagIds },
                    transaction,
                });
            }
        }

        await transaction.commit();

        const updatedBlog = await Blog.findByPk(blog.id, {
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['uuid', 'firstName', 'lastName', 'avatar'],
                },
                { model: Category, as: 'category', attributes: ['name', 'slug'] },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['name', 'slug'],
                    through: { attributes: [] },
                },
            ],
        });

        return successOkWithData(res, { blog: updatedBlog }, 'Blog story updated successfully');
    } catch (error) {
        if (!(transaction as unknown as { finished?: string }).finished) {
            await transaction.rollback();
        }
        return catchWithSequelizeValidationError(res, error);
    }
};

// =================================== deleteBlog ===================================
export const deleteBlog = async (req: Request, res: Response) => {
    try {
        const { uuid } = req.params;
        if (!req.user) {
            return unauthorizedError(res, 'Authentication required');
        }

        if (!isValidUuid(uuid)) {
            return notFound(res, 'Blog story not found');
        }

        const blog = await Blog.findOne({ where: { uuid } });
        if (!blog) {
            return notFound(res, 'Blog story not found');
        }

        const isAuthor = blog.authorId === req.user.id;
        const isAdmin = req.user.role && req.user.role.priority <= 2;
        if (!isAuthor && !isAdmin) {
            return forbiddenError(res, 'You do not have permission to delete this story');
        }

        await blog.destroy();
        return successOk(res, 'Blog story deleted successfully');
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

// =================================== togglePublishStatus ===================================
export const togglePublishStatus = async (req: Request, res: Response) => {
    try {
        const { uuid } = req.params;
        if (!req.user) {
            return unauthorizedError(res, 'Authentication required');
        }

        if (!isValidUuid(uuid)) {
            return notFound(res, 'Blog story not found');
        }

        const blog = await Blog.findOne({ where: { uuid } });
        if (!blog) {
            return notFound(res, 'Blog story not found');
        }

        const isAuthor = blog.authorId === req.user.id;
        const isAdmin = req.user.role && req.user.role.priority <= 2;
        if (!isAuthor && !isAdmin) {
            return forbiddenError(res, 'Permission denied');
        }

        const newStatus = blog.status === 'published' ? 'draft' : 'published';
        blog.status = newStatus;
        if (newStatus === 'published' && !blog.publishedAt) {
            blog.publishedAt = new Date();
        }
        await blog.save();

        return successOkWithData(
            res,
            { status: blog.status, publishedAt: blog.publishedAt },
            `Blog story status set to ${newStatus}`,
        );
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

import { Request, Response } from 'express';
import Sequelize from 'sequelize';

import User from '@/models/auth/user.model.js';
import Blog from '@/models/blog/blog.model.js';
import Category from '@/models/blog/category.model.js';
import Tag from '@/models/blog/tag.model.js';
import { formatPaginationData, getPaginationOptions } from '@/utils/pagination.util.js';
import { bodyReqFields } from '@/utils/requiredFields.util.js';
import {
    catchError,
    catchWithSequelizeValidationError,
    conflictError,
    createdWithData,
    notFound,
    successOk,
    successOkWithData,
    validationError,
} from '@/utils/response.util.js';
import { generateSlug } from '@/utils/slug.util.js';
import { extractFieldsToUpdate } from '@/utils/utils.js';

// =================================== listTags ===================================
export const listTags = async (req: Request, res: Response) => {
    try {
        const { search } = req.query as { search?: string };
        const { page, limit, offset } = getPaginationOptions(req, 20);

        const whereCondition: Record<string | symbol, unknown> = {
            isActive: true,
        };

        if (search) {
            whereCondition.name = { [Sequelize.Op.iLike]: `%${search}%` };
        }

        const { rows: tags, count: totalItems } = await Tag.findAndCountAll({
            where: whereCondition,
            attributes: ['id', 'uuid', 'name', 'slug', 'description', 'usageCount'],
            order: [
                ['usageCount', 'DESC'],
                ['name', 'ASC'],
            ],
            limit,
            offset,
        });

        const result = formatPaginationData(tags, totalItems, page, limit);
        return successOkWithData(res, result, 'Tags fetched successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== getTagBySlug ===================================
export const getTagBySlug = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const tag = await Tag.findOne({ where: { slug } });

        if (!tag) {
            return notFound(res, 'Tag not found');
        }

        const { page, limit, offset } = getPaginationOptions(req);

        const { rows: blogs, count: totalItems } = await Blog.findAndCountAll({
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
                'publishedAt',
            ],
            include: [
                {
                    model: Tag,
                    as: 'tags',
                    where: { id: tag.id },
                    attributes: ['name', 'slug'],
                    through: { attributes: [] },
                },
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
            ],
            order: [['publishedAt', 'DESC']],
            limit,
            offset,
        });

        const paginatedBlogs = formatPaginationData(blogs, totalItems, page, limit);

        return successOkWithData(
            res,
            {
                tag,
                blogs: paginatedBlogs,
            },
            'Tag and associated blogs fetched successfully',
        );
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== createTag ===================================
export const createTag = async (req: Request, res: Response) => {
    try {
        const reqBody = bodyReqFields(req, res, ['name']);
        if (reqBody.error) {
            return reqBody.response;
        }

        const {
            name,
            description,
            slug: customSlug,
        } = req.body as {
            name: string;
            description?: string;
            slug?: string;
        };

        const slug = customSlug ? generateSlug(customSlug) : generateSlug(name);

        const existingTag = await Tag.findOne({
            where: {
                [Sequelize.Op.or]: [{ slug }, { name: { [Sequelize.Op.iLike]: name } }],
            },
        });

        if (existingTag) {
            return conflictError(res, 'Tag with this name or slug already exists');
        }

        const tag = await Tag.create({
            name,
            slug,
            description: description || null,
            usageCount: 0,
            isActive: true,
        });

        return createdWithData(res, { tag }, 'Tag created successfully');
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

// =================================== updateTag (Admin/Editor) ===================================
export const updateTag = async (req: Request, res: Response) => {
    try {
        const { uuid } = req.params;
        const tag = await Tag.findOne({ where: { uuid } });
        if (!tag) {
            return notFound(res, 'Tag not found');
        }

        const fieldsToUpdate = extractFieldsToUpdate(req.body, [
            'name',
            'slug',
            'description',
            'isActive',
        ]);

        if (Object.keys(fieldsToUpdate).length === 0) {
            return validationError(res, 'No fields provided to update');
        }

        if (fieldsToUpdate.name && !fieldsToUpdate.slug) {
            fieldsToUpdate.slug = generateSlug(fieldsToUpdate.name as string);
        }

        if (fieldsToUpdate.slug) {
            const existingWithSlug = await Tag.findOne({
                where: {
                    slug: fieldsToUpdate.slug as string,
                    id: { [Sequelize.Op.ne]: tag.id },
                },
            });
            if (existingWithSlug) {
                return conflictError(res, 'Another tag already exists with this slug');
            }
        }

        await tag.update(fieldsToUpdate);

        return successOkWithData(res, { tag }, 'Tag updated successfully');
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

// =================================== deleteTag (Admin/Editor) ===================================
export const deleteTag = async (req: Request, res: Response) => {
    try {
        const { uuid } = req.params;
        const tag = await Tag.findOne({ where: { uuid } });
        if (!tag) {
            return notFound(res, 'Tag not found');
        }

        await tag.destroy();
        return successOk(res, 'Tag deleted successfully');
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

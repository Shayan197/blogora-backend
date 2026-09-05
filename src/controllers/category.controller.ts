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

// =================================== listCategories ===================================
export const listCategories = async (req: Request, res: Response) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const whereCondition: Record<string, unknown> = {};
        if (!includeInactive) {
            whereCondition.isActive = true;
        }

        const categories = await Category.findAll({
            where: whereCondition,
            attributes: [
                'id',
                'uuid',
                'name',
                'slug',
                'description',
                'icon',
                'color',
                'isActive',
                'createdAt',
                [
                    Sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM blogs AS blog
                        WHERE
                            blog.category_id = "Category"."id"
                            AND blog.status = 'published'
                            AND blog.deleted_at IS NULL
                    )`),
                    'blogsCount',
                ],
            ],
            order: [['name', 'ASC']],
        });

        return successOkWithData(res, { categories }, 'Categories fetched successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== getCategoryBySlug ===================================
export const getCategoryBySlug = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const category = await Category.findOne({
            where: { slug },
        });

        if (!category) {
            return notFound(res, 'Category not found');
        }

        const { page, limit, offset } = getPaginationOptions(req);

        const { rows: blogs, count: totalItems } = await Blog.findAndCountAll({
            where: {
                categoryId: category.id,
                status: 'published',
            },
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
                    model: User,
                    as: 'author',
                    attributes: ['uuid', 'firstName', 'lastName', 'avatar'],
                },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['name', 'slug'],
                    through: { attributes: [] },
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
                category,
                blogs: paginatedBlogs,
            },
            'Category and associated blogs fetched successfully',
        );
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== createCategory (Admin/Editor) ===================================
export const createCategory = async (req: Request, res: Response) => {
    try {
        const reqBody = bodyReqFields(req, res, ['name']);
        if (reqBody.error) {
            return reqBody.response;
        }

        const {
            name,
            description,
            icon,
            color,
            slug: customSlug,
        } = req.body as {
            name: string;
            description?: string;
            icon?: string;
            color?: string;
            slug?: string;
        };

        const slug = customSlug ? generateSlug(customSlug) : generateSlug(name);

        const existingCategory = await Category.findOne({
            where: {
                [Sequelize.Op.or]: [{ slug }, { name: { [Sequelize.Op.iLike]: name } }],
            },
        });

        if (existingCategory) {
            return conflictError(res, 'Category with this name or slug already exists');
        }

        const category = await Category.create({
            name,
            slug,
            description: description || null,
            icon: icon || null,
            color: color || null,
            isActive: true,
        });

        return createdWithData(res, { category }, 'Category created successfully');
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

// =================================== updateCategory (Admin/Editor) ===================================
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { uuid } = req.params;
        const category = await Category.findOne({ where: { uuid } });
        if (!category) {
            return notFound(res, 'Category not found');
        }

        const fieldsToUpdate = extractFieldsToUpdate(req.body, [
            'name',
            'slug',
            'description',
            'icon',
            'color',
            'isActive',
        ]);

        if (Object.keys(fieldsToUpdate).length === 0) {
            return validationError(res, 'No fields provided to update');
        }

        if (fieldsToUpdate.name && !fieldsToUpdate.slug) {
            fieldsToUpdate.slug = generateSlug(fieldsToUpdate.name as string);
        }

        if (fieldsToUpdate.slug) {
            const existingWithSlug = await Category.findOne({
                where: {
                    slug: fieldsToUpdate.slug as string,
                    id: { [Sequelize.Op.ne]: category.id },
                },
            });
            if (existingWithSlug) {
                return conflictError(res, 'Another category already exists with this slug');
            }
        }

        await category.update(fieldsToUpdate);

        return successOkWithData(res, { category }, 'Category updated successfully');
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

// =================================== deleteCategory (Admin/Editor) ===================================
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { uuid } = req.params;
        const category = await Category.findOne({ where: { uuid } });
        if (!category) {
            return notFound(res, 'Category not found');
        }

        const blogsCount = await Blog.count({ where: { categoryId: category.id } });
        if (blogsCount > 0) {
            return validationError(
                res,
                `Cannot delete category with ${blogsCount} assigned blog(s). Reassign or archive blogs first.`,
            );
        }

        await category.destroy();
        return successOk(res, 'Category deleted successfully');
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

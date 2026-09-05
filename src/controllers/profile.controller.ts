import { Request, Response } from 'express';

import Profile from '@/models/auth/profile.model.js';
import Role from '@/models/auth/role.model.js';
import User from '@/models/auth/user.model.js';
import Blog from '@/models/blog/blog.model.js';
import {
    catchError,
    catchWithSequelizeValidationError,
    notFound,
    successOkWithData,
    unauthorizedError,
    validationError,
} from '@/utils/response.util.js';
import { extractFieldsToUpdate } from '@/utils/utils.js';

// =================================== getPublicProfile ===================================
export const getPublicProfile = async (req: Request, res: Response) => {
    try {
        const { userUuid } = req.params;

        const user = await User.findOne({
            where: { uuid: userUuid, status: 'active' },
            attributes: [
                'id',
                'uuid',
                'firstName',
                'lastName',
                'avatar',
                'skills',
                'experience',
                'createdAt',
            ],
            include: [
                { model: Role, as: 'role', attributes: ['name', 'slug', 'color'] },
                {
                    model: Profile,
                    as: 'profile',
                    attributes: [
                        'uuid',
                        'bio',
                        'headline',
                        'websiteUrl',
                        'twitterUrl',
                        'githubUrl',
                        'linkedinUrl',
                        'location',
                        'avatar',
                        'coverImage',
                    ],
                },
            ],
        });

        if (!user) {
            return notFound(res, 'Author profile not found');
        }

        const publishedBlogsCount = await Blog.count({
            where: { authorId: user.id, status: 'published' },
        });

        const recentBlogs = await Blog.findAll({
            where: { authorId: user.id, status: 'published' },
            attributes: [
                'uuid',
                'title',
                'slug',
                'subtitle',
                'coverImage',
                'readingTime',
                'likesCount',
                'viewsCount',
                'publishedAt',
            ],
            order: [['publishedAt', 'DESC']],
            limit: 5,
        });

        return successOkWithData(
            res,
            {
                user,
                stats: {
                    publishedBlogsCount,
                },
                recentBlogs,
            },
            'Author profile fetched successfully',
        );
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== getMyProfile ===================================
export const getMyProfile = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.userUid },
            attributes: { exclude: ['password', 'otp', 'otpCount', 'deletedAt'] },
            include: [
                { model: Role, as: 'role', attributes: ['name', 'slug', 'color'] },
                { model: Profile, as: 'profile' },
            ],
        });

        if (!user) {
            return unauthorizedError(res, 'User not found');
        }

        return successOkWithData(res, { user }, 'Profile fetched successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== updateMyProfile ===================================
export const updateMyProfile = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({ where: { uuid: req.userUid } });
        if (!user) {
            return unauthorizedError(res, 'User not found');
        }

        const fieldsToUpdate = extractFieldsToUpdate(req.body, [
            'bio',
            'headline',
            'websiteUrl',
            'twitterUrl',
            'githubUrl',
            'linkedinUrl',
            'location',
            'avatar',
            'coverImage',
        ]);

        if (Object.keys(fieldsToUpdate).length === 0) {
            return validationError(res, 'No profile fields provided to update');
        }

        let profile = await Profile.findOne({ where: { userId: user.id } });

        if (!profile) {
            profile = await Profile.create({
                userId: user.id,
                ...fieldsToUpdate,
            });
        } else {
            await profile.update(fieldsToUpdate);
        }

        // If avatar is provided in profile update, also sync with User.avatar
        if (fieldsToUpdate.avatar && typeof fieldsToUpdate.avatar === 'string') {
            user.avatar = fieldsToUpdate.avatar;
            await user.save({ fields: ['avatar'] });
        }

        return successOkWithData(res, { profile }, 'Profile updated successfully');
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

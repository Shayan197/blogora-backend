import crypto from 'crypto';

import { Request, Response } from 'express';

import sequelize from '@/config/db.config.js';
import { nodeEnv } from '@/config/initial.config.js';
import User from '@/models/auth/user.model.js';
import { sentOTPEmail } from '@/utils/email.util.js';
import { generateAccessToken, generateRefreshToken } from '@/utils/jwt.utils.js';
import { hashPassword, comparePassword, validatePassword } from '@/utils/password.util.js';
import { bodyReqFields } from '@/utils/requiredFields.util.js';
import {
    catchWithSequelizeFrontError,
    catchWithSequelizeValidationError,
    created,
    successOkWithData,
    validationError,
    successOk,
    catchError,
    unauthorizedError,
} from '@/utils/response.util.js';
import { convertToLowerCase, extractFieldsToUpdate, validateEmail } from '@/utils/utils.js';

// ========================================
//            CONTROLLERS
// ========================================

// =================================== registerUser ===================================
export const registerUser = async (req: Request, res: Response) => {
    try {
        const reqBodyFields = bodyReqFields(req, res, [
            'firstName',
            'lastName',
            'gender',
            'email',
            'password',
            'confirmPassword',
        ]);
        if (reqBodyFields.error) return reqBodyFields.response;
        const excludeFields = ['password', 'confirmPassword', 'email'];
        const requestData = convertToLowerCase(req.body, excludeFields);
        const { firstName, lastName, gender, email, password, confirmPassword } =
            requestData as Record<string, string>;

        // Check if a user with the given email already exists
        const userExist = await User.findOne({
            where: {
                email: email,
            },
            attributes: ['uuid'],
        });
        if (userExist) return validationError(res, 'user already exists');

        const invalidEmail = validateEmail(email);
        if (invalidEmail) return validationError(res, invalidEmail);

        const invalidPassword = validatePassword(password, confirmPassword);
        if (invalidPassword) return validationError(res, invalidPassword);

        const userData = {
            firstName: firstName,
            lastName: lastName,
            roleId: 2,
            gender: gender,
            email: email,
            otp: crypto.randomInt(100000, 999999),
            password: await hashPassword(password),
        };
        await User.create(userData as unknown as Partial<User>);
        await sentOTPEmail(email, userData.otp);
        return created(res, 'user created successfully');
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

// =================================== verifyOtp ===================================
export const verifyOTP = async (req: Request, res: Response) => {
    const reqBodyFields = bodyReqFields(req, res, ['otp', 'email']);
    if (reqBodyFields.error) return reqBodyFields.response;

    const { otp, email } = req.body as { otp: string; email: string };
    const invalidEmail = validateEmail(email);
    if (invalidEmail) return validationError(res, invalidEmail);

    const numericOtp = Number(otp);
    if (Number.isNaN(numericOtp)) return validationError(res, 'otp must be a number type');

    const transaction = await sequelize.transaction();
    try {
        const user = await User.findOne({
            where: {
                email,
            },
            attributes: [
                'id',
                'uuid',
                'email',
                'otp',
                'otpCount',
                'isActive',
                'isVerified',
                'status',
            ],
            lock: transaction.LOCK.UPDATE,
            transaction,
        });
        if (!user) {
            await transaction.rollback();
            return validationError(res, 'User not found. Invalid email.');
        }
        if (user.isActive) {
            await transaction.rollback();
            return validationError(res, 'User is already active.');
        }
        if (user.status === 'active') {
            await transaction.rollback();
            return validationError(res, 'User is already verified.');
        }
        if (!user.otp) {
            await transaction.rollback();
            return validationError(
                res,
                'OTP has expired or was not generated. Please request a new OTP.',
            );
        }

        if (user.otp !== numericOtp) {
            user.otpCount += 1;
            if (user.otpCount > 2) {
                user.otp = null;
                user.otpCount = 0;
                await user.save({ fields: ['otp', 'otpCount'], transaction });
                await transaction.commit();
                return validationError(
                    res,
                    'Too many attempts. Please regenerate otp after few minutes.',
                );
            } else {
                await user.save({ fields: ['otpCount'], transaction });
                await transaction.commit();
                return validationError(res, 'Invalid OTP. Please try again.', 'otp');
            }
        }

        user.isVerified = true;
        user.status = 'active';
        user.isActive = false;
        user.otp = null;
        user.otpCount = 0;

        await user.save({
            fields: ['isVerified', 'status', 'isActive', 'otp', 'otpCount'],
            transaction,
        });
        // generate tokens
        // const accessToken = generateAccessToken(user);
        // const refreshToken = generateRefreshToken(user);

        await transaction.commit();

        // res.cookie('refreshToken', refreshToken, {
        //     httpOnly: true,
        //     secure: false,
        //     sameSite: 'strict',
        //     maxAge: 7 * 24 * 60 * 60 * 1000,
        // });
        return successOk(res, 'User verified successfully');
    } catch (error) {
        if (!(transaction as unknown as { finished?: string }).finished) {
            await transaction.rollback();
        }
        return catchWithSequelizeFrontError(res, error);
    }
};

// =================================== resendOtp ===================================
export const resendOtp = async (req: Request, res: Response) => {
    try {
        const reqBodyFields = bodyReqFields(req, res, ['email']);
        if (reqBodyFields.error) return reqBodyFields.response;

        const { email } = req.body as { email: string };
        const invalidEmail = validateEmail(email);
        if (invalidEmail) return validationError(res, invalidEmail);

        //check if the user with given email exists and is not active and not verified
        const user = await User.findOne({
            where: { email },
            attributes: ['id', 'uuid', 'otp', 'otpCount', 'isVerified', 'isActive'],
        });

        if (!user) return validationError(res, 'User not found. Invalid email.');
        // if(user.isVerified) return validationError(res, 'User is already verified.');
        if (user.isActive) return validationError(res, 'User is already active.');
        const otp = crypto.randomInt(100000, 999999);

        user.otp = otp;
        user.otpCount = 0;
        await user.save({ fields: ['otp', 'otpCount'] });
        const otpSend = await sentOTPEmail(email, otp);
        if (!otpSend) return validationError(res, 'OTP service is down, please try again later.');
        return successOk(res, 'OTP sent successfully.');
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== loginUser ====================================
export const loginUser = async (req: Request, res: Response) => {
    try {
        const reqBodyFields = bodyReqFields(req, res, ['email', 'password']);
        if (reqBodyFields.error) return reqBodyFields.response;

        const { email, password } = req.body as { email: string; password: string };
        const invalidEmail = validateEmail(email);
        if (invalidEmail) return validationError(res, invalidEmail);

        //check if user exists or not
        const user = await User.findOne({
            where: { email },
            attributes: ['id', 'uuid', 'isActive', 'password', 'loginCount', 'lastLogin', 'status'],
        });
        if (!user) return validationError(res, 'Invalid Credentials - User not found');

        //check if user is not active then send otp to verify
        if (user.status === 'pending') {
            user.otp = crypto.randomInt(100000, 999999);
            user.otpCount = 0;
            await user.save({ fields: ['otp', 'otpCount'] });
            const otpSent = await sentOTPEmail(email, user.otp);
            if (!otpSent) {
                return validationError(
                    res,
                    'OTP service is down, and your account is not active yet. Please try in a while ',
                );
            }
            return validationError(
                res,
                'Account is not active, an OTP has been sent to your email address. Please verify your email address to login.',
                'otp',
            );
        }
        //compare password
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) return validationError(res, 'Invalid Credentials');

        //generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.loginCount += 1;
        user.lastLogin = new Date();
        user.isActive = true;
        await user.save({ fields: ['loginCount', 'lastLogin', 'isActive'] });

        const isProd = nodeEnv === 'production';
        const cookieSameSite = (isProd ? 'none' : 'lax') as 'none' | 'lax';

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: cookieSameSite,
            path: '/',
            maxAge: 24 * 60 * 60 * 1000,
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: cookieSameSite,
            path: '/api/auth/token-refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return successOk(res, 'User logged in successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== regenerateAccessToken ====================================
export const regenerateAccessToken = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.userUid },
            attributes: ['status', 'isActive', 'isVerified'],
        });
        if (!user) return unauthorizedError(res, 'Invalid token');
        if (user.status !== 'active' || !user.isVerified) {
            return unauthorizedError(res, 'Token is not valid. Please login again.');
        }

        user.isActive = true;
        await user.save({ fields: ['isActive'] });

        const accessToken = generateAccessToken({ uuid: req.userUid! });
        const refreshToken = generateRefreshToken({ uuid: req.userUid! });

        const isProd = nodeEnv === 'production';
        const cookieSameSite = (isProd ? 'none' : 'lax') as 'none' | 'lax';

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: cookieSameSite,
            path: '/',
            maxAge: 24 * 60 * 60 * 1000,
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: cookieSameSite,
            path: '/api/auth/token-refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return successOk(res, 'Access token generated successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== logoutUser ====================================
export const logoutUser = async (req: Request, res: Response) => {
    try {
        const isProd = nodeEnv === 'production';
        const cookieSameSite = (isProd ? 'none' : 'lax') as 'none' | 'lax';

        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: isProd,
            sameSite: cookieSameSite,
            path: '/',
        });
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: isProd,
            sameSite: cookieSameSite,
            path: '/api/auth/token-refresh',
        });

        return successOk(res, 'User logged out successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== getUser ====================================
export const getUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.userUid },
            attributes: { exclude: ['password', 'otp', 'otpCount', 'deletedAt'] },
        });
        if (!user) return unauthorizedError(res, 'Invalid token');
        return successOkWithData(res, { user }, 'User fetched successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

// =================================== updateUser ====================================
export const updateUser = async (req: Request, res: Response) => {
    try {
        const fieldsToUpdate = extractFieldsToUpdate(req.body, [
            'firstName',
            'lastName',
            'phone',
            'email',
            'salary',
            'experience',
            'skills',
            'preferences',
            'avatar',
        ]);
        if (Object.keys(fieldsToUpdate).length === 0) {
            return validationError(res, 'No fields to update.');
        }
        if (fieldsToUpdate.email) {
            const invalidEmail = validateEmail(fieldsToUpdate.email as string);
            if (invalidEmail) return validationError(res, invalidEmail);
            // check if email already exists
            const existingUser = await User.findOne({
                where: { email: fieldsToUpdate.email },
                attributes: ['uuid'],
            });
            if (existingUser && existingUser.uuid !== req.userUid) {
                return validationError(res, 'Email already exists');
            }
        }

        const [updateRows] = await User.update(fieldsToUpdate as unknown as Partial<User>, {
            where: { uuid: req.userUid },
        });
        if (!updateRows) return validationError(res, 'Unable to update user, try again later');
        return successOk(res, 'User updated successfully');
    } catch (error) {
        return catchWithSequelizeValidationError(res, error);
    }
};

// =================================== updatePassword ====================================
export const updatePassword = async (req: Request, res: Response) => {
    try {
        const reqBodyFields = bodyReqFields(req, res, [
            'oldPassword',
            'newPassword',
            'confirmPassword',
        ]);
        if (reqBodyFields.error) return reqBodyFields.response;

        const { oldPassword, newPassword, confirmPassword } = req.body as {
            oldPassword: string;
            newPassword: string;
            confirmPassword: string;
        };

        //check if old password and new password are same
        if (oldPassword === newPassword) {
            return validationError(res, 'New password must be different from old password');
        }
        // validate new password
        const invalidPassword = validatePassword(newPassword, confirmPassword);
        if (invalidPassword) return validationError(res, invalidPassword);
        // Check User exists
        const user = await User.findOne({
            where: { uuid: req.userUid },
            attributes: ['id', 'password'],
        });
        if (!user) return unauthorizedError(res, 'invalid token');
        // check if old password and new password are same
        const isMatch = await comparePassword(oldPassword, user.password);
        if (!isMatch) return validationError(res, 'Invalid old password', 'oldPassword');
        // hash new password
        const hashedPassword = await hashPassword(newPassword);
        // update password in the database
        user.password = hashedPassword;
        await user.save({ fields: ['password'] });
        return successOk(res, 'Password updated successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

// ============================ forgotPassword ============================
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const reqBodyFields = bodyReqFields(req, res, ['email']);
        if (reqBodyFields.error) return reqBodyFields.response;
        const { email } = req.body as { email: string };
        // validate email
        const invalidEmail = validateEmail(email);
        if (invalidEmail) return validationError(res, invalidEmail);
        // check user exists
        const user = await User.findOne({
            where: { email },
            attributes: ['id', 'uuid', 'otp', 'otpCount', 'isVerified'],
        });
        if (!user) return validationError(res, 'User not found');
        if (!user.isVerified) return validationError(res, 'User is not verified');
        // generate otp
        const otp = crypto.randomInt(100000, 999999);
        // Reset OTP verification attempts for the new OTP
        user.otp = otp;
        user.otpCount = 0;
        await user.save({ fields: ['otp', 'otpCount'] });
        // send otp
        const otpSent = await sentOTPEmail(email, otp);
        if (!otpSent) return validationError(res, 'OTP service is down, try again later');
        return successOk(res, 'OTP sent successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

// ============================ forgotPasswordOtpVerify =============================
//Handels verify otp
export const forgotPasswordOtpVerify = async (req: Request, res: Response) => {
    const reqBodyFields = bodyReqFields(req, res, ['email', 'otp']);
    if (reqBodyFields.error) return reqBodyFields.response;
    const { email, otp } = req.body as { email: string; otp: string };
    // validate email
    const invalidEmail = validateEmail(email);
    if (invalidEmail) return validationError(res, invalidEmail);
    // validate otp
    const numericOtp = Number(otp);
    if (Number.isNaN(numericOtp)) return validationError(res, 'otp must be a number type');
    const transaction = await sequelize.transaction();
    try {
        // check if the user with given email exists
        const user = await User.findOne({
            where: { email },
            lock: transaction.LOCK.UPDATE,
            attributes: ['id', 'uuid', 'otp', 'otpCount', 'canChangePassword', 'isVerified'],
            transaction,
        });
        if (!user) {
            await transaction.rollback();
            return validationError(res, 'User not found');
        }
        if (!user.otp) {
            await transaction.rollback();
            return validationError(
                res,
                'OTP has expired or was not generated. Please request a new OTP.',
            );
        }
        if (!user.isVerified) {
            await transaction.rollback();
            return validationError(res, 'User is not verified');
        }
        if (user.otp !== numericOtp) {
            user.otpCount += 1;
            if (user.otpCount > 2) {
                user.otp = null;
                user.otpCount = 0;
                await user.save({ fields: ['otp', 'otpCount'], transaction });
                await transaction.commit();
                return validationError(
                    res,
                    'You have exceeded the maximum number of attempts. Please request a new OTP.',
                );
            } else {
                await user.save({ fields: ['otpCount'], transaction });
                await transaction.commit();
                return validationError(res, 'Invalid OTP, please try again.', 'otp');
            }
        }
        user.otp = null;
        user.otpCount = 0;
        user.canChangePassword = true;
        await user.save({ fields: ['otp', 'otpCount', 'canChangePassword'], transaction });
        await transaction.commit();
        return successOk(res, 'OTP verified successfully');
    } catch (error) {
        if (!(transaction as unknown as { finished?: string }).finished)
            await transaction.rollback();
        return catchError(res, error);
    }
};

// ================================ forgotPasswordReset ================================
export const forgotPasswordReset = async (req: Request, res: Response) => {
    try {
        const reqBodyFields = bodyReqFields(req, res, ['email', 'newPassword', 'confirmPassword']);
        if (reqBodyFields.error) return reqBodyFields.response;
        const { email, newPassword, confirmPassword } = req.body as {
            email: string;
            newPassword: string;
            confirmPassword: string;
        };
        // validate email
        const invalidEmail = validateEmail(email);
        if (invalidEmail) return validationError(res, invalidEmail);
        // validate new password
        const invalidPassword = validatePassword(newPassword, confirmPassword);
        if (invalidPassword) return validationError(res, invalidPassword);
        // check if the user with given email exists
        const user = await User.findOne({
            where: { email },
            attributes: ['id', 'uuid', 'password', 'otp', 'otpCount', 'canChangePassword'],
        });
        if (!user) return validationError(res, 'User not found');
        if (!user.canChangePassword) {
            return validationError(res, 'You cannot change password, please contact admin');
        }
        // hash new password
        const hashedPassword = await hashPassword(newPassword);
        // update password in the database
        user.password = hashedPassword;
        user.canChangePassword = false;
        user.otp = null;
        user.otpCount = 0;
        await user.save({ fields: ['password', 'canChangePassword', 'otp', 'otpCount'] });
        return successOk(res, 'Password reset successfully');
    } catch (error) {
        return catchError(res, error);
    }
};

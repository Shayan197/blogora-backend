import { Response } from 'express';
import { ValidationError } from 'sequelize';

// ================================================================
// ===================== success responses ========================
// ================================================================

const successOk = (res: Response, message = 'Request processed successfully.') => {
    return res.status(200).send({
        success: true,
        message,
    });
};

// ===================== successOkWithData ========================

const successOkWithData = (
    res: Response,
    data: unknown,
    message = 'Request processed successfully',
) => {
    return res.status(200).send({
        success: true,
        message,
        data: data,
    });
};

// =========================== created ============================

const created = (res: Response, message = 'Resource created successfully') => {
    return res.status(201).send({
        success: true,
        message,
    });
};

// ======================= createdWithData ========================

const createdWithData = (
    res: Response,
    data: unknown,
    message = 'Resource created successfully',
) => {
    return res.status(201).send({
        success: true,
        message,
        data: data,
    });
};

// ================================================================
// ======================= error 400 responses ========================
// ================================================================

// ======================== validationError =======================

const validationError = (res: Response, message: string, key = 'message') => {
    return res.status(400).send({
        success: false,
        type: 'user',
        error: { [key]: message },
    });
};

// ======================== validationErrorObj =======================
// This will be used when we have to send multiple errors in response.

const validationErrorObj = (res: Response, errorObj: Record<string, string>) => {
    return res.status(400).send({
        success: false,
        type: 'user',
        error: errorObj,
    });
};

// ========================= frontError ===========================

const frontError = (res: Response, message: string, key = 'message') => {
    return res.status(400).send({
        success: false,
        type: 'frontend',
        error: { [key]: message },
    });
};

// ========================= frontErrorObj ===========================
// This will be used when we have to send multiple errors in response.

const frontErrorObj = (res: Response, errorObj: Record<string, string>) => {
    return res.status(400).send({
        success: false,
        type: 'frontend',
        error: errorObj,
    });
};

// ========================== backError ===========================
// This will be used when we are calling the other external Api's from backend And facing an issue.

const backError = (res: Response, message: string) => {
    return res.status(400).send({
        success: false,
        type: 'backend',
        error: { message },
    });
};

// ============================ UnauthorizedError ==========================

const unauthorizedError = (res: Response, message = 'Access Denied. You are not authorized.') => {
    return res.status(401).json({
        success: false,
        type: 'user',
        error: { message },
    });
};

// ============================ forbiddenError ==========================

const forbiddenError = (
    res: Response,
    message = 'Forbidden. you do not have permission to access this resource.',
) => {
    return res.status(403).json({
        success: false,
        type: 'user',
        error: { message },
    });
};

// ============================ notFound ==========================

const notFound = (res: Response, message = 'Resource not found.') => {
    return res.status(404).send({
        success: false,
        type: 'user',
        error: { message },
    });
};

// ========================= conflictError ========================

const conflictError = (res: Response, message = 'Conflict occurred. Resource already exists') => {
    return res.status(409).send({
        success: false,
        type: 'user',
        error: { message },
    });
};

// ========================= tooManyRequests ========================

const tooManyRequestsError = (
    res: Response,
    message = 'Too many requests. Please wait before trying again.',
) => {
    return res.status(429).send({
        success: false,
        type: 'user',
        error: { message },
    });
};

// ========================= paymentRequiredError ========================

const _paymentRequiredError = (
    res: Response,
    message = 'Payment is required to access this resource.',
) => {
    return res.status(402).send({
        success: false,
        type: 'user',
        error: { message },
    });
};

interface SequelizeErrorItemLike {
    message?: string;
    path?: string | null;
    errors?: unknown;
}

interface SequelizeErrorLike {
    name?: string;
    message?: string;
    errors?: SequelizeErrorItemLike[];
    parent?: { constraint?: string };
}

// ======================== sequelizeValidationError =======================

const sequelizeValidationError = (
    res: Response,
    error: SequelizeErrorLike | SequelizeErrorItemLike,
) => {
    let errorMessage = 'Validation error';
    let key = 'message';
    if ('errors' in error && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMessage = error.errors[0]?.message || 'Validation error';
        key = error.errors[0]?.path || 'message';
    } else if ('message' in error && error.message) {
        errorMessage = error.message;
        if ('path' in error && error.path) {
            key = error.path;
        }
    }
    return validationError(res, errorMessage, key);
};

// ======================== sequelizeFrontValidationError =======================

const sequelizeFrontError = (res: Response, error: SequelizeErrorLike | SequelizeErrorItemLike) => {
    let errorMessage = 'Validation error';
    let key = 'message';
    if ('errors' in error && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMessage = error.errors[0]?.message || 'Validation error';
        key = error.errors[0]?.path || 'message';
    } else if ('message' in error && error.message) {
        errorMessage = error.message;
        if ('path' in error && error.path) {
            key = error.path;
        }
    }
    return frontError(res, errorMessage, key);
};

// ================================================================
// ======================= error 500 responses ========================
// ================================================================

// ========================= catchError ===========================

const catchError = (res: Response, _error: unknown) => {
    console.error('[Internal Server Error in Controller]:', _error);
    return res.status(500).json({
        success: false,
        type: 'backend',
        error: { message: 'internal server error' },
    });
};

// ========================= catchWithSequelizeFrontError ===========================

const catchWithSequelizeFrontError = (res: Response, error: unknown) => {
    const err = error as SequelizeErrorLike;
    if (error instanceof ValidationError) return sequelizeFrontError(res, error);
    if (err.errors && err.errors[0]?.errors instanceof ValidationError) {
        return frontError(res, err.errors[0].message || 'Validation error');
    }
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return frontError(
            res,
            'Foreign key voilates. Making a relation with value that not exit.',
            err.parent?.constraint,
        );
    }
    if (err.name === 'SequelizeDatabaseError')
        return frontError(res, err.message || 'Database error', 'database');
    return catchError(res, error);
};

// ========================= catchWithSequelizeValidationError ===========================

const catchWithSequelizeValidationError = (res: Response, error: unknown) => {
    const err = error as SequelizeErrorLike;
    if (error instanceof ValidationError) return sequelizeValidationError(res, error);
    if (err.errors && err.errors[0]?.errors instanceof ValidationError) {
        return sequelizeValidationError(res, err.errors[0]);
    }
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return validationError(
            res,
            'Selecting or sending a value that does not exist.',
            'foreign_key',
        );
    }
    if (err.name === 'SequelizeDatabaseError')
        return validationError(res, err.message || 'Database error');
    return catchError(res, error);
};

export {
    successOk,
    successOkWithData,
    created,
    createdWithData,
    validationError,
    validationErrorObj,
    frontError,
    frontErrorObj,
    backError,
    conflictError,
    unauthorizedError,
    forbiddenError,
    notFound,
    tooManyRequestsError,
    sequelizeFrontError,
    sequelizeValidationError,
    catchError,
    catchWithSequelizeFrontError,
    catchWithSequelizeValidationError,
};

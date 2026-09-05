import { Request } from 'express';

export interface PaginationOptions {
    page: number;
    limit: number;
    offset: number;
}

export interface PaginationMeta {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
    items: T[];
    pagination: PaginationMeta;
}

export const getPaginationOptions = (
    req: Request,
    defaultLimit = 10,
    maxLimit = 50,
): PaginationOptions => {
    const pageQuery = req.query.page as string | undefined;
    const limitQuery = req.query.limit as string | undefined;

    let page = pageQuery ? parseInt(pageQuery, 10) : 1;
    let limit = limitQuery ? parseInt(limitQuery, 10) : defaultLimit;

    if (isNaN(page) || page < 1) {
        page = 1;
    }
    if (isNaN(limit) || limit < 1) {
        limit = defaultLimit;
    }
    if (limit > maxLimit) {
        limit = maxLimit;
    }

    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

export const formatPaginationData = <T>(
    data: T[],
    totalItems: number,
    page: number,
    limit: number,
): PaginatedResult<T> => {
    const totalPages = Math.ceil(totalItems / limit) || 1;
    return {
        items: data,
        pagination: {
            totalItems,
            totalPages,
            currentPage: page,
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
};

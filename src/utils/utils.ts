import os from 'os';

// =========================== convertToLowercase ===========================

export const convertToLowerCase = (
    obj: Record<string, unknown>,
    excludeFields: string[] = [],
): Record<string, unknown> => {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'string' && !excludeFields.includes(key)) {
                newObj[key] = value.toLowerCase();
            } else {
                newObj[key] = value;
            }
        }
    }
    return newObj;
};

// ============================ validateEmail ================================

const validEmailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
export const validateEmail = (email: string): string | undefined => {
    if (!email) {
        return 'email is required';
    }
    if (!validEmailRegex.test(email)) {
        return 'Please enter a valid email';
    }
};

// ============================ getIPAddress =================================

export const getIPAddress = (): string => {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        if (!iface) continue;
        for (const alias of iface) {
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '0.0.0.0'; // fallback in case IP address cannot be determined
};

// ============================ capitalizeWords ===============================

export const capitalizeWords = (wordString: string): string => {
    wordString = wordString.toLowerCase();
    const words = wordString.split(' ');
    const capitalWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
    return capitalWords.join(' ');
};

// ============================ check31DaysExpiry =================================

export const check31DaysExpiry = (
    activationDate: string | Date,
): { remainingDays: number; expired: boolean } => {
    const today = new Date();
    const activeDate = new Date(activationDate);
    //add 31 days to activation date
    const activeDatePlus31 = new Date(activeDate);
    activeDatePlus31.setDate(activeDatePlus31.getDate() + 31);
    //Calculate the difference in time
    const timeDifference = activeDatePlus31.getTime() - today.getTime();
    //calculate the remaining days
    const remainingDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    //check if today date is past the 31-day period
    const expired = timeDifference <= 0;
    return { remainingDays: expired ? 0 : remainingDays, expired };
};

// ============================ createDateWithTodayPlusAddDays =================================

export const createDateWithTodayPlusAddDays = (daysToAdd: number): string => {
    const today = new Date();
    //create a new Date object with added days from today
    const daysToAddDate = new Date();
    daysToAddDate.setDate(today.getDate() + daysToAdd);
    //format the dates as string (option)
    return daysToAddDate.toISOString().split('T')[0];
};

// ============================ getRelativePath =================================

export const getRelativePath = (fullPath: string): string => {
    const normalizedPath = fullPath.replace(/\\/g, '/');
    const index = normalizedPath.indexOf('/static');
    if (index === -1) return '';
    return normalizedPath.substring(index);
};

// =========================== calculateAge ===============================

export const calculateAge = (dateOfBirth: string | Date): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// =========================== removeEmptyFields ===============================

export const removeEmptyFields = (obj: Record<string, unknown>): Record<string, unknown> => {
    return Object.fromEntries(
        Object.entries(obj).filter(([_key, value]) => {
            if (value === null || value === undefined) return false;
            if (typeof value === 'string' && value.trim() === '') return false;
            if (Array.isArray(value) && value.length === 0) return false;
            if (
                typeof value === 'object' &&
                !Array.isArray(value) &&
                Object.keys(value as object).length === 0
            ) {
                return false;
            }
            return true;
        }),
    );
};

// ============================ extractFieldsToUpdate =================================

export const extractFieldsToUpdate = (
    body: Record<string, unknown>,
    fields: string[],
): Record<string, unknown> => {
    const fieldsToUpdate: Record<string, unknown> = {};
    for (const field of fields) {
        const value = body[field];
        if (value !== undefined && value !== null && value !== '') {
            fieldsToUpdate[field] = value;
        }
    }
    return fieldsToUpdate;
};

// ============================ removeFieldsNotToUpdate =================================

export const removeFieldsNotToUpdate = (
    body: Record<string, unknown>,
    fields: string[],
): Record<string, unknown> => {
    const fieldsToUpdate = { ...body };
    for (const field of fields) {
        if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, field)) {
            delete fieldsToUpdate[field];
        }
    }
    return fieldsToUpdate;
};

// ============================ isValidUuid =================================

export const isValidUuid = (value: unknown): value is string => {
    if (!value || typeof value !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value.trim(),
    );
};

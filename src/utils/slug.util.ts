import crypto from 'crypto';

export const generateSlug = (text: string, withUniqueSuffix = false): string => {
    let slug = text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text

    if (!slug) {
        slug = 'untitled';
    }

    if (withUniqueSuffix) {
        const randomSuffix = crypto.randomBytes(3).toString('hex');
        slug = `${slug}-${randomSuffix}`;
    }

    return slug;
};

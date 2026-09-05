export const calculateReadingTime = (content: string, wordsPerMinute = 200): number => {
    if (!content) {
        return 1;
    }
    // Strip HTML tags if present
    const plainText = content.replace(/<[^>]*>/g, '');
    const words = plainText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes < 1 ? 1 : minutes;
};

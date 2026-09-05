import Blog from '@/models/blog/blog.model.js';
import BlogTag from '@/models/blog/blogTag.model.js';

export const seedBlogs = async (): Promise<void> => {
    const existingBlogs = await Blog.count();
    if (existingBlogs > 0) {
        return;
    }

    const sampleBlogs = [
        {
            authorId: 1, // Ali (Super Admin)
            categoryId: 1, // Software Engineering
            title: 'Mastering TypeScript in High-Traffic Production Backends',
            slug: 'mastering-typescript-in-high-traffic-production-backends',
            subtitle:
                'How strict typing, path aliases, and modern NodeNext module resolution transform developer velocity.',
            content: `TypeScript has become the industry benchmark for constructing scalable, maintainable server-side applications. When architecting enterprise REST APIs, combining strict type definitions with modern ORMs like Sequelize eliminates runtime type mismatches and fosters maintainable team collaboration.

In this deep dive, we explore how to configure clean path aliases, enforce compile-time validation, handle complex PostgreSQL relationships, and structure modular controllers inspired by modern editorial platforms.`,
            coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200',
            readingTime: 5,
            viewsCount: 1420,
            likesCount: 88,
            commentsCount: 12,
            status: 'published' as const,
            publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            isFeatured: true,
            isPremium: false,
        },
        {
            authorId: 2, // Hania (Admin)
            categoryId: 2, // Web Development
            title: 'Building Resilient REST APIs with Node.js, Express & Sequelize',
            slug: 'building-resilient-rest-apis-with-nodejs-express-sequelize',
            subtitle:
                'Architectural patterns for database migrations, rate limiting, and structured JSON responses.',
            content: `Designing bulletproof backend architectures requires comprehensive consideration of rate limiting, compression, security headers via Helmet, and transaction-wrapped database operations.

Learn how to leverage PostgreSQL connection pooling, fast JWT verification, and standardized error response wrappers to build scalable APIs that hold up under heavy traffic.`,
            coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200',
            readingTime: 6,
            viewsCount: 980,
            likesCount: 54,
            commentsCount: 8,
            status: 'published' as const,
            publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            isFeatured: true,
            isPremium: false,
        },
        {
            authorId: 4, // Hania (Author)
            categoryId: 3, // Artificial Intelligence
            title: 'The Evolution of AI Agents in Modern Software Engineering',
            slug: 'the-evolution-of-ai-agents-in-modern-software-engineering',
            subtitle:
                'From code completion to full-cycle pair programming: how AI assistants are reshaping engineering teams.',
            content: `Agentic workflows represent the next paradigm in developer tooling. Rather than static chatbots, autonomous software agents can understand full codebases, execute strict builds, run linters, and iteratively refine complex systems while adhering to existing architectural constraints.`,
            coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
            readingTime: 4,
            viewsCount: 2310,
            likesCount: 172,
            commentsCount: 24,
            status: 'published' as const,
            publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            isFeatured: true,
            isPremium: false,
        },
    ];

    const createdBlogs = await Blog.bulkCreate(sampleBlogs as unknown as Partial<Blog>[]);

    // Associate tags with blogs
    const blogTagsData = [
        { blogId: createdBlogs[0]!.id, tagId: 1 }, // Blog 1 -> Node.js
        { blogId: createdBlogs[0]!.id, tagId: 2 }, // Blog 1 -> TypeScript
        { blogId: createdBlogs[0]!.id, tagId: 3 }, // Blog 1 -> PostgreSQL
        { blogId: createdBlogs[1]!.id, tagId: 1 }, // Blog 2 -> Node.js
        { blogId: createdBlogs[1]!.id, tagId: 4 }, // Blog 2 -> Sequelize
        { blogId: createdBlogs[1]!.id, tagId: 6 }, // Blog 2 -> REST API
        { blogId: createdBlogs[2]!.id, tagId: 8 }, // Blog 3 -> AI & LLM
    ];

    await BlogTag.bulkCreate(blogTagsData, { ignoreDuplicates: true });
    console.log('Sample blogs & tags seeded successfully');
};

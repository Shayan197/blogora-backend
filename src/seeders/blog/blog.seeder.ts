import User from '@/models/auth/user.model.js';
import Blog from '@/models/blog/blog.model.js';
import BlogTag from '@/models/blog/blogTag.model.js';
import Category from '@/models/blog/category.model.js';
import Tag from '@/models/blog/tag.model.js';

export const seedBlogs = async (
    userMap?: Map<string, User>,
    categoryMap?: Map<string, Category>,
    tagMap?: Map<string, Tag>,
): Promise<void> => {
    // Resolve users if not passed
    let users = userMap;
    if (!users || users.size === 0) {
        const allUsers = await User.findAll();
        users = new Map<string, User>();
        for (const u of allUsers) {
            users.set(u.email, u);
        }
    }

    // Resolve categories if not passed
    let categories = categoryMap;
    if (!categories || categories.size === 0) {
        const allCategories = await Category.findAll();
        categories = new Map<string, Category>();
        for (const c of allCategories) {
            categories.set(c.slug, c);
        }
    }

    // Resolve tags if not passed
    let tags = tagMap;
    if (!tags || tags.size === 0) {
        const allTags = await Tag.findAll();
        tags = new Map<string, Tag>();
        for (const t of allTags) {
            tags.set(t.slug, t);
        }
    }

    // Fallback author if specific emails not found
    const defaultAuthor = Array.from(users.values())[0] ?? (await User.findOne());
    if (!defaultAuthor) {
        throw new Error(
            'Cannot seed blogs: No users found in database. Seed users before seeding blogs.',
        );
    }

    // Fallback category if specific slugs not found
    const defaultCategory = Array.from(categories.values())[0] ?? (await Category.findOne());
    if (!defaultCategory) {
        throw new Error(
            'Cannot seed blogs: No categories found in database. Seed categories before seeding blogs.',
        );
    }

    const sampleBlogs = [
        {
            authorEmail: 'ali@email.com',
            categorySlug: 'software-engineering',
            tagSlugs: ['nodejs', 'typescript', 'postgresql'],
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
            authorEmail: 'hania@email.com',
            categorySlug: 'web-development',
            tagSlugs: ['nodejs', 'sequelize', 'rest-api'],
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
            authorEmail: 'hania4amir@email.com',
            categorySlug: 'artificial-intelligence',
            tagSlugs: ['ai-llm'],
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

    for (const b of sampleBlogs) {
        const author = users.get(b.authorEmail) ?? defaultAuthor;
        const category = categories.get(b.categorySlug) ?? defaultCategory;

        let blog = await Blog.findOne({ where: { slug: b.slug } });
        if (!blog) {
            blog = await Blog.create({
                authorId: author.id,
                categoryId: category.id,
                title: b.title,
                slug: b.slug,
                subtitle: b.subtitle,
                content: b.content,
                coverImage: b.coverImage,
                readingTime: b.readingTime,
                viewsCount: b.viewsCount,
                likesCount: b.likesCount,
                commentsCount: b.commentsCount,
                status: b.status,
                publishedAt: b.publishedAt,
                isFeatured: b.isFeatured,
                isPremium: b.isPremium,
            });
        } else {
            // Keep author and category synced to existing real parent records
            blog.authorId = author.id;
            blog.categoryId = category.id;
            await blog.save({ fields: ['authorId', 'categoryId'] });
        }

        // Associate tags dynamically
        for (const tagSlug of b.tagSlugs) {
            const tagRecord =
                tags.get(tagSlug) ?? (await Tag.findOne({ where: { slug: tagSlug } }));
            if (tagRecord) {
                const existingLink = await BlogTag.findOne({
                    where: { blogId: blog.id, tagId: tagRecord.id },
                });
                if (!existingLink) {
                    await BlogTag.create({ blogId: blog.id, tagId: tagRecord.id });
                }
            }
        }
    }

    console.log(`Sample blogs & tags seeded successfully (${sampleBlogs.length} stories ready)`);
};

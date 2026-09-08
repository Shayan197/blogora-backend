import Tag from '@/models/blog/tag.model.js';

export const seedTags = async (): Promise<Map<string, Tag>> => {
    const tags = [
        {
            name: 'Node.js',
            slug: 'nodejs',
            description: 'Asynchronous event-driven JavaScript runtime.',
            usageCount: 5,
            isActive: true,
        },
        {
            name: 'TypeScript',
            slug: 'typescript',
            description: 'Typed superset of JavaScript that compiles to plain JavaScript.',
            usageCount: 4,
            isActive: true,
        },
        {
            name: 'PostgreSQL',
            slug: 'postgresql',
            description: 'Powerful, open-source object-relational database system.',
            usageCount: 3,
            isActive: true,
        },
        {
            name: 'Sequelize',
            slug: 'sequelize',
            description: 'Promise-based Node.js ORM for Postgres, MySQL, SQLite, and more.',
            usageCount: 3,
            isActive: true,
        },
        {
            name: 'System Design',
            slug: 'system-design',
            description: 'High-availability distributed architectures and systems.',
            usageCount: 2,
            isActive: true,
        },
        {
            name: 'REST API',
            slug: 'rest-api',
            description: 'Representational State Transfer API architecture principles.',
            usageCount: 4,
            isActive: true,
        },
        {
            name: 'Microservices',
            slug: 'microservices',
            description: 'Independently deployable, modular architecture services.',
            usageCount: 2,
            isActive: true,
        },
        {
            name: 'AI & LLM',
            slug: 'ai-llm',
            description: 'Generative AI, prompting engineering, and LLM integrations.',
            usageCount: 3,
            isActive: true,
        },
    ];

    for (const t of tags) {
        const existing = await Tag.findOne({ where: { slug: t.slug } });
        if (!existing) {
            await Tag.create(t);
        }
    }

    const allTags = await Tag.findAll();
    const tagMap = new Map<string, Tag>();
    for (const t of allTags) {
        tagMap.set(t.slug, t);
    }

    console.log(`Tags seeded successfully (${allTags.length} tags available)`);
    return tagMap;
};

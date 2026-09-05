import Category from '@/models/blog/category.model.js';

export const seedCategories = async (): Promise<void> => {
    const categories = [
        {
            name: 'Software Engineering',
            slug: 'software-engineering',
            description: 'Architecture, design patterns, scalable backend systems, and clean code.',
            icon: 'code',
            color: '#3b82f6',
            isActive: true,
        },
        {
            name: 'Web Development',
            slug: 'web-development',
            description: 'Modern frontend, backend, APIs, Node.js, and web ecosystem.',
            icon: 'globe',
            color: '#10b981',
            isActive: true,
        },
        {
            name: 'Artificial Intelligence',
            slug: 'artificial-intelligence',
            description:
                'Machine learning, large language models, neural networks, and AI workflows.',
            icon: 'brain',
            color: '#8b5cf6',
            isActive: true,
        },
        {
            name: 'DevOps & Cloud',
            slug: 'devops-cloud',
            description: 'Containers, Kubernetes, CI/CD pipelines, AWS, and cloud infrastructure.',
            icon: 'cloud',
            color: '#f59e0b',
            isActive: true,
        },
        {
            name: 'Design & UX',
            slug: 'design-ux',
            description:
                'User interface design, product thinking, typography, and visual ergonomics.',
            icon: 'palette',
            color: '#ec4899',
            isActive: true,
        },
        {
            name: 'Career & Productivity',
            slug: 'career-productivity',
            description: 'Developer careers, remote work, leadership, and personal productivity.',
            icon: 'briefcase',
            color: '#6366f1',
            isActive: true,
        },
    ];

    await Category.bulkCreate(categories as unknown as Partial<Category>[], {
        ignoreDuplicates: true,
    });
    console.log('Categories seeded successfully');
};

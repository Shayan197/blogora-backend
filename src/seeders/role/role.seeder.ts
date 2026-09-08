import Role from '@/models/auth/role.model.js';

export const seedRoles = async (): Promise<Map<string, Role>> => {
    const roles = [
        {
            name: 'Super Admin',
            slug: 'super-admin',
            description: 'System Owner',
            priority: 1,
            color: '#ff0000',
            icon: 'sheild',
            isSystem: true,
            isActive: true,
        },
        {
            name: 'Admin',
            slug: 'admin',
            description: 'Platform Administrator',
            priority: 2,
            color: '#ff8800',
            icon: 'admin',
            isSystem: true,
            isActive: true,
        },
        {
            name: 'Editor',
            slug: 'editor',
            description: 'Platform Content Editor',
            priority: 3,
            color: '#00aa00',
            icon: 'edit',
            isSystem: true,
            isActive: true,
        },
        {
            name: 'Author',
            slug: 'author',
            description: 'Write Blogs',
            priority: 4,
            color: '#0066ff',
            icon: 'pen-to-square',
            isSystem: true,
            isActive: true,
        },
        {
            name: 'Moderator',
            slug: 'moderator',
            description: 'Manages Comments',
            priority: 5,
            color: '#9900cc',
            icon: 'message',
            isSystem: true,
            isActive: true,
        },
        {
            name: 'Subscriber',
            slug: 'subscriber',
            description: 'Reads Content',
            priority: 6,
            color: '#666666',
            icon: 'user',
            isSystem: true,
            isActive: true,
        },
    ];

    for (const r of roles) {
        const existing = await Role.findOne({ where: { slug: r.slug } });
        if (!existing) {
            await Role.create(r);
        }
    }

    const allRoles = await Role.findAll();
    const roleMap = new Map<string, Role>();
    for (const r of allRoles) {
        roleMap.set(r.slug, r);
    }

    console.log(`Roles seeded successfully (${allRoles.length} roles available)`);
    return roleMap;
};

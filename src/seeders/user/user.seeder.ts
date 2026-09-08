import Profile from '@/models/auth/profile.model.js';
import Role from '@/models/auth/role.model.js';
import User from '@/models/auth/user.model.js';
import { hashPassword } from '@/utils/password.util.js';

export const seedUsers = async (roleMap?: Map<string, Role>): Promise<Map<string, User>> => {
    let roles = roleMap;
    if (!roles || roles.size === 0) {
        const allRoles = await Role.findAll();
        roles = new Map<string, Role>();
        for (const r of allRoles) {
            roles.set(r.slug, r);
        }
    }

    const defaultRole =
        roles.get('author') ?? roles.get('subscriber') ?? Array.from(roles.values())[0];

    const usersToSeed = [
        {
            roleSlug: 'super-admin',
            firstName: 'Ali',
            lastName: 'Khan',
            email: 'ali@email.com',
            phone: '1234567891',
            passwordPlain: '12345678',
            gender: 'male' as const,
            status: 'active' as const,
            experience: 5,
            skills: ['Node.js', 'Express.js', 'PostgreSQL', 'TypeScript', 'Sequelize', 'Docker'],
            preferences: {
                theme: 'dark',
                language: 'en',
            },
            headline: 'Super Admin & Lead Systems Architect',
            bio: 'Lead engineer and systems architect building resilient backend services and developer platforms.',
        },
        {
            roleSlug: 'admin',
            firstName: 'Hania',
            lastName: 'Khan',
            email: 'hania@email.com',
            phone: '1234567892',
            passwordPlain: '12345678',
            gender: 'female' as const,
            status: 'active' as const,
            experience: 5,
            skills: ['Node.js', 'Express.js', 'PostgreSQL', 'React', 'Next.js', 'TailwindCSS'],
            preferences: {
                theme: 'light',
                language: 'en',
            },
            headline: 'Platform Administrator & Full-Stack Lead',
            bio: 'Platform administrator focused on content governance, performance tuning, and developer workflows.',
        },
        {
            roleSlug: 'editor',
            firstName: 'Hania',
            lastName: 'Amir',
            email: 'haniaamir@email.com',
            phone: '1234567893',
            passwordPlain: '12345678',
            gender: 'female' as const,
            status: 'active' as const,
            experience: 4,
            skills: ['Content Strategy', 'Technical Writing', 'SEO', 'Editorial Review'],
            preferences: {
                theme: 'light',
                language: 'en',
            },
            headline: 'Senior Technical Content Editor',
            bio: 'Curating insightful technical deep dives, engineering guides, and architecture critiques.',
        },
        {
            roleSlug: 'author',
            firstName: 'Hania',
            lastName: 'Amir',
            email: 'hania4amir@email.com',
            phone: '12345678934',
            passwordPlain: '12345678',
            gender: 'female' as const,
            status: 'active' as const,
            experience: 3,
            skills: ['Artificial Intelligence', 'Python', 'LLM Agents', 'Machine Learning'],
            preferences: {
                theme: 'light',
                language: 'en',
            },
            headline: 'AI Research Engineer & Technical Writer',
            bio: 'Writing on autonomous software agents, modern LLM pipelines, and future-proof architectures.',
        },
        {
            roleSlug: 'moderator',
            firstName: 'Hania',
            lastName: 'Amir',
            email: 'haniaami5r@email.com',
            phone: '12345678932',
            passwordPlain: '12345678',
            gender: 'female' as const,
            status: 'active' as const,
            experience: 2,
            skills: ['Community Management', 'Content Moderation', 'Policy Enforcement'],
            preferences: {
                theme: 'light',
                language: 'en',
            },
            headline: 'Community Moderator',
            bio: 'Ensuring constructive, high-quality technical discussions and adhering to community guidelines.',
        },
        {
            roleSlug: 'subscriber',
            firstName: 'Hania',
            lastName: 'Amir',
            email: 'haniaami6r@email.com',
            phone: '12345678936',
            passwordPlain: '12345678',
            gender: 'female' as const,
            status: 'active' as const,
            experience: 1,
            skills: ['Software Engineering', 'Learning', 'Web Development'],
            preferences: {
                theme: 'light',
                language: 'en',
            },
            headline: 'Avid Tech Reader & Community Member',
            bio: 'Software engineer passionate about scalable systems, distributed data, and clean code.',
        },
    ];

    const hashedPassword = await hashPassword('12345678');
    const userMap = new Map<string, User>();

    for (const u of usersToSeed) {
        const targetRole = roles.get(u.roleSlug) ?? defaultRole;
        if (!targetRole) {
            throw new Error(`Cannot seed user ${u.email}: No role available`);
        }

        let user = await User.findOne({ where: { email: u.email } });
        if (!user) {
            user = await User.create({
                roleId: targetRole.id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                phone: u.phone,
                password: hashedPassword,
                gender: u.gender,
                status: u.status,
                experience: u.experience,
                skills: u.skills,
                preferences: u.preferences,
                isVerified: true,
                isActive: true,
            });
        } else {
            user.roleId = targetRole.id;
            user.isVerified = true;
            user.isActive = true;
            await user.save({ fields: ['roleId', 'isVerified', 'isActive'] });
        }

        userMap.set(user.email, user);

        // Ensure associated Profile exists
        const existingProfile = await Profile.findOne({ where: { userId: user.id } });
        if (!existingProfile) {
            await Profile.create({
                userId: user.id,
                headline: u.headline,
                bio: u.bio,
                websiteUrl: 'https://blogora.dev',
            });
        }
    }

    console.log(`Users seeded successfully (${userMap.size} users available)`);
    return userMap;
};

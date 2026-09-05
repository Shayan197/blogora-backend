import { DataTypes, Model } from 'sequelize';
import { v7 as uuidv7 } from 'uuid';

import sequelize from '@/config/db.config.js';

class Blog extends Model {
    declare id: number;
    declare uuid: string;
    declare authorId: number;
    declare categoryId: number;
    declare title: string;
    declare slug: string;
    declare subtitle: string | null;
    declare content: string;
    declare coverImage: string | null;
    declare readingTime: number;
    declare viewsCount: number;
    declare likesCount: number;
    declare commentsCount: number;
    declare status: 'draft' | 'published' | 'archived';
    declare publishedAt: Date | null;
    declare isFeatured: boolean;
    declare isPremium: boolean;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
    declare readonly deletedAt: Date | null;
}

Blog.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        uuid: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: () => uuidv7(),
        },
        authorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'categories',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [3, 255],
            },
        },
        slug: {
            type: DataTypes.STRING(300),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                isLowercase: true,
            },
        },
        subtitle: {
            type: DataTypes.STRING(300),
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        coverImage: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        readingTime: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false,
            validate: {
                min: 1,
            },
        },
        viewsCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        likesCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        commentsCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('draft', 'published', 'archived'),
            defaultValue: 'draft',
            allowNull: false,
        },
        publishedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        isFeatured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        isPremium: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Blog',
        tableName: 'blogs',
        timestamps: true,
        underscored: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['uuid'],
            },
            {
                unique: true,
                fields: ['slug'],
            },
            {
                fields: ['author_id'],
            },
            {
                fields: ['category_id'],
            },
            {
                fields: ['status'],
            },
            {
                fields: ['published_at'],
            },
            {
                fields: ['is_featured'],
            },
            {
                fields: ['views_count'],
            },
            {
                fields: ['likes_count'],
            },
        ],
    },
);

export default Blog;

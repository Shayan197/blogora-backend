import { DataTypes, Model } from 'sequelize';

import sequelize from '@/config/db.config.js';

class BlogTag extends Model {
    declare id: number;
    declare blogId: number;
    declare tagId: number;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

BlogTag.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        blogId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'blogs',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        tagId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tags',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
    },
    {
        sequelize,
        modelName: 'BlogTag',
        tableName: 'blog_tags',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['blog_id', 'tag_id'],
            },
            {
                fields: ['blog_id'],
            },
            {
                fields: ['tag_id'],
            },
        ],
    },
);

export default BlogTag;

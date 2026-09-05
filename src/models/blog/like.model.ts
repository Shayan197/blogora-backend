import { DataTypes, Model } from 'sequelize';
import { v7 as uuidv7 } from 'uuid';

import sequelize from '@/config/db.config.js';

class Like extends Model {
    declare id: number;
    declare uuid: string;
    declare userId: number;
    declare blogId: number;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

Like.init(
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
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
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
    },
    {
        sequelize,
        modelName: 'Like',
        tableName: 'likes',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['uuid'],
            },
            {
                unique: true,
                fields: ['user_id', 'blog_id'],
            },
            {
                fields: ['blog_id'],
            },
            {
                fields: ['user_id'],
            },
        ],
    },
);

export default Like;

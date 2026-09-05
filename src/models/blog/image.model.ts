import { DataTypes, Model } from 'sequelize';
import { v7 as uuidv7 } from 'uuid';

import sequelize from '@/config/db.config.js';

class Image extends Model {
    declare id: number;
    declare uuid: string;
    declare blogId: number | null;
    declare uploaderId: number;
    declare url: string;
    declare altText: string | null;
    declare caption: string | null;
    declare mimeType: string | null;
    declare size: number | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
    declare readonly deletedAt: Date | null;
}

Image.init(
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
        blogId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'blogs',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        uploaderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        url: {
            type: DataTypes.STRING(500),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        altText: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        caption: {
            type: DataTypes.STRING(300),
            allowNull: true,
        },
        mimeType: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        size: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Image',
        tableName: 'images',
        timestamps: true,
        underscored: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['uuid'],
            },
            {
                fields: ['blog_id'],
            },
            {
                fields: ['uploader_id'],
            },
        ],
    },
);

export default Image;

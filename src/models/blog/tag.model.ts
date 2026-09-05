import { DataTypes, Model } from 'sequelize';
import { v7 as uuidv7 } from 'uuid';

import sequelize from '@/config/db.config.js';

class Tag extends Model {
    declare id: number;
    declare uuid: string;
    declare name: string;
    declare slug: string;
    declare description: string | null;
    declare usageCount: number;
    declare isActive: boolean;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
    declare readonly deletedAt: Date | null;
}

Tag.init(
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
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                len: [1, 50],
            },
        },
        slug: {
            type: DataTypes.STRING(60),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                isLowercase: true,
            },
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        usageCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Tag',
        tableName: 'tags',
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
                unique: true,
                fields: ['name'],
            },
            {
                fields: ['usage_count'],
            },
            {
                fields: ['is_active'],
            },
        ],
    },
);

export default Tag;

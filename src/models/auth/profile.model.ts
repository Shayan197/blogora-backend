import { DataTypes, Model } from 'sequelize';
import { v7 as uuidv7 } from 'uuid';

import sequelize from '@/config/db.config.js';

class Profile extends Model {
    declare id: number;
    declare uuid: string;
    declare userId: number;
    declare bio: string | null;
    declare headline: string | null;
    declare websiteUrl: string | null;
    declare twitterUrl: string | null;
    declare githubUrl: string | null;
    declare linkedinUrl: string | null;
    declare location: string | null;
    declare avatar: string | null;
    declare coverImage: string | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
    declare readonly deletedAt: Date | null;
}

Profile.init(
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
            unique: true,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        headline: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
        websiteUrl: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true,
            },
        },
        twitterUrl: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true,
            },
        },
        githubUrl: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true,
            },
        },
        linkedinUrl: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true,
            },
        },
        location: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        avatar: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        coverImage: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Profile',
        tableName: 'profiles',
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
                fields: ['user_id'],
            },
        ],
    },
);

export default Profile;

import { DataTypes, Model } from 'sequelize';
import { v7 as uuidv7 } from 'uuid';

import sequelize from '@/config/db.config.js';

class Notification extends Model {
    declare id: number;
    declare uuid: string;
    declare recipientId: number;
    declare actorId: number;
    declare type: 'like' | 'comment' | 'reply' | 'publish' | 'system';
    declare entityId: number | null;
    declare message: string;
    declare isRead: boolean;
    declare readAt: Date | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
    declare readonly deletedAt: Date | null;
}

Notification.init(
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
        recipientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        actorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        type: {
            type: DataTypes.ENUM('like', 'comment', 'reply', 'publish', 'system'),
            allowNull: false,
        },
        entityId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        message: {
            type: DataTypes.STRING(300),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        readAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Notification',
        tableName: 'notifications',
        timestamps: true,
        underscored: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['uuid'],
            },
            {
                fields: ['recipient_id'],
            },
            {
                fields: ['actor_id'],
            },
            {
                fields: ['is_read'],
            },
            {
                fields: ['type'],
            },
        ],
    },
);

export default Notification;

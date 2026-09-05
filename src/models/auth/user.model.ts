import { DataTypes, Model } from 'sequelize';
import { v7 as uuidv7 } from 'uuid';

import sequelize from '@/config/db.config.js';
import type Profile from '@/models/auth/profile.model.js';
import type Role from '@/models/auth/role.model.js';

class User extends Model {
    declare id: number;
    declare uuid: string;
    declare roleId: number;
    declare firstName: string;
    declare lastName: string;
    declare gender: 'male' | 'female' | 'other';
    declare dob: string | null;
    declare email: string;
    declare phone: string | null;
    declare password: string;
    declare canChangePassword: boolean;
    declare salary: number | null;
    declare experience: number;
    declare status: 'pending' | 'active' | 'blocked' | 'suspended';
    declare preferences: Record<string, unknown> | null;
    declare skills: string[] | null;
    declare avatar: string | null;
    declare loginCount: number;
    declare lastLogin: Date | null;
    declare isVerified: boolean;
    declare isActive: boolean;
    declare otp: number | null;
    declare otpCount: number;
    declare fullName: string;
    declare role?: Role;
    declare profile?: Profile;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
    declare readonly deletedAt: Date | null;
}

User.init(
    {
        //primary key
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        //public uuid
        uuid: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: () => uuidv7(),
        },
        //foreign key from ROLE model
        roleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'roles',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        //personal information
        firstName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 50],
            },
        },
        lastName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 50],
            },
        },
        gender: {
            type: DataTypes.ENUM('male', 'female', 'other'),
            allowNull: false,
        },
        dob: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        //authentication information
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true,
                isEmail: true,
            },
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [8, 255],
            },
        },
        canChangePassword: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        //professional information
        salary: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
            defaultValue: 0,
        },
        experience: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        //user status / account status
        status: {
            type: DataTypes.ENUM('pending', 'active', 'blocked', 'suspended'),
            defaultValue: 'pending',
            allowNull: false,
        },
        //postgres json type for flexible data
        preferences: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
        },
        //postgres array type for storing multiple skills
        skills: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
        },
        //profile
        avatar: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        //analytics
        loginCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        //verification and status flags
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        otp: {
            type: DataTypes.INTEGER,
        },
        otpCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        //virtual fields
        fullName: {
            type: DataTypes.VIRTUAL,
            get(this: User) {
                return `${this.firstName} ${this.lastName}`;
            },
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
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
                fields: ['email'],
            },
            {
                unique: true,
                fields: ['phone'],
            },
            {
                fields: ['role_id'],
            },
            {
                fields: ['status'],
            },
            {
                fields: ['is_verified'],
            },
            {
                fields: ['is_active'],
            },
        ],
    },
);

export default User;

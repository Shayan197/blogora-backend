import Profile from '@/models/auth/profile.model.js';
import Role from '@/models/auth/role.model.js';
import User from '@/models/auth/user.model.js';
import Blog from '@/models/blog/blog.model.js';
import BlogTag from '@/models/blog/blogTag.model.js';
import Category from '@/models/blog/category.model.js';
import Comment from '@/models/blog/comment.model.js';
import Image from '@/models/blog/image.model.js';
import Like from '@/models/blog/like.model.js';
import Tag from '@/models/blog/tag.model.js';
import Notification from '@/models/notification/notification.model.js';

// ====================================================
//                 User & Role
// ====================================================
Role.hasMany(User, {
    foreignKey: 'roleId',
    as: 'users',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});

User.belongsTo(Role, {
    foreignKey: 'roleId',
    as: 'role',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});

// ====================================================
//                 User & Profile
// ====================================================
User.hasOne(Profile, {
    foreignKey: 'userId',
    as: 'profile',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Profile.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

// ====================================================
//                 User & Blog
// ====================================================
User.hasMany(Blog, {
    foreignKey: 'authorId',
    as: 'blogs',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});

Blog.belongsTo(User, {
    foreignKey: 'authorId',
    as: 'author',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});

// ====================================================
//                 Category & Blog
// ====================================================
Category.hasMany(Blog, {
    foreignKey: 'categoryId',
    as: 'blogs',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});

Blog.belongsTo(Category, {
    foreignKey: 'categoryId',
    as: 'category',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});

// ====================================================
//                 Blog & Tag (Many-to-Many)
// ====================================================
Blog.belongsToMany(Tag, {
    through: BlogTag,
    foreignKey: 'blogId',
    otherKey: 'tagId',
    as: 'tags',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Tag.belongsToMany(Blog, {
    through: BlogTag,
    foreignKey: 'tagId',
    otherKey: 'blogId',
    as: 'blogs',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

BlogTag.belongsTo(Blog, {
    foreignKey: 'blogId',
    as: 'blog',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

BlogTag.belongsTo(Tag, {
    foreignKey: 'tagId',
    as: 'tag',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Blog.hasMany(BlogTag, {
    foreignKey: 'blogId',
    as: 'blogTags',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Tag.hasMany(BlogTag, {
    foreignKey: 'tagId',
    as: 'blogTags',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

// ====================================================
//                 Blog, User & Comment
// ====================================================
Blog.hasMany(Comment, {
    foreignKey: 'blogId',
    as: 'comments',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Comment.belongsTo(Blog, {
    foreignKey: 'blogId',
    as: 'blog',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

User.hasMany(Comment, {
    foreignKey: 'userId',
    as: 'comments',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Comment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Comment.hasMany(Comment, {
    foreignKey: 'parentId',
    as: 'replies',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Comment.belongsTo(Comment, {
    foreignKey: 'parentId',
    as: 'parent',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

// ====================================================
//                 Blog, User & Like
// ====================================================
Blog.hasMany(Like, {
    foreignKey: 'blogId',
    as: 'likes',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Like.belongsTo(Blog, {
    foreignKey: 'blogId',
    as: 'blog',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

User.hasMany(Like, {
    foreignKey: 'userId',
    as: 'likes',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Like.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

// ====================================================
//                 Blog, User & Image
// ====================================================
Blog.hasMany(Image, {
    foreignKey: 'blogId',
    as: 'images',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
});

Image.belongsTo(Blog, {
    foreignKey: 'blogId',
    as: 'blog',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
});

User.hasMany(Image, {
    foreignKey: 'uploaderId',
    as: 'uploadedImages',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Image.belongsTo(User, {
    foreignKey: 'uploaderId',
    as: 'uploader',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

// ====================================================
//                 User & Notification
// ====================================================
User.hasMany(Notification, {
    foreignKey: 'recipientId',
    as: 'notifications',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Notification.belongsTo(User, {
    foreignKey: 'recipientId',
    as: 'recipient',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

User.hasMany(Notification, {
    foreignKey: 'actorId',
    as: 'triggeredNotifications',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Notification.belongsTo(User, {
    foreignKey: 'actorId',
    as: 'actor',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

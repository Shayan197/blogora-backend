# Blogora Backend — Agent Command Reference

A concise, professional cheatsheet and command reference for autonomous agents and developers working on the Blogora Backend service.

---

## 🛠️ Essential Commands

### Development & Execution
```bash
# Start development server with live reload (tsx watch)
npm run dev

# Compile TypeScript and resolve path aliases
npm run build

# Start production server
npm start

# Run database seeders (Roles, Users, Categories, Tags, Blogs)
npm run seed
```

### Code Quality & Validation
```bash
# Run ESLint validation
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# Check formatting with Prettier
npm run format:check

# Format codebase with Prettier
npm run format
```

---

## 👑 Super Admin & Seed Credentials

| Property | Value |
| :--- | :--- |
| **Super Admin Name** | Shayan Bukhari |
| **Email** | `shayanbukhari12345@gmail.com` |
| **Password** | `Asdf123@` |
| **Role Slug** | `super-admin` (Priority 1) |
| **Author Account** | `ali@email.com` / `12345678` |

---

## 🛡️ Role-Based Access Control (RBAC) Hierarchy

```
super-admin (1) ➔ admin (2) ➔ editor (3) ➔ author (4) ➔ moderator (5) ➔ subscriber (6)
```

- **Super Admin Exclusive**:
  - Elevate / demote user roles (`PATCH /api/users/:uuid/role`).
  - Cannot demote their own account.
- **Admin & Super Admin**:
  - Block, suspend, or reactivate accounts (`PATCH /api/users/:uuid/status`).
  - Manually verify accounts (`PATCH /api/users/:uuid/verify`).
  - Access Governance Analytics (`GET /api/users/analytics/overview`).
  - Delete categories (`DELETE /api/categories/:uuid`) and tags (`DELETE /api/tags/:uuid`).
  - Moderate / delete any blog story or comment.
- **Author**:
  - Create, update, and delete own blog stories.
- **Subscriber**:
  - Read blogs, post comments, and toggle likes.

---

## 🌐 API Route Overview

| Domain | Route | Methods | Access |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth/register`, `/login`, `/otp/verify` | POST | Public |
| **Auth** | `/api/auth/me` | GET, PATCH | Protected (Includes Role) |
| **Users** | `/api/users` | GET | Admin, Super Admin |
| **Users** | `/api/users/analytics/overview` | GET | Admin, Super Admin |
| **Users** | `/api/users/:uuid/role` | PATCH | Super Admin |
| **Users** | `/api/users/:uuid/status` | PATCH | Admin, Super Admin |
| **Users** | `/api/users/:uuid/verify` | PATCH | Admin, Super Admin |
| **Blogs** | `/api/blogs` | GET, POST | Public (Read) / Protected (Write) |
| **Blogs** | `/api/blogs/:slugOrUuid` | GET, PATCH, DELETE | Public (Read) / Author / Admin |
| **Categories** | `/api/categories` | GET, POST, PATCH, DELETE | Public (Read) / Admin (Mutate) |
| **Comments** | `/api/comments/blog/:blogUuid` | GET, POST | Public (Read) / Protected (Write) |

---

## 🚀 Deployment (Render)

- **Build Command**: `npm install && npm run build && npm run seed`
- **Start Command**: `npm start`
- **Environment**: Node.js `>=20.0.0`, PostgreSQL on Neon (`dbUrl` with SSL enabled)

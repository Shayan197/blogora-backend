# 🚀 Blogora Backend API

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Express Version](https://img.shields.io/badge/express-v5.2.1-blue.svg)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/typescript-v6.0.3-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://www.postgresql.org/)
[![Sequelize](https://img.shields.io/badge/sequelize-v6.37.8-52B0E7.svg)](https://sequelize.org/)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)

A scalable, secure, and production-ready RESTful API backend for **Blogora** — a modern multi-author blogging and content publishing platform. Built with **Node.js, Express 5, TypeScript, Sequelize ORM, and PostgreSQL**, featuring stateless authentication, role-based access control (RBAC), transactional email verification, and rigorous security defenses.

---

## 📑 Table of Contents
- [Architecture & Key Highlights](#-architecture--key-highlights)
- [Tech Stack](#-tech-stack)
- [Core Features](#-core-features)
- [System Architecture & Database Schema](#-system-architecture--database-schema)
- [Project Directory Structure](#-project-directory-structure)
- [Security & Performance Defenses](#-security--performance-defenses)
- [API Reference Endpoints](#-api-reference-endpoints)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Environment Variables](#-environment-variables)
- [Database Seeding](#-database-seeding)
- [Scripts & Quality Assurance](#-scripts--quality-assurance)

---

## 🏛 Architecture & Key Highlights

* **Modern Express 5 + TypeScript (ESM):** Native ES modules with strict TypeScript types, clean path aliasing (`@/*`), and structured MVC layering.
* **Stateless JWT Engine:** Powered by `fast-jwt` for high-performance token generation, dual-token rotation (Access Token + HttpOnly Refresh Cookie), and sub-millisecond cryptographic verification.
* **Relational Data Modeling:** Normalized PostgreSQL schema handled via Sequelize ORM with full relational integrity, cascading rules, and database indexes.
* **Enterprise Security Guardrails:** Strict IP rate limiting, Helmet HTTP header sanitization, dynamic CORS origin whitelisting, and gzip/brotli response compression.
* **Transactional Email & OTP Workflows:** Integrated Nodemailer delivery for time-sensitive registration verification, one-time passwords, and password recovery.
* **Graceful Teardown:** Handles `SIGTERM` and `SIGINT` signals by cleanly closing HTTP connections and draining the PostgreSQL connection pool.

---

## 🛠 Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Runtime & Core** | Node.js (>=20), Express v5.2.1 |
| **Language** | TypeScript v6, TSX (runtime execution) |
| **Database & ORM** | PostgreSQL, Sequelize ORM v6, `pg` driver |
| **Authentication & Tokens**| `fast-jwt`, `bcrypt` password hashing, `cookie-parser` |
| **Security & Middleware** | `helmet`, `express-rate-limit`, `cors`, `compression`, `morgan` |
| **Validation & Utilities**| `express-validator`, `uuid`, `chalk` |
| **Email Service** | `nodemailer` (SMTP / Gmail) |
| **DevOps & Code Hygiene**| ESLint v10, Prettier, Husky, Lint-Staged, Commitlint |

---

## ⚡ Core Features

### 1. Authentication & Session Security
* Complete registration with email OTP verification.
* JWT access token generation and silent refresh cycle via secure cookies.
* Forgot password workflow with timed OTP challenge and password reset.
* Role-Based Access Control (`super-admin`, `admin`, `editor`, `author`, `reader`).

### 2. Content & Blog Management
* Full CRUD for articles with unique slug generation, cover images, and view count tracking.
* Draft vs. Published status toggling.
* Tag and category multi-association.
* Trending blogs discovery algorithms based on engagement and views.

### 3. Engagement & Community
* Like/Unlike toggle on articles with distinct liker audit logs.
* Hierarchical, nested commenting system for community discussions.
* Real-time notifications for interactions (likes, comments, admin updates).

### 4. User Profiles & Admin Operations
* Custom author profiles with biography, social links, and avatars.
* Administrative endpoints for user status management, role escalation, and category curation.

---

## 🗄 System Architecture & Database Schema

```
                   +-----------------------------+
                   |       Client (Next.js)      |
                   +--------------+--------------+
                                  |
                           (HTTPS / REST)
                                  |
                                  v
+-----------------------------------------------------------------+
|                    Blogora Express 5 Engine                     |
|                                                                 |
|   +-------------------+   +------------------+   +----------+   |
|   |  Security Headers |   |  IP Rate Limit   |   |   CORS   |   |
|   |     (Helmet)      |   | (100 req / 5min) |   | (Origin) |   |
|   +---------+---------+   +--------+---------+   +----+-----+   |
|             |                      |                  |         |
|             +----------------------+------------------+         |
|                                    |                            |
|                                    v                            |
|               +----------------------------------+              |
|               |  Auth & RBAC Middleware          |              |
|               |  (fast-jwt, Refresh Cookie)      |              |
|               +-----------------+----------------+              |
|                                 |                               |
|       +------------+------------+------------+------------+     |
|       |            |            |            |            |     |
|       v            v            v            v            v     |
|   [Auth]        [Blogs]     [Comments]     [Users]     [Notifs] |
|   Ctrl          Ctrl        Ctrl           Ctrl        Ctrl     |
+-------+------------+------------+------------+------------+-----+
        |            |            |            |            |
        +------------+------------+------------+------------+
                                  |
                        (Sequelize ORM v6)
                                  |
                                  v
         +------------------------------------------------+
         |               PostgreSQL Database              |
         |  Users <-> Roles <-> Profiles                  |
         |  Blogs <-> Categories <-> Tags <-> BlogTags    |
         |  Comments <-> Likes <-> Notifications          |
         +------------------------------------------------+
```

---

## 📁 Project Directory Structure

```plaintext
blogora-backend/
├── src/
│   ├── app.ts                  # Application bootstrap, middlewares & server listen
│   ├── config/
│   │   ├── db.config.ts        # Sequelize PostgreSQL connection & pooling
│   │   └── initial.config.ts   # Validated environment configurations
│   ├── controllers/            # Controller layer (business logic)
│   │   ├── auth.controller.ts
│   │   ├── blog.controller.ts
│   │   ├── category.controller.ts
│   │   ├── comment.controller.ts
│   │   ├── like.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── profile.controller.ts
│   │   └── user.controller.ts
│   ├── middlewares/            # Custom auth, role-guard & error middlewares
│   │   └── auth.middleware.ts
│   ├── models/                 # Database entity definitions & associations
│   │   ├── associations.ts     # Sequelize associations & foreign keys
│   │   ├── auth/               # User, Role, Profile models
│   │   ├── blog/               # Blog, Category, Tag, Comment, Like models
│   │   └── notification/       # Notification model
│   ├── routes/                 # Express API routes
│   ├── seeders/                # Database seeders (runner & mock data)
│   ├── types/                  # TypeScript interface definitions
│   └── utils/                  # Utility functions, responses & email handlers
├── dist/                       # Compiled JavaScript output (production)
├── .env.example                # Sample environment variables
├── package.json
└── tsconfig.json
```

---

## 🛡 Security & Performance Defenses

1. **Helmet HTTP Headers:** Sets protective headers (HSTS, Content-Security-Policy, X-Frame-Options, XSS protection).
2. **Rate Limiting:** Protects all endpoints against denial of service and brute-force credential stuffing (100 requests per 5 minutes per IP).
3. **HTTP-Only Cookies:** Refresh tokens are dispatched via `httpOnly`, `sameSite`, and `secure` cookies to eliminate client-side XSS leakage.
4. **Data Compression:** Routes automatically gzip and brotli compress payloads to reduce client bandwidth latency.
5. **Type-Safe Sanitization:** Queries and body payloads are validated with parameterized SQL execution via Sequelize, neutralizing SQL injection vectors.

---

## 📡 API Reference Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new user | ❌ No |
| `POST` | `/api/auth/otp-verify` | Verify email OTP code | ❌ No |
| `POST` | `/api/auth/otp-resend` | Request a fresh OTP code | ❌ No |
| `POST` | `/api/auth/login` | Login with email & password | ❌ No |
| `POST` | `/api/auth/logout` | Clear refresh session cookies | ⚠️ Optional |
| `POST` | `/api/auth/token-refresh` | Generate fresh access token | 🔄 Refresh Token |
| `GET` | `/api/auth/me` | Fetch active user credentials | 🔒 Yes |
| `PATCH`| `/api/auth/me` | Update active user details | 🔒 Yes |
| `POST` | `/api/auth/password/update` | Change existing account password | 🔒 Yes |
| `POST` | `/api/auth/password/forget` | Initiate password reset OTP email | ❌ No |
| `POST` | `/api/auth/password/otp-verify`| Verify reset password OTP | ❌ No |
| `POST` | `/api/auth/password/reset` | Set new password with verified OTP | ❌ No |

### 📝 Blogs & Publishing (`/api/blogs`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/blogs` | Paginated list of published articles | ❌ No |
| `GET` | `/api/blogs/trending` | Fetch top trending articles | ❌ No |
| `GET` | `/api/blogs/me` | Fetch stories published by logged-in author | 🔒 Author |
| `GET` | `/api/blogs/:slugOrUuid` | Fetch full story by unique slug or UUID | ❌ No |
| `POST` | `/api/blogs` | Create a new article | 🔒 Author / Admin |
| `PATCH`| `/api/blogs/:uuid` | Update article content / metadata | 🔒 Author |
| `DELETE`| `/api/blogs/:uuid` | Soft/hard delete article | 🔒 Author / Admin |
| `PATCH`| `/api/blogs/:uuid/publish` | Toggle published / draft status | 🔒 Author |
| `POST` | `/api/blogs/:blogUuid/likes` | Toggle like status on article | 🔒 Yes |
| `GET` | `/api/blogs/:blogUuid/likes` | Get users who liked article | ❌ No |

### 💬 Comments (`/api/comments`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/comments/blog/:blogUuid` | List comments for an article | ❌ No |
| `POST` | `/api/comments/blog/:blogUuid` | Add a comment to an article | 🔒 Yes |
| `PATCH`| `/api/comments/:uuid` | Edit own comment | 🔒 Yes |
| `DELETE`| `/api/comments/:uuid` | Remove own comment or admin delete | 🔒 Yes |

### 🔔 Notifications (`/api/notifications`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Get user notifications | 🔒 Yes |
| `PATCH`| `/api/notifications/read-all` | Mark all notifications as read | 🔒 Yes |
| `PATCH`| `/api/notifications/:uuid/read`| Mark single notification as read | 🔒 Yes |
| `DELETE`| `/api/notifications/:uuid` | Delete notification item | 🔒 Yes |

### 👤 Profiles (`/api/profiles`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profiles/me` | Fetch active profile bio and links | 🔒 Yes |
| `PUT` | `/api/profiles/me` | Update author bio, social links, avatar | 🔒 Yes |
| `GET` | `/api/profiles/author/:userUuid`| Fetch public author profile | ❌ No |

### 👥 Admin & Roles (`/api/users`, `/api/categories`, `/api/tags`)
| Method | Endpoint | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | List platform users | Super Admin / Admin |
| `PATCH`| `/api/users/:uuid/role` | Update user role | Super Admin |
| `PATCH`| `/api/users/:uuid/status` | Ban / Activate user account | Super Admin / Admin |
| `POST` | `/api/categories` | Create blog category | Admin / Editor |
| `POST` | `/api/tags` | Create blog tag | Admin / Author |

---

## 💻 Getting Started & Local Setup

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (version 20.x or higher)
* [PostgreSQL](https://www.postgresql.org/) (running locally or cloud instance e.g. Neon, Supabase, Render)
* [npm](https://www.npmjs.com/) or `pnpm`

### 2. Clone & Install Dependencies
```bash
cd blogora-backend
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/blogora_db
DATABASE_NAME=blogora_db
JWT_SECRET_KEY=your_super_secret_jwt_key_here
DOMAIN=http://localhost:3000
EMAIL=your-service-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

### 4. Run Development Server
```bash
npm run dev
```
The server will boot at `http://localhost:5000` with hot-reloading via `tsx watch`.

---

## 📦 Database Seeding
To populate default roles, initial super-admin, sample categories, tags, and articles:
```bash
npm run seed
```

---

## 🧪 Scripts & Quality Assurance

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Development** | `npm run dev` | Runs backend with live reload via `tsx watch` |
| **Build** | `npm run build` | Compiles TypeScript to `dist/` with alias resolution |
| **Production** | `npm start` | Runs compiled code in `dist/app.js` |
| **Lint Check** | `npm run lint` | Analyzes code quality using ESLint v10 |
| **Lint Auto-Fix**| `npm run lint:fix` | Fixes linting errors automatically |
| **Format** | `npm run format` | Enforces code formatting via Prettier |
| **Seed** | `npm run seed` | Seeds default roles and sample data |

---

## 👨‍💻 Author & Maintainer
**Shayan Bukhari**  
* Full-Stack Software Engineer  
* GitHub: [@shayanbukhari](https://github.com/shayanbukhari)

// =========================================
//             Libraries Import
// =========================================
import path from 'path';
import { fileURLToPath } from 'url';

import chalk from 'chalk';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

// =========================================
//             Code Imports
// =========================================
import sequelize, { connectDB } from '@/config/db.config.js';
import { nodeEnv, port, allowedOrigins } from '@/config/initial.config.js';
import '@/models/models.js';
import '@/models/associations.js';
import authRoutes from '@/routes/auth.route.js';
import blogRoutes from '@/routes/blog.route.js';
import categoryRoutes from '@/routes/category.route.js';
import commentRoutes from '@/routes/comment.route.js';
import notificationRoutes from '@/routes/notification.route.js';
import profileRoutes from '@/routes/profile.route.js';
import tagRoutes from '@/routes/tag.route.js';
import userRoutes from '@/routes/user.route.js';
// import { seedRoles, seedUsers, seedCategories, seedTags, seedBlogs } from '@/seeders/index.js';
import { catchError, validationError } from '@/utils/response.util.js';
// import { getIPAddress } from '@/utils/utils.js';

// =========================================
//            configuration
// =========================================

const app = express();

app.set('trust proxy', 1);

app.use(cookieParser());

// essential security headers with Helmet
app.use(helmet());

console.log('🌐 NODE_ENV:', nodeEnv);
console.log('🌐 Allowed Origins:', allowedOrigins);

// Enable CORS with credentials support for cookie-based authentication
const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Allow requests without origin (like mobile apps, curl, server-to-server)
        if (!origin) {
            return callback(null, true);
        }
        const normalizedOrigin = origin.replace(/\/$/, '');
        const isAllowed =
            allowedOrigins.includes(normalizedOrigin) ||
            (nodeEnv !== 'production' &&
                (normalizedOrigin.startsWith('http://localhost:') ||
                    normalizedOrigin.startsWith('http://127.0.0.1:')));

        if (isAllowed) {
            // console.log(`✅ CORS Allowed: ${normalizedOrigin}`);
            callback(null, true);
        } else {
            // console.log(`❌ CORS Denied: ${normalizedOrigin}`);
            callback(null, false);
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));

// Logger middleware for development environment
if (nodeEnv !== 'production') {
    app.use(morgan('dev'));
}

// Compress all routes
app.use(compression());

// Rate limiting middleware to prevent brute-force attacks
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 5 minutes',
});
app.use(limiter);

// Built-in middleware for parsing JSON request bodies
app.use(express.json());

// static directories
// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/static', express.static(path.join(__dirname, '..', 'static')));

// =========================================
//            Routes
// =========================================
// Route for root path
app.get('/', (_req: Request, res: Response) => {
    res.send('Welcome to Blogora - Blogging Platform API');
});

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Blogora - Blogging Platform API is healthy',
    });
});

// Domain API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);

// =========================================
//            Global Error handler
// =========================================
app.use(
    (
        err: Error & { code?: string; field?: string },
        _req: Request,
        res: Response,
        _next: NextFunction,
    ) => {
        if (err.code === 'UNSUPPORTED_FILE_FORMAT') {
            return validationError(res, err.message, err.field);
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
            return validationError(res, 'File size should not be greater than 10MB', err.field);
        }
        console.error(chalk.red(err.stack));
        return catchError(res, err);
    },
);

// Database connection
await connectDB();

// Seed database
// await seedRoles();
// await seedUsers();
// await seedCategories();
// await seedTags();
// await seedBlogs();

// Server running
const server = app.listen(port, '0.0.0.0', () => {
    console.log(chalk.bgYellow.bold(` 🚀 Server is listening at ${port} `));
});

// Graceful shutdown handling for cloud environments (Render, Docker, Kubernetes)
const gracefulShutdown = (signal: string) => {
    console.log(chalk.yellow(`\nReceived ${signal}. Starting graceful shutdown...`));
    server.close(async () => {
        console.log(chalk.yellow('HTTP server closed. Closing database connection...'));
        try {
            await sequelize.close();
            console.log(chalk.green('Database connection closed. Exiting process cleanly.'));
            process.exit(0);
        } catch (err) {
            console.error(chalk.red('Error during database disconnection:'), err);
            process.exit(1);
        }
    });

    // Force exit if cleanup takes longer than 10 seconds
    setTimeout(() => {
        console.error(chalk.red('Forcefully shutting down due to timeout.'));
        process.exit(1);
    }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

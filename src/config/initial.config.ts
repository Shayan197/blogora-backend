import dotenv from 'dotenv';

dotenv.config();

// import { getIPAddress } from '@/utils/utils.js';

// ==========================================================
//                Current Environment
// ==========================================================

const nodeEnv: string = process.env.NODE_ENV || 'development';

// ==========================================================
//                Check Environment Variables
// ==========================================================

if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL in environment env file');
if (!process.env.JWT_SECRET_KEY) throw new Error('Missing JWT_SECRET_KEY in environment env file');
if (nodeEnv === 'production' && !process.env.DOMAIN)
    throw new Error('Missing DOMAIN in environment env file');

// for email
if (!process.env.EMAIL) throw new Error('Missing EMAIL in environment env file.');
if (!process.env.EMAIL_PASS) throw new Error('Missing EMAIL_PASS in environment env file.');

// ==========================================================
//                Configuration Variables
// ==========================================================

const port: number = Number(process.env.PORT) || 5000;

const buildDatabaseUrl = (): string => {
    const rawUrl = (process.env.DATABASE_URL || '').trim();
    const rawDbName = process.env.DATABASE_NAME?.trim();

    if (!rawUrl) return '';

    try {
        const parsed = new URL(rawUrl);
        if (parsed.pathname && parsed.pathname !== '/' && parsed.pathname.length > 1) {
            return rawUrl;
        }
        if (rawDbName) {
            parsed.pathname = `/${rawDbName}`;
            return parsed.toString();
        }
        return rawUrl;
    } catch {
        if (rawDbName && !rawUrl.endsWith(rawDbName)) {
            return rawUrl.endsWith('/') ? `${rawUrl}${rawDbName}` : `${rawUrl}/${rawDbName}`;
        }
        return rawUrl;
    }
};

const dbUrl: string = buildDatabaseUrl();

const jwtSecret: string = process.env.JWT_SECRET_KEY;

const domain: string = process.env.DOMAIN || 'http://localhost:3000';

const allowedOrigins: string[] = domain
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

// ==========================================================
//                Email Configuration
// ==========================================================

const serviceEmail: string = process.env.EMAIL;
const serviceEmailPass: string = process.env.EMAIL_PASS;

export { nodeEnv, port, dbUrl, jwtSecret, domain, allowedOrigins, serviceEmail, serviceEmailPass };

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __configDir = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path for uploaded files; must match express.static in app.js */
export const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__configDir, '../uploads');

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';
export const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
export const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
export const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO || '';
export const STRIPE_PRICE_PREMIUM = process.env.STRIPE_PRICE_PREMIUM || '';

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = process.env.PORT || 4000;
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
export const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

/** Comma-separated browser origins (e.g. `https://example.com,https://www.example.com`) for CORS */
export const CORS_ORIGINS = FRONTEND_URL.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Email (Resend)
export const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
export const EMAIL_FROM = process.env.EMAIL_FROM || 'GigConnection <onboarding@resend.dev>';

// Legacy SMTP config (optional fallback / older setups)
export const SMTP_HOST = process.env.SMTP_HOST || '';
export const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASS = process.env.SMTP_PASS || '';
export const SMTP_FROM = process.env.SMTP_FROM || EMAIL_FROM;

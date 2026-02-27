import dotenv from 'dotenv';

dotenv.config();

/** JWT secrets - use strong values in production */
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';
export const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
export const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/** Stripe - webhook secret for signature verification */
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
export const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO || '';
export const STRIPE_PRICE_PREMIUM = process.env.STRIPE_PRICE_PREMIUM || '';

/** App */
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = process.env.PORT || 4000;
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

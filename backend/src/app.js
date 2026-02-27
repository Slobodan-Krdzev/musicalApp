import express from 'express';
import cors from 'cors';
import { FRONTEND_URL } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import advertRoutes from './routes/advertRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { webhook } from './controllers/stripeController.js';

const app = express();

app.use(cors({ origin: FRONTEND_URL || true, credentials: true }));
app.use(express.json());

// Stripe webhook must receive raw body for signature verification
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), webhook);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/adverts', advertRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use(errorHandler);

export default app;

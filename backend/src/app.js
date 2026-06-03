import express from 'express';
import cors from 'cors';
import { CORS_ORIGINS, UPLOAD_ROOT } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import advertRoutes from './routes/advertRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import offeringRoutes from './routes/offeringRoutes.js';
import partyRoutes from './routes/partyRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import { webhook } from './controllers/stripeController.js';

const app = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (CORS_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files (profiles, etc.)
app.use('/uploads', express.static(UPLOAD_ROOT));

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
app.use('/api/upload', uploadRoutes);
app.use('/api/offerings', offeringRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/newsletter', newsletterRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use(errorHandler);

export default app;

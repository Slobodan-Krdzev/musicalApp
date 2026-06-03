import app from './app.js';
import { connectDB } from './config/db.js';
import { PORT } from './config/env.js';
import { startApplicationScheduler } from './services/applicationScheduler.js';
import { startSubscriptionScheduler } from './services/subscriptionScheduler.js';

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[Server] API running on port ${PORT}`);
    startApplicationScheduler();
    startSubscriptionScheduler();
  });
});

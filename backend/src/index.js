import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { PORT } from './config/env.js';
import { startApplicationScheduler } from './services/applicationScheduler.js';
import { startSubscriptionScheduler } from './services/subscriptionScheduler.js';
import { initDealChatSocket } from './sockets/dealChatSocket.js';

connectDB().then(() => {
  const server = http.createServer(app);
  initDealChatSocket(server, app);

  server.listen(PORT, () => {
    console.log(`[Server] API running on port ${PORT}`);
    startApplicationScheduler();
    startSubscriptionScheduler();
  });
});

import { Server } from 'socket.io';
import { User } from '../models/index.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { CORS_ORIGINS } from '../config/env.js';
import { assertChatAccess, markDealChatRead, sendDealMessage } from '../services/dealChatService.js';

export function initDealChatSocket(httpServer, app) {
  const io = new Server(httpServer, {
    cors: {
      origin: CORS_ORIGINS,
      credentials: true,
    },
  });

  app.set('io', io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password -refreshToken');
      if (!user || user.isSuspended) return next(new Error('Unauthorized'));

      socket.user = user;
      socket.join(`user:${user._id}`);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('deal_chat:join', async ({ applicationId }) => {
      try {
        if (!applicationId) throw new Error('Application id required');
        await assertChatAccess(applicationId, socket.user._id);
        socket.join(`deal-chat:${applicationId}`);
        await markDealChatRead({
          applicationId,
          userId: socket.user._id,
          io,
        });
        socket.emit('deal_chat:joined', { applicationId });
      } catch (err) {
        socket.emit('deal_chat:error', { message: err.message || 'Failed to join chat' });
      }
    });

    socket.on('deal_chat:read', async ({ applicationId }) => {
      try {
        if (!applicationId) throw new Error('Application id required');
        await markDealChatRead({
          applicationId,
          userId: socket.user._id,
          io,
        });
      } catch (err) {
        socket.emit('deal_chat:error', { message: err.message || 'Failed to mark chat as read' });
      }
    });

    socket.on('deal_chat:leave', ({ applicationId }) => {
      if (applicationId) socket.leave(`deal-chat:${applicationId}`);
    });

    socket.on('deal_chat:send', async ({ applicationId, body }) => {
      try {
        const message = await sendDealMessage({
          applicationId,
          senderId: socket.user._id,
          body,
          io,
        });
        socket.emit('deal_chat:sent', message);
      } catch (err) {
        socket.emit('deal_chat:error', { message: err.message || 'Failed to send message' });
      }
    });
  });

  return io;
}

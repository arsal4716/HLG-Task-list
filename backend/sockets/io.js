import { Server } from 'socket.io';
import { socketAuth } from './socketAuth.js';
import { registerHandlers } from './handlers.js';
import { logger } from '../utils/logger.js';

let io = null;

// userId -> Set of socket ids (a user may have multiple tabs/devices)
const online = new Map();

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL?.split(',') || '*',
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    if (!online.has(userId)) online.set(userId, new Set());
    online.get(userId).add(socket.id);
    socket.join(`user:${userId}`);

    logger.debug(`Socket connected: ${socket.id} (user ${userId})`);
    broadcastPresence();

    registerHandlers(io, socket, online);

    socket.on('disconnect', () => {
      const set = online.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) online.delete(userId);
      }
      broadcastPresence();
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.io initialised');
  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialised');
  return io;
};

/** Emit an event to every socket belonging to a user. */
export const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

export const emitToUsers = (userIds, event, payload) => {
  (userIds || []).forEach((id) => emitToUser(id.toString(), event, payload));
};

export const broadcast = (event, payload) => {
  if (io) io.emit(event, payload);
};

const broadcastPresence = () => {
  if (io) io.emit('presence:update', { online: [...online.keys()] });
};

export const getOnlineUsers = () => [...online.keys()];

export default initSocket;

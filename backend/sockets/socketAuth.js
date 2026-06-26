import { verifyAccessToken } from '../helpers/token.js';

/** Socket.io middleware that authenticates the handshake using the JWT. */
export const socketAuth = (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Authentication required'));
    const decoded = verifyAccessToken(token);
    socket.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
};

export default socketAuth;

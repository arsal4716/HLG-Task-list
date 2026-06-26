import { SOCKET_EVENTS } from '../config/constants.js';

/**
 * Per-socket event handlers. Real-time collaboration niceties: typing
 * indicators on tasks, live timer pings and joining task "rooms".
 */
export const registerHandlers = (io, socket) => {
  socket.on('task:join', (taskId) => {
    if (taskId) socket.join(`task:${taskId}`);
  });

  socket.on('task:leave', (taskId) => {
    if (taskId) socket.leave(`task:${taskId}`);
  });

  socket.on('comment:typing', ({ taskId, isTyping }) => {
    if (!taskId) return;
    socket.to(`task:${taskId}`).emit('comment:typing', {
      taskId,
      userId: socket.user.id,
      isTyping,
    });
  });

  socket.on('timer:ping', ({ taskId, seconds }) => {
    socket.to(`task:${taskId}`).emit(SOCKET_EVENTS.TIMER_UPDATED, {
      taskId,
      userId: socket.user.id,
      seconds,
    });
  });
};

export default registerHandlers;

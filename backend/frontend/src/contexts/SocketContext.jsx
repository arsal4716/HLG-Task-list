import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext.jsx';
import { getAccessToken } from '../lib/axios.js';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [online, setOnline] = useState([]);
  const [connected, setConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const token = getAccessToken();
    if (!token) return undefined;

    const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(url, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('presence:update', (data) => setOnline(data.online || []));

    socket.on('notification:new', (notif) => {
      toast(notif.title, { icon: '🔔' });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    });

    const invalidateTasks = () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };
    socket.on('task:created', invalidateTasks);
    socket.on('task:updated', invalidateTasks);
    socket.on('task:deleted', invalidateTasks);

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, queryClient]);

  const value = {
    socket: socketRef.current,
    online,
    connected,
    isUserOnline: (id) => online.includes(id?.toString()),
    emit: (...args) => socketRef.current?.emit(...args),
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};

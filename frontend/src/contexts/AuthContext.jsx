import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/index.js';
import { setAccessToken, getAccessToken } from '../lib/axios.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    try {
      // attempt to restore a session via the refresh-cookie path
      const me = await authService.me();
      setUser(me.data.user);
      setPerformance(me.data.performance);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    await hydrate();
    return res;
  };

  const register = async (payload) => {
    const res = await authService.register(payload);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setUser(null);
    setPerformance(null);
  };

  const refreshUser = useCallback(async () => {
    const me = await authService.me();
    setUser(me.data.user);
    setPerformance(me.data.performance);
    return me.data.user;
  }, []);

  const value = {
    user,
    performance,
    loading,
    isAuthenticated: !!user,
    token: getAccessToken(),
    login,
    register,
    logout,
    refreshUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

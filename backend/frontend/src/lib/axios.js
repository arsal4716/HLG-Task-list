import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';
const REFRESH_KEY = 'hlg-refresh';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Access token lives in memory; the refresh token is persisted in localStorage
// (plus an httpOnly cookie) so the session survives a full page reload.
let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token || null;
};
export const getAccessToken = () => accessToken;

export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
export const setRefreshToken = (token) => {
  if (token) localStorage.setItem(REFRESH_KEY, token);
};
export const clearTokens = () => {
  accessToken = null;
  localStorage.removeItem(REFRESH_KEY);
};

// Endpoints that legitimately return 401 (bad creds) or that we must never
// recurse into during a refresh attempt.
const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

/** Calls the refresh endpoint using the stored refresh token (cookie + body). */
export const requestRefresh = async () => {
  const { data } = await axios.post(
    `${baseURL}/auth/refresh`,
    { refreshToken: getRefreshToken() },
    { withCredentials: true }
  );
  const newAccess = data?.data?.accessToken;
  const newRefresh = data?.data?.refreshToken;
  setAccessToken(newAccess);
  if (newRefresh) setRefreshToken(newRefresh);
  return newAccess;
};

// Transparent refresh on 401. Queues concurrent requests while refreshing.
let isRefreshing = false;
let queue = [];
const processQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const skip = NO_REFRESH.some((u) => original?.url?.includes(u));

    if (status === 401 && !original._retry && !skip) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject })).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const newToken = await requestRefresh();
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearTokens();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

/** Extract a friendly message from an axios error. */
export const errMessage = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.message ||
  (Array.isArray(error?.response?.data?.details) ? error.response.data.details.join(', ') : null) ||
  error?.message ||
  fallback;

export default api;

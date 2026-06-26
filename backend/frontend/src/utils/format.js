import { format, formatDistanceToNow, isValid } from 'date-fns';

export const fmtDate = (d, pattern = 'MMM d, yyyy') => {
  if (!d) return '—';
  const date = new Date(d);
  return isValid(date) ? format(date, pattern) : '—';
};

export const fmtDateTime = (d) => fmtDate(d, 'MMM d, yyyy · h:mm a');

export const fromNow = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : '';
};

/** Seconds -> "1h 23m 45s" */
export const fmtDuration = (totalSeconds = 0) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h ? `${h}h` : null, m ? `${m}m` : null, `${sec}s`].filter(Boolean).join(' ');
};

/** Seconds -> "01:23:45" clock format */
export const fmtClock = (totalSeconds = 0) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export const fileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = (import.meta.env.VITE_SOCKET_URL || '').replace(/\/$/, '');
  return `${base}${url}`;
};

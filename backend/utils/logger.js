/* Minimal, dependency-free logger with levels and timestamps. */

const COLORS = {
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[90m',
  reset: '\x1b[0m',
};

const stamp = () => new Date().toISOString();

const write = (level, args) => {
  const color = COLORS[level] || '';
  const prefix = `${color}[${stamp()}] ${level.toUpperCase()}${COLORS.reset}`;
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](prefix, ...args);
};

export const logger = {
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') write('debug', args);
  },
};

export default logger;

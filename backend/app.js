import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';

import apiRoutes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS
  const origins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : true;
  app.use(cors({ origin: origins, credentials: true }));

  // Body parsing & cookies
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // Sanitize against NoSQL injection
  app.use(mongoSanitize());

  // Performance
  app.use(compression());

  // Logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // Rate limiting (API only)
  app.use('/api', globalLimiter);

  // Static uploads (local-storage fallback)
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // API
  app.use('/api', apiRoutes);

  app.get('/', (_req, res) =>
    res.json({ success: true, message: 'HLG Task Management API', docs: '/api/health' })
  );

  // 404 + error handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;

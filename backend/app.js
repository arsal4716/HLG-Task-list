import path from 'path';
import fs from 'fs';
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

  // Security headers.
  // CSP is disabled because its default `upgrade-insecure-requests` directive
  // rewrites every asset URL to https:// — which breaks plain-HTTP deployments
  // (e.g. http://<ip>:5000) where the browser then fails with
  // ERR_SSL_PROTOCOL_ERROR and renders a blank page. COOP / Origin-Agent-Cluster
  // are HTTPS-only features and are turned off for the same reason. Re-enable
  // these (set ENABLE_HTTPS_SECURITY=true) once the app is served over HTTPS.
  const httpsSecurity = process.env.ENABLE_HTTPS_SECURITY === 'true';
  app.use(
    helmet({
      contentSecurityPolicy: httpsSecurity, // off -> no `upgrade-insecure-requests`
      crossOriginOpenerPolicy: httpsSecurity,
      originAgentCluster: httpsSecurity,
      hsts: httpsSecurity, // never advertise HSTS on a plain-HTTP origin
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

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

  // Serve the built React SPA (frontend/dist) when present, so a single
  // `npm start` runs the whole app from one origin. Everything that isn't an
  // /api or /uploads request falls through to index.html for client routing.
  const clientDist = path.join(__dirname, 'frontend', 'dist');
  if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist));
    // Never cache index.html so security-header / build changes take effect on
    // the next reload (hashed /assets files are immutable and cached normally).
    app.get(/^(?!\/(api|uploads)\/).*/, (_req, res) => {
      res.set('Cache-Control', 'no-store');
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) =>
      res.json({ success: true, message: 'HLG Task Management API', docs: '/api/health' })
    );
  }

  // 404 (API) + error handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;

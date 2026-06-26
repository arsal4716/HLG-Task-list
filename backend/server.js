import 'dotenv/config';
import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './sockets/io.js';
import { startCronJobs } from './cron/index.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();

    const app = createApp();
    const server = http.createServer(app);

    initSocket(server);
    startCronJobs();

    server.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    const shutdown = (signal) => {
      logger.warn(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };
    ['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));

    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection: ${err.message}`);
    });
    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception: ${err.message}`, err.stack);
      process.exit(1);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

start();

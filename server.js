import { createServer } from 'node:http';
import { createApplication } from './src/app/create-application.js';
import { loadConfig } from './src/config/load-config.js';
import { createLogger } from './src/core/logger.js';

const config = loadConfig(process.env);
const logger = createLogger({ level: config.logLevel, service: 'summit-money-map' });
const application = await createApplication({ config, logger });
const server = createServer(application.handle);

server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;
server.requestTimeout = 30_000;

server.listen(config.port, config.host, () => {
  logger.info('server.started', {
    host: config.host,
    port: config.port,
    environment: config.environment,
    version: config.version
  });
});

const shutdown = async signal => {
  logger.info('server.shutdown_requested', { signal });
  const forceTimer = setTimeout(() => process.exit(1), 10_000);
  forceTimer.unref();
  server.close(async error => {
    try {
      await application.close();
    } finally {
      clearTimeout(forceTimer);
      if (error) {
        logger.error('server.shutdown_failed', { error });
        process.exit(1);
      }
      logger.info('server.stopped');
      process.exit(0);
    }
  });
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', error => {
  logger.error('process.unhandled_rejection', { error });
});

process.on('uncaughtException', error => {
  logger.fatal('process.uncaught_exception', { error });
  process.exit(1);
});

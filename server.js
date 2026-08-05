import { createServer } from 'node:http';
import { once } from 'node:events';
import { pathToFileURL } from 'node:url';
import { createApplication } from './src/app/create-application.js';
import { loadConfig } from './src/config/load-config.js';
import { createLogger } from './src/core/logger.js';
import { ShutdownCoordinator } from './src/core/shutdown-coordinator.js';
import { assertStartupReadiness, buildStartupDiagnostics } from './src/deployment/startup-diagnostics.js';

function isDirectExecution() {
  const entry = process.argv[1];
  return Boolean(entry) && import.meta.url === pathToFileURL(entry).href;
}


function isPlaceholderOrigin(value) {
  const origin = String(value || '').trim().replace(/\/$/, '');
  return !origin || /^https?:\/\/(?:www\.)?example\.com(?::\d+)?$/i.test(origin);
}

export function resolveRuntimeEnvironment(inputEnv = {}) {
  const env = { ...inputEnv };
  if (!isPlaceholderOrigin(env.PUBLIC_ORIGIN)) return env;

  const renderUrl = String(env.RENDER_EXTERNAL_URL || '').trim().replace(/\/$/, '');
  const renderHostname = String(env.RENDER_EXTERNAL_HOSTNAME || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '');
  const renderServiceName = String(env.RENDER_SERVICE_NAME || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (/^https:\/\/[^/]+$/i.test(renderUrl)) {
    env.PUBLIC_ORIGIN = renderUrl;
  } else if (renderHostname) {
    env.PUBLIC_ORIGIN = `https://${renderHostname}`;
  } else if (String(env.RENDER || '').toLowerCase() === 'true' && renderServiceName) {
    env.PUBLIC_ORIGIN = `https://${renderServiceName}.onrender.com`;
  }

  return env;
}

function closeHttpServer(server) {
  if (!server.listening) return Promise.resolve();
  server.close();
  return once(server, 'close').then(() => undefined);
}

export async function startMerlinServer(options = {}) {
  const env = resolveRuntimeEnvironment(options.env || process.env);
  const config = options.config || loadConfig(env);
  const logger = options.logger || createLogger({ level: config.logLevel, service: 'merlin' });
  const startupDiagnostics = buildStartupDiagnostics(config);
  assertStartupReadiness(startupDiagnostics);

  for (const warning of startupDiagnostics.warnings) {
    logger.warn('startup.warning', warning);
  }

  const application = await createApplication({ config, logger, startupDiagnostics });
  const server = createServer(application.handle);
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
  server.requestTimeout = config.requestTimeoutMs;

  const shutdown = new ShutdownCoordinator({ logger, taskTimeoutMs: 9_000 })
    .register('application', () => application.close())
    .register('http-server', () => closeHttpServer(server));

  const host = options.host || config.host;
  const port = options.port ?? config.port;
  server.listen(port, host);
  await once(server, 'listening');
  const address = server.address();

  logger.info('server.started', {
    host,
    port: typeof address === 'object' && address ? address.port : port,
    environment: config.environment,
    version: config.version,
    startupStatus: startupDiagnostics.status,
    configuredConnectors: startupDiagnostics.connectorSummary.configured
  });

  const stop = async reason => shutdown.shutdown(reason);

  if (options.attachProcessHandlers !== false) {
    const handleSignal = signal => {
      stop(signal).then(result => {
        process.exitCode = result.state === 'STOPPED' ? 0 : 1;
      }).catch(error => {
        logger.fatal('server.shutdown_failed', { signal, error });
        process.exitCode = 1;
      });
    };

    process.once('SIGINT', handleSignal);
    process.once('SIGTERM', handleSignal);
    process.on('unhandledRejection', error => logger.error('process.unhandled_rejection', { error }));
    process.on('uncaughtException', error => {
      logger.fatal('process.uncaught_exception', { error });
      process.exitCode = 1;
      stop('uncaughtException').catch(() => {});
    });
  }

  return Object.freeze({ server, application, config, logger, startupDiagnostics, shutdown, stop });
}

if (isDirectExecution()) {
  startMerlinServer().catch(error => {
    const logger = createLogger({ level: process.env.LOG_LEVEL || 'info', service: 'merlin-bootstrap' });
    logger.fatal('server.startup_failed', { error, diagnostics: error?.diagnostics });
    process.exitCode = 1;
  });
}

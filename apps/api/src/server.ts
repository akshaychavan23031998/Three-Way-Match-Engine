import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

let isShuttingDown = false;

const formatFatalError = (error: unknown): string => {
  if (!(error instanceof Error)) return 'Unknown fatal error';
  const raw = env.NODE_ENV === 'production' ? error.message : (error.stack ?? error.message);
  return [env.GEMINI_API_KEY, env.STATIC_AUTH_TOKEN, env.MONGODB_URI]
    .filter(Boolean)
    .reduce((sanitized, secret) => sanitized.replaceAll(secret, '[REDACTED]'), raw);
};

const start = async (): Promise<void> => {
  await connectDatabase();
  const server = app.listen(env.PORT, () => {
    console.info(`API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: NodeJS.Signals): void => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.info(`${signal} received; shutting down`);

    server.close((closeError) => {
      void disconnectDatabase()
        .then(() => {
          if (closeError) throw closeError;
          console.info('API shutdown complete');
          process.exit(0);
        })
        .catch((error: unknown) => {
          console.error(`Shutdown failed: ${formatFatalError(error)}`);
          process.exit(1);
        });
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
};

void start().catch((error: unknown) => {
  console.error(`Failed to start API: ${formatFatalError(error)}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error(`Unhandled rejection: ${formatFatalError(reason)}`);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  console.error(`Uncaught exception: ${formatFatalError(error)}`);
  process.exit(1);
});

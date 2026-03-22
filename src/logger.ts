import pino from 'pino';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
  level: process.env.LOG_LEVEL || 'info',
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.fatal({ err }, 'Unhandled rejection');
  process.exit(1);
});

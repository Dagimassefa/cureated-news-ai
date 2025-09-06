const cron = require('node-cron');
const logger = require('./utils/logger');
const { validateEnv } = require('./utils/validation');
const NewsCurateJob = require('./jobs/news-curate');
const config = require('./config');

if (!validateEnv()) {
  logger.warn('Some required environment variables are missing. The application may not function correctly.');
}

const newsCurateJob = new NewsCurateJob();

if (config.cron.schedule) {
  logger.info(`Scheduling NewsCurate job with cron: ${config.cron.schedule}`);
  
  cron.schedule(config.cron.schedule, async () => {
    logger.info('Running scheduled NewsCurate job');
    await newsCurateJob.run();
  });
  
  if (config.app.env === 'development') {
    logger.info('Running NewsCurate job immediately (development mode)');
    newsCurateJob.run();
  }
} else {
  logger.info('No cron schedule configured. Running NewsCurate job once.');
  newsCurateJob.run();
}

cron.schedule('0 * * * *', () => {
  newsCurateJob.cleanupCache();
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT. Shutting down gracefully.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down gracefully.');
  process.exit(0);
});

module.exports = {
  newsCurateJob,
  healthCheck: () => newsCurateJob.healthCheck()
};
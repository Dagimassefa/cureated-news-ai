const { createLogger, format, transports } = require('winston');
const config = require('../config');

const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
});

const logger = createLogger({
  level: config.app.logLevel.toLowerCase(),
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        logFormat
      )
    }),
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: combine(
        timestamp(),
        logFormat
      )
    }),
    new transports.File({ 
      filename: 'logs/combined.log',
      format: combine(
        timestamp(),
        logFormat
      )
    })
  ],
});

module.exports = logger;
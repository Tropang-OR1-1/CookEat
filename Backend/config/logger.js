// utils/logger.js

const winston = require('winston');

// Create and configure the logger
const logger = winston.createLogger({
  level: 'info', // Minimum log level (you can change this)
  format: winston.format.combine(
    winston.format.timestamp(),  // Add a timestamp to each log
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(), // Log to the console
    new winston.transports.File({ filename: 'app.log' }) // Log to a file
  ]
});

// Export the logger to use in other files
module.exports = logger;

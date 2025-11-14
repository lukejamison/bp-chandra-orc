import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      ),
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add assertion helper with logging
export function assert(condition: boolean, message: string, metadata?: Record<string, any>): asserts condition {
  if (!condition) {
    logger.error(`Assertion failed: ${message}`, metadata);
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Add debug assertion that only runs in development
export function debugAssert(condition: boolean, message: string, metadata?: Record<string, any>): asserts condition {
  if (process.env.NODE_ENV === 'development' && !condition) {
    logger.warn(`Debug assertion failed: ${message}`, metadata);
    throw new Error(`Debug assertion failed: ${message}`);
  }
}

export default logger;


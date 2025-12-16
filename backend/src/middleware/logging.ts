import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { logger, morganStream } from '../utils/logger';

/**
 * HTTP request logging middleware using Morgan
 */
export const httpLogger = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms',
  {
    stream: morganStream,
    skip: (req: Request) => {
      // Skip logging for health check endpoints in production
      if (process.env.NODE_ENV === 'production' && req.url === '/health') {
        return true;
      }
      return false;
    },
  }
);

/**
 * Request ID middleware
 * Adds unique request ID to each request for tracing
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

/**
 * Request context logging middleware
 * Logs request details for debugging
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log request start
  logger.info(`Request started: ${req.method} ${req.url}`, {
    requestId: req.headers['x-request-id'],
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    userId: req.user?.id,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = Date.now() - startTime;
    
    logger.info(`Request completed: ${req.method} ${req.url}`, {
      requestId: req.headers['x-request-id'],
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
    });

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Error logging middleware
 * Logs detailed error information
 */
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Request error occurred', {
    requestId: req.headers['x-request-id'],
    method: req.method,
    url: req.url,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    userId: req.user?.id,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  next(error);
};
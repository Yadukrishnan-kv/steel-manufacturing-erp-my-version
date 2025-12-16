import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    if (details) {
      this.details = details;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle Prisma database errors
 */
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      return new AppError(
        'A record with this information already exists',
        409,
        'DUPLICATE_RECORD',
        true,
        { field: error.meta?.target }
      );
    
    case 'P2025':
      return new AppError(
        'Record not found',
        404,
        'RECORD_NOT_FOUND',
        true
      );
    
    case 'P2003':
      return new AppError(
        'Foreign key constraint violation',
        400,
        'FOREIGN_KEY_CONSTRAINT',
        true,
        { field: error.meta?.field_name }
      );
    
    case 'P2014':
      return new AppError(
        'Invalid data provided',
        400,
        'INVALID_DATA',
        true
      );
    
    default:
      return new AppError(
        'Database operation failed',
        500,
        'DATABASE_ERROR',
        true,
        { prismaCode: error.code }
      );
  }
};

/**
 * Handle validation errors
 */
const handleValidationError = (error: Error): AppError => {
  return new AppError(
    'Validation failed',
    400,
    'VALIDATION_ERROR',
    true,
    { originalMessage: error.message }
  );
};

/**
 * Send error response
 */
const sendErrorResponse = (res: Response, error: AppError, requestId?: string): void => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
      ...(error.details && { details: error.details }),
    },
  };

  res.status(error.statusCode).json(errorResponse);
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string;

  let appError: AppError;

  // Handle known error types
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    appError = handleValidationError(error);
  } else if (error.name === 'ValidationError') {
    appError = handleValidationError(error);
  } else {
    // Unknown error
    appError = new AppError(
      process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      500,
      'INTERNAL_SERVER_ERROR',
      false
    );
  }

  // Log error details
  if (!appError.isOperational || appError.statusCode >= 500) {
    logger.error('Unhandled error:', {
      requestId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        user: req.user,
      },
    });
  } else {
    logger.warn('Operational error:', {
      requestId,
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
    });
  }

  // Send error response
  sendErrorResponse(res, appError, requestId);
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const requestId = req.headers['x-request-id'] as string;
  
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    },
  };

  res.status(404).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
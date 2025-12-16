import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../database/connection';
import { asyncHandler } from '../middleware/error';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Basic health check endpoint
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
    },
  };

  res.json({
    success: true,
    data: healthData,
  });
}));

/**
 * Detailed health check with database connectivity
 */
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  // Check database connection
  const isDatabaseHealthy = await checkDatabaseConnection();
  const dbResponseTime = Date.now() - startTime;

  const healthData = {
    status: isDatabaseHealthy ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: {
        status: isDatabaseHealthy ? 'UP' : 'DOWN',
        responseTime: `${dbResponseTime}ms`,
      },
    },
    system: {
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
      },
      cpu: {
        loadAverage: 'N/A', // Not available on Windows
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    },
  };

  const statusCode = isDatabaseHealthy ? 200 : 503;
  
  if (!isDatabaseHealthy) {
    logger.warn('Health check failed - database connection issue');
  }

  res.status(statusCode).json({
    success: isDatabaseHealthy,
    data: healthData,
  });
}));

/**
 * Readiness probe for Kubernetes/Docker
 */
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  const isDatabaseHealthy = await checkDatabaseConnection();
  
  if (isDatabaseHealthy) {
    res.json({
      success: true,
      status: 'READY',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      success: false,
      status: 'NOT_READY',
      reason: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * Liveness probe for Kubernetes/Docker
 */
router.get('/live', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'ALIVE',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export { router as healthRoutes };
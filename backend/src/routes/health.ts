import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../database/connection';
import { asyncHandler } from '../middleware/error';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: OK
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                       description: Server uptime in seconds
 *                     environment:
 *                       type: string
 *                       example: development
 *                     version:
 *                       type: string
 *                       example: 1.0.0
 *                     memory:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: number
 *                           description: Used heap memory in MB
 *                         total:
 *                           type: number
 *                           description: Total heap memory in MB
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
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check with database connectivity
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: All services healthy
 *       503:
 *         description: One or more services unhealthy
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
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe for Kubernetes/Docker
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is ready to accept traffic
 *       503:
 *         description: Service is not ready
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
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe for Kubernetes/Docker
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is alive
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
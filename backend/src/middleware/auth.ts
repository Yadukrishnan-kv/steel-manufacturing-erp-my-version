import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/connection';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../auth/jwt';
import { logger } from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: string[];
        sessionId: string;
        accessibleBranches?: string[];
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Verify token
    const payload: JWTPayload = verifyToken(token);

    // Check if session exists and is valid
    const session = await prisma.userSession.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Session expired or invalid',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if user is active
    if (!session.user.isActive) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User account is inactive',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: session.user.id,
      email: session.user.email,
      roles: session.user.roles.map(ur => ur.role.name),
      sessionId: session.id,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error instanceof Error ? error.message : 'Authentication failed',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Authorization middleware
 * Checks if user has required roles or permissions using RBAC service
 */
export const authorize = (
  module: string,
  action: string,
  resource?: string,
  options: {
    requireBranchAccess?: boolean;
    allowSuperAdmin?: boolean;
  } = {}
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Import RBAC service dynamically to avoid circular dependency
      const { RBACService } = await import('../services/rbac.service');

      // Extract branch ID from request (query, params, or body)
      const branchId = req.query.branchId as string || 
                      req.params.branchId as string || 
                      req.body.branchId as string;

      // Check permission using RBAC service
      const permissionContext: any = {
        userId: req.user.id,
        module,
        action
      };
      
      if (resource) {
        permissionContext.resource = resource;
      }
      
      if (options.requireBranchAccess && branchId) {
        permissionContext.branchId = branchId;
      }
      
      const hasPermission = await RBACService.hasPermission(permissionContext);

      if (!hasPermission) {
        // Check if user is super admin (if allowed)
        if (options.allowSuperAdmin !== false) {
          const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');
          if (isSuperAdmin) {
            next();
            return;
          }
        }

        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions for this operation',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Add accessible branches to request for data filtering
      const accessibleBranches = await RBACService.getUserAccessibleBranches(req.user.id);
      req.user.accessibleBranches = accessibleBranches;

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Authorization check failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Legacy authorization middleware for backward compatibility
 * Checks if user has required roles
 */
export const authorizeRoles = (requiredRoles: string[] = []) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Check roles
      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => req.user!.roles.includes(role));
        
        if (!hasRequiredRole) {
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient role permissions',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Authorization check failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is provided, but doesn't require it
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const payload: JWTPayload = verifyToken(token);
      
      const session = await prisma.userSession.findUnique({
        where: { id: payload.sessionId },
        include: {
          user: {
            include: {
              roles: {
                include: {
                  role: true,
                },
              },
            },
          },
        },
      });

      if (session && session.expiresAt >= new Date() && session.user.isActive) {
        req.user = {
          id: session.user.id,
          email: session.user.email,
          roles: session.user.roles.map(ur => ur.role.name),
          sessionId: session.id,
        };
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors
    logger.debug('Optional auth failed:', error);
    next();
  }
};
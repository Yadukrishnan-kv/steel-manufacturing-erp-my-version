import { Request, Response, NextFunction } from 'express';
import { RBACService } from '../services/rbac.service';
import { logger } from '../utils/logger';

/**
 * Data isolation middleware
 * Applies branch-level data filtering based on user access
 */
export const applyDataIsolation = (tableName: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next();
        return;
      }

      // Create branch filter for the user
      const branchFilter = await RBACService.createBranchFilter(req.user.id, tableName);
      
      // Add filter to request for use in controllers
      req.dataFilter = {
        ...req.dataFilter,
        ...branchFilter
      };

      next();
    } catch (error) {
      logger.error('Data isolation error:', error);
      next(); // Continue without filter on error
    }
  };
};

/**
 * Validate branch access middleware
 * Ensures user has access to the specified branch
 */
export const validateBranchAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // Extract branch ID from request
    const branchId = req.params.branchId || req.body.branchId || req.query.branchId;
    
    if (!branchId) {
      next();
      return;
    }

    // Check if user has access to this branch
    const accessibleBranches = await RBACService.getUserAccessibleBranches(req.user.id);
    
    if (!accessibleBranches.includes(branchId)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to this branch',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Branch access validation error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Branch access validation failed',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Department-level access control middleware
 * Restricts access based on employee department
 */
export const validateDepartmentAccess = (allowedDepartments: string[]) => {
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

      // Super admin bypass
      if (req.user.roles.includes('SUPER_ADMIN')) {
        next();
        return;
      }

      // Get user's employee record to check department
      const { prisma } = await import('../database/connection');
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          employee: {
            select: {
              department: true
            }
          }
        }
      });

      if (!user?.employee) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Employee record required for department access',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (!allowedDepartments.includes(user.employee.department)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied for this department',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Department access validation error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Department access validation failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Resource ownership validation middleware
 * Ensures user can only access resources they own or have permission to
 */
export const validateResourceOwnership = (
  resourceIdParam: string,
  ownershipField: string = 'createdBy'
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

      // Super admin and managers bypass ownership check
      const bypassRoles = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'PRODUCTION_MANAGER', 
                          'SALES_MANAGER', 'INVENTORY_MANAGER', 'PROCUREMENT_MANAGER',
                          'QC_MANAGER', 'SERVICE_MANAGER', 'FINANCE_MANAGER', 'HR_MANAGER'];
      
      const hasBypassRole = req.user.roles.some(role => bypassRoles.includes(role));
      if (hasBypassRole) {
        next();
        return;
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        next();
        return;
      }

      // Add ownership filter to request
      req.dataFilter = {
        ...req.dataFilter,
        [ownershipField]: req.user.id
      };

      next();
    } catch (error) {
      logger.error('Resource ownership validation error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Resource ownership validation failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

// Extend Express Request interface to include data filter
declare global {
  namespace Express {
    interface Request {
      dataFilter?: Record<string, any>;
    }
  }
}
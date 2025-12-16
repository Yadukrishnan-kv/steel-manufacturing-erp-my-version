import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database/connection';
import { authenticate, authorize, authorizeRoles } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { asyncHandler, AppError } from '../middleware/error';
import { RBACService } from '../services/rbac.service';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const assignRoleSchema = {
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    roleId: z.string().uuid('Invalid role ID'),
    branchId: z.string().uuid('Invalid branch ID').optional(),
  }),
};

const removeRoleSchema = {
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    roleId: z.string().uuid('Invalid role ID'),
    branchId: z.string().uuid('Invalid branch ID').optional(),
  }),
};

const createRoleSchema = {
  body: z.object({
    name: z.string().min(1, 'Role name is required').max(100, 'Role name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  }),
};

const updateRoleSchema = {
  body: z.object({
    name: z.string().min(1, 'Role name is required').max(100, 'Role name too long').optional(),
    description: z.string().max(500, 'Description too long').optional(),
    permissions: z.array(z.string()).optional(),
  }),
};

/**
 * Initialize predefined roles and permissions
 */
router.post('/initialize', 
  authenticate, 
  authorizeRoles(['SUPER_ADMIN']), 
  asyncHandler(async (req: Request, res: Response) => {
    await RBACService.initializePredefinedRoles();

    logger.info('RBAC system initialized', {
      userId: req.user!.id,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'RBAC system initialized successfully',
    });
  })
);

/**
 * Get all roles
 */
router.get('/roles', 
  authenticate, 
  authorize('RBAC', 'READ', 'ROLES'),
  asyncHandler(async (req: Request, res: Response) => {
    const roles = await RBACService.getAllRoles();

    res.json({
      success: true,
      data: { roles },
    });
  })
);

/**
 * Create new role
 */
router.post('/roles', 
  authenticate, 
  authorize('RBAC', 'CREATE', 'ROLES'),
  validate(createRoleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, permissions } = req.body;

    const role = await RBACService.createOrUpdateRole({
      name,
      description,
      permissions
    });

    logger.info('Role created', {
      roleId: role.id,
      roleName: role.name,
      createdBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: { role },
    });
  })
);

/**
 * Update role
 */
router.put('/roles/:roleId', 
  authenticate, 
  authorize('RBAC', 'UPDATE', 'ROLES'),
  validate(updateRoleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { roleId } = req.params;
    const { name, description, permissions } = req.body;

    // Get existing role
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId as string }
    });

    if (!existingRole) {
      throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
    }

    // Update role
    const updatedRole = await RBACService.createOrUpdateRole({
      name: name || existingRole.name,
      description: description !== undefined ? description : existingRole.description,
      permissions: permissions || []
    });

    logger.info('Role updated', {
      roleId: updatedRole.id,
      roleName: updatedRole.name,
      updatedBy: req.user!.id
    });

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: { role: updatedRole },
    });
  })
);

/**
 * Delete role
 */
router.delete('/roles/:roleId', 
  authenticate, 
  authorize('RBAC', 'DELETE', 'ROLES'),
  asyncHandler(async (req: Request, res: Response) => {
    const { roleId } = req.params;

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId as string }
    });

    if (!role) {
      throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
    }

    // Check if role is in use
    const roleInUse = await prisma.userRole.findFirst({
      where: { roleId: roleId as string, isActive: true }
    });

    if (roleInUse) {
      throw new AppError(
        'Cannot delete role that is assigned to users',
        400,
        'ROLE_IN_USE'
      );
    }

    // Soft delete role
    await prisma.role.update({
      where: { id: roleId as string },
      data: { isActive: false }
    });

    logger.info('Role deleted', {
      roleId,
      roleName: role.name,
      deletedBy: req.user!.id
    });

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  })
);

/**
 * Get all permissions
 */
router.get('/permissions', 
  authenticate, 
  authorize('RBAC', 'READ', 'PERMISSIONS'),
  asyncHandler(async (req: Request, res: Response) => {
    const permissions = await RBACService.getAllPermissions();

    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module]!.push(permission);
      return acc;
    }, {} as Record<string, typeof permissions>);

    res.json({
      success: true,
      data: { 
        permissions,
        groupedPermissions 
      },
    });
  })
);

/**
 * Get users with roles
 */
router.get('/users', 
  authenticate, 
  authorize('RBAC', 'READ', 'USERS'),
  asyncHandler(async (req: Request, res: Response) => {
    const { branchId } = req.query;

    const users = await RBACService.getUsersWithRoles(branchId as string);

    res.json({
      success: true,
      data: { users },
    });
  })
);

/**
 * Assign role to user
 */
router.post('/users/assign-role', 
  authenticate, 
  authorize('RBAC', 'CREATE', 'USER_ROLES'),
  validate(assignRoleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, roleId, branchId } = req.body;

    const userRole = await RBACService.assignRoleToUser({
      userId,
      roleId,
      branchId
    });

    logger.info('Role assigned to user', {
      userId,
      roleId,
      branchId,
      assignedBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      message: 'Role assigned successfully',
      data: { userRole },
    });
  })
);

/**
 * Remove role from user
 */
router.post('/users/remove-role', 
  authenticate, 
  authorize('RBAC', 'DELETE', 'USER_ROLES'),
  validate(removeRoleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, roleId, branchId } = req.body;

    await RBACService.removeRoleFromUser(userId, roleId, branchId);

    logger.info('Role removed from user', {
      userId,
      roleId,
      branchId,
      removedBy: req.user!.id
    });

    res.json({
      success: true,
      message: 'Role removed successfully',
    });
  })
);

/**
 * Get user permissions
 */
router.get('/users/:userId/permissions', 
  authenticate, 
  authorize('RBAC', 'READ', 'USER_PERMISSIONS'),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { branchId } = req.query;

    const userPermissions = await RBACService.getUserPermissions(
      userId as string, 
      branchId as string
    );

    res.json({
      success: true,
      data: userPermissions,
    });
  })
);

/**
 * Check user permission
 */
router.post('/users/:userId/check-permission', 
  authenticate, 
  authorize('RBAC', 'READ', 'USER_PERMISSIONS'),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { module, action, resource, branchId } = req.body;

    const permissionContext: any = {
      userId: userId as string,
      module,
      action
    };
    
    if (resource) {
      permissionContext.resource = resource;
    }
    
    if (branchId) {
      permissionContext.branchId = branchId;
    }
    
    const hasPermission = await RBACService.hasPermission(permissionContext);

    res.json({
      success: true,
      data: { hasPermission },
    });
  })
);

/**
 * Get current user permissions
 */
router.get('/me/permissions', 
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { branchId } = req.query;

    const userPermissions = await RBACService.getUserPermissions(
      req.user!.id, 
      branchId as string
    );

    res.json({
      success: true,
      data: userPermissions,
    });
  })
);

/**
 * Get accessible branches for current user
 */
router.get('/me/branches', 
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const accessibleBranchIds = await RBACService.getUserAccessibleBranches(req.user!.id);
    
    // Get branch details
    const branches = await prisma.branch.findMany({
      where: {
        id: { in: accessibleBranchIds },
        isActive: true
      },
      select: {
        id: true,
        code: true,
        name: true,
        city: true,
        state: true
      }
    });

    res.json({
      success: true,
      data: { branches },
    });
  })
);

export { router as rbacRoutes };
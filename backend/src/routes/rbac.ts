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
 * @swagger
 * /rbac/initialize:
 *   post:
 *     summary: Initialize predefined roles and permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: RBAC system initialized successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
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
 * @swagger
 * /rbac/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /rbac/roles:
 *   post:
 *     summary: Create new role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /rbac/roles/{roleId}:
 *   put:
 *     summary: Update role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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
 * @swagger
 * /rbac/roles/{roleId}:
 *   delete:
 *     summary: Delete role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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
 * @swagger
 * /rbac/permissions:
 *   get:
 *     summary: Get all permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /rbac/users:
 *   get:
 *     summary: Get users with roles
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Users with roles retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /rbac/users/assign-role:
 *   post:
 *     summary: Assign role to user
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - roleId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               roleId:
 *                 type: string
 *                 format: uuid
 *               branchId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Role assigned successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /rbac/users/remove-role:
 *   post:
 *     summary: Remove role from user
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - roleId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               roleId:
 *                 type: string
 *                 format: uuid
 *               branchId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Role removed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /rbac/users/{userId}/permissions:
 *   get:
 *     summary: Get user permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /rbac/users/{userId}/check-permission:
 *   post:
 *     summary: Check user permission
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - module
 *               - action
 *             properties:
 *               module:
 *                 type: string
 *               action:
 *                 type: string
 *               resource:
 *                 type: string
 *               branchId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Permission check result
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /rbac/me/permissions:
 *   get:
 *     summary: Get current user permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Current user permissions retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /rbac/me/branches:
 *   get:
 *     summary: Get accessible branches for current user
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Accessible branches retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
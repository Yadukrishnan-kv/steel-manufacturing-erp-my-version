// Admin Routes - API endpoints for system administration
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createBranchSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().min(6).max(10),
  phone: z.string().min(10).max(15),
  email: z.string().email(),
  gstNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateBranchSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).max(500).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  pincode: z.string().min(6).max(10).optional(),
  phone: z.string().min(10).max(15).optional(),
  email: z.string().email().optional(),
  gstNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Branch Management Routes

/**
 * @swagger
 * /admin/branches:
 *   post:
 *     summary: Create a new branch
 *     description: Create a new branch (Super Admin only)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, address, city, state, pincode, phone, email]
 *             properties:
 *               code:
 *                 type: string
 *                 maxLength: 20
 *                 description: Unique branch code
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Branch name
 *               address:
 *                 type: string
 *                 maxLength: 500
 *                 description: Branch address
 *               city:
 *                 type: string
 *                 maxLength: 100
 *               state:
 *                 type: string
 *                 maxLength: 100
 *               pincode:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 10
 *               phone:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 15
 *               email:
 *                 type: string
 *                 format: email
 *               gstNumber:
 *                 type: string
 *                 description: GST registration number
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Branch created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Branch'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/branches',
  authenticate,
  authorizeRoles(['SUPER_ADMIN', 'BRANCH_MANAGER']),
  validate({ body: createBranchSchema }),
  async (req, res) => {
    try {
      console.log('Creating branch with data:', req.body);
      console.log('User:', req.user);
      
      // Check if branch code already exists
      const existingBranch = await prisma.branch.findUnique({
        where: { code: req.body.code },
      });

      if (existingBranch) {
        console.log('Branch code already exists:', req.body.code);
        return res.status(400).json({
          success: false,
          error: {
            code: 'BRANCH_CODE_EXISTS',
            message: 'Branch code already exists',
          },
        });
      }

      const branch = await prisma.branch.create({
        data: {
          ...req.body,
          isActive: req.body.isActive ?? true,
        },
      });

      console.log('Branch created successfully:', branch);

      logger.info('Branch created successfully', {
        branchId: branch.id,
        branchCode: branch.code,
        userId: req.user?.id,
      });

      res.status(201).json({
        success: true,
        data: branch,
        message: 'Branch created successfully',
      });
    } catch (error) {
      console.error('Error creating branch:', error);
      logger.error('Error creating branch:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'BRANCH_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create branch',
        },
      });
    }
  }
);

/**
 * @swagger
 * /admin/branches:
 *   get:
 *     summary: Get all branches
 *     description: Retrieve branches with filtering, search, and pagination
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, code, city, or state
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of branches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Branch'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/branches',
  authenticate,
  authorizeRoles(['SUPER_ADMIN', 'BRANCH_MANAGER']),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search, state, isActive } = req.query;
      
      const whereClause: any = {};
      
      if (search) {
        whereClause.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { code: { contains: search as string, mode: 'insensitive' } },
          { city: { contains: search as string, mode: 'insensitive' } },
          { state: { contains: search as string, mode: 'insensitive' } },
        ];
      }
      
      if (state) {
        whereClause.state = state as string;
      }
      
      if (isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const [branches, total] = await Promise.all([
        prisma.branch.findMany({
          where: whereClause,
          include: {
            _count: {
              select: {
                warehouses: true,
                employees: true,
                customers: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: Number(limit),
        }),
        prisma.branch.count({ where: whereClause }),
      ]);

      res.json({
        success: true,
        data: branches,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error getting branches:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BRANCHES_FETCH_FAILED',
          message: 'Failed to fetch branches',
        },
      });
    }
  }
);

/**
 * @swagger
 * /admin/branches/{id}:
 *   get:
 *     summary: Get branch by ID
 *     description: Get branch details with related counts
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Branch'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/branches/:id',
  authenticate,
  authorizeRoles(['SUPER_ADMIN', 'BRANCH_MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Branch ID is required',
          },
        });
      }
      
      const branch = await prisma.branch.findUnique({
        where: { id },
        include: {
          warehouses: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              employees: true,
              customers: true,
            },
          },
        },
      });

      if (!branch) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BRANCH_NOT_FOUND',
            message: 'Branch not found',
          },
        });
      }

      res.json({
        success: true,
        data: branch,
      });
    } catch (error) {
      logger.error('Error getting branch:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BRANCH_FETCH_FAILED',
          message: 'Failed to fetch branch',
        },
      });
    }
  }
);

/**
 * @swagger
 * /admin/branches/{id}:
 *   put:
 *     summary: Update branch
 *     description: Update branch details (Super Admin only)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Branch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 maxLength: 20
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               address:
 *                 type: string
 *                 maxLength: 500
 *               city:
 *                 type: string
 *                 maxLength: 100
 *               state:
 *                 type: string
 *                 maxLength: 100
 *               pincode:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 10
 *               phone:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 15
 *               email:
 *                 type: string
 *                 format: email
 *               gstNumber:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Branch updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Branch'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/branches/:id',
  authenticate,
  authorizeRoles(['SUPER_ADMIN', 'BRANCH_MANAGER']),
  validate({ body: updateBranchSchema }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Branch ID is required',
          },
        });
      }
      
      // Check if branch exists
      const existingBranch = await prisma.branch.findUnique({
        where: { id },
      });

      if (!existingBranch) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BRANCH_NOT_FOUND',
            message: 'Branch not found',
          },
        });
      }

      // Check if code is being updated and already exists
      if (req.body.code && req.body.code !== existingBranch.code) {
        const codeExists = await prisma.branch.findUnique({
          where: { code: req.body.code },
        });

        if (codeExists) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'BRANCH_CODE_EXISTS',
              message: 'Branch code already exists',
            },
          });
        }
      }

      const branch = await prisma.branch.update({
        where: { id },
        data: req.body,
      });

      logger.info('Branch updated successfully', {
        branchId: branch.id,
        branchCode: branch.code,
        userId: req.user?.id,
      });

      res.json({
        success: true,
        data: branch,
        message: 'Branch updated successfully',
      });
    } catch (error) {
      logger.error('Error updating branch:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'BRANCH_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update branch',
        },
      });
    }
  }
);

/**
 * @swagger
 * /admin/branches/{id}:
 *   delete:
 *     summary: Delete branch
 *     description: Soft delete a branch (Super Admin only)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/branches/:id',
  authenticate,
  authorizeRoles(['SUPER_ADMIN', 'BRANCH_MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Branch ID is required',
          },
        });
      }
      
      // Check if branch exists
      const existingBranch = await prisma.branch.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              employees: true,
              customers: true,
            },
          },
        },
      });

      if (!existingBranch) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BRANCH_NOT_FOUND',
            message: 'Branch not found',
          },
        });
      }

      // Check if branch has related data
      const hasRelatedData = existingBranch._count.employees > 0 || 
                           existingBranch._count.customers > 0;

      if (hasRelatedData) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BRANCH_HAS_DEPENDENCIES',
            message: 'Cannot delete branch with existing employees, customers, or orders. Deactivate instead.',
          },
        });
      }

      // Soft delete by setting isActive to false
      await prisma.branch.update({
        where: { id },
        data: { isActive: false },
      });

      logger.info('Branch deleted successfully', {
        branchId: id,
        branchCode: existingBranch.code,
        userId: req.user?.id,
      });

      res.json({
        success: true,
        message: 'Branch deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting branch:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'BRANCH_DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete branch',
        },
      });
    }
  }
);

export { router as adminRoutes };
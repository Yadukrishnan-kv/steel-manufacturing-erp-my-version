// Employee Portal Routes - Self-service API endpoints for employees
import { Router, Request, Response } from 'express';
import { employeePortalService } from '../services/employeePortal.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { requirePermission } from '../utils/rbac';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { prisma } from '../database/connection';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/employee-documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const profileUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().transform(str => new Date(str)).optional()
});

const leaveRequestSchema = z.object({
  leaveType: z.enum(['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'COMPENSATORY']),
  fromDate: z.string().transform(str => new Date(str)),
  toDate: z.string().transform(str => new Date(str)),
  reason: z.string().min(1, 'Reason is required')
});

const selfAssessmentSchema = z.object({
  reviewId: z.string().uuid('Invalid review ID'),
  responses: z.record(z.any()),
  selfRatings: z.record(z.number().min(1).max(5)),
  comments: z.string().optional()
});

const notificationCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'ERROR']).default('INFO'),
  targetEmployees: z.array(z.string().uuid()).optional(),
  targetDepartments: z.array(z.string()).optional(),
  targetBranches: z.array(z.string().uuid()).optional(),
  expiresAt: z.string().transform(str => new Date(str)).optional()
});

// ============================================================================
// DASHBOARD AND PROFILE ROUTES
// ============================================================================

/**
 * @swagger
 * /employee-portal/dashboard:
 *   get:
 *     summary: Get employee dashboard
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/dashboard',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'READ', 'DASHBOARD');
      
      // Get employee ID from user session
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const dashboard = await employeePortalService.getEmployeeDashboard(user.employee.id);
      
      res.json({
        success: true,
        data: dashboard
      });
    } catch (error: any) {
      logger.error('Error getting employee dashboard:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get dashboard'
      });
    }
  }
);

/**
 * @swagger
 * /employee-portal/profile:
 *   get:
 *     summary: Get employee profile
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update employee profile
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/profile',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'READ', 'PROFILE');
      
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const profile = await employeePortalService.getEmployeeProfile(user.employee.id);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      logger.error('Error getting employee profile:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Profile not found'
      });
    }
  }
);

/**
 * Update employee profile
 * PUT /api/v1/employee-portal/profile
 */
router.put('/profile',
  authenticate,
  validate({ body: profileUpdateSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'UPDATE', 'PROFILE');
      
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const updatedProfile = await employeePortalService.updateEmployeeProfile(
        user.employee.id, 
        req.body
      );
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      });
    } catch (error: any) {
      logger.error('Error updating employee profile:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  }
);

// ============================================================================
// ATTENDANCE ROUTES
// ============================================================================

/**
 * @swagger
 * /employee-portal/attendance/current-month:
 *   get:
 *     summary: Get current month attendance
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance data retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/attendance/current-month',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'READ', 'ATTENDANCE');
      
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const attendance = await employeePortalService.getCurrentMonthAttendance(user.employee.id);
      
      res.json({
        success: true,
        data: attendance
      });
    } catch (error: any) {
      logger.error('Error getting current month attendance:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get attendance'
      });
    }
  }
);

/**
 * @swagger
 * /employee-portal/attendance/history:
 *   get:
 *     summary: Get attendance history
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Attendance history retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/attendance/history',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'READ', 'ATTENDANCE');
      
      const fromDate = new Date(req.query.fromDate as string);
      const toDate = new Date(req.query.toDate as string);
      
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD format.'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const attendance = await employeePortalService.getEmployeeAttendanceHistory(
        user.employee.id, 
        fromDate, 
        toDate
      );
      
      res.json({
        success: true,
        data: attendance
      });
    } catch (error: any) {
      logger.error('Error getting attendance history:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get attendance history'
      });
    }
  }
);

// ============================================================================
// LEAVE MANAGEMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /employee-portal/leave/requests:
 *   post:
 *     summary: Submit leave request
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leaveType
 *               - fromDate
 *               - toDate
 *               - reason
 *             properties:
 *               leaveType:
 *                 type: string
 *                 enum: [CASUAL, SICK, EARNED, MATERNITY, PATERNITY, COMPENSATORY]
 *               fromDate:
 *                 type: string
 *                 format: date
 *               toDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Leave request submitted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   get:
 *     summary: Get leave requests history
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Leave requests retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/leave/requests',
  authenticate,
  validate({ body: leaveRequestSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'CREATE', 'LEAVE_REQUEST');
      
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const leaveRequest = await employeePortalService.submitLeaveRequest(
        user.employee.id, 
        req.body
      );
      
      res.status(201).json({
        success: true,
        message: 'Leave request submitted successfully',
        data: leaveRequest
      });
    } catch (error: any) {
      logger.error('Error submitting leave request:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to submit leave request'
      });
    }
  }
);

/**
 * Get leave requests history
 * GET /api/v1/employee-portal/leave/requests
 */
router.get('/leave/requests',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'READ', 'LEAVE_REQUEST');
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const leaveRequests = await employeePortalService.getEmployeeLeaveRequests(
        user.employee.id, 
        page, 
        limit
      );
      
      res.json({
        success: true,
        data: leaveRequests
      });
    } catch (error: any) {
      logger.error('Error getting leave requests:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get leave requests'
      });
    }
  }
);

/**
 * @swagger
 * /employee-portal/leave/balance:
 *   get:
 *     summary: Get leave balance
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave balance retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/leave/balance',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'READ', 'LEAVE_REQUEST');
      
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const leaveBalance = await employeePortalService.getEmployeeLeaveBalance(
        user.employee.id, 
        year
      );
      
      res.json({
        success: true,
        data: leaveBalance
      });
    } catch (error: any) {
      logger.error('Error getting leave balance:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get leave balance'
      });
    }
  }
);

// ============================================================================
// PAYROLL ROUTES
// ============================================================================

/**
 * @swagger
 * /employee-portal/payroll/records:
 *   get:
 *     summary: Get payroll records
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: Payroll records retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/payroll/records',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'READ', 'PAYROLL');
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const payrollRecords = await employeePortalService.getEmployeePayrollRecords(
        user.employee.id, 
        page, 
        limit
      );
      
      res.json({
        success: true,
        data: payrollRecords
      });
    } catch (error: any) {
      logger.error('Error getting payroll records:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get payroll records'
      });
    }
  }
);

/**
 * @swagger
 * /employee-portal/payroll/records/{period}:
 *   get:
 *     summary: Get specific payroll record (salary slip)
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *         description: Period in YYYY-MM format
 *     responses:
 *       200:
 *         description: Payroll record retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/payroll/records/:period',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'READ', 'PAYROLL');
      
      if (!req.params.period) {
        return res.status(400).json({
          success: false,
          message: 'Period is required'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const payrollRecord = await employeePortalService.getPayrollRecord(
        user.employee.id, 
        req.params.period
      );
      
      res.json({
        success: true,
        data: payrollRecord
      });
    } catch (error: any) {
      logger.error('Error getting payroll record:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Payroll record not found'
      });
    }
  }
);

// ============================================================================
// KPI AND PERFORMANCE ROUTES
// ============================================================================

/**
 * @swagger
 * /employee-portal/kpi/metrics:
 *   get:
 *     summary: Get KPI metrics
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Period in YYYY-MM format
 *     responses:
 *       200:
 *         description: KPI metrics retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/kpi/metrics',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'READ', 'KPI');
      
      const period = req.query.period as string;

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const kpiMetrics = await employeePortalService.getEmployeeKPIMetrics(
        user.employee.id, 
        period
      );
      
      res.json({
        success: true,
        data: kpiMetrics
      });
    } catch (error: any) {
      logger.error('Error getting KPI metrics:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get KPI metrics'
      });
    }
  }
);

/**
 * Get performance review for self-assessment
 * GET /api/v1/employee-portal/performance/reviews/:reviewId
 */
router.get('/performance/reviews/:reviewId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'READ', 'PERFORMANCE_REVIEW');
      
      if (!req.params.reviewId) {
        return res.status(400).json({
          success: false,
          message: 'Review ID is required'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const review = await employeePortalService.getEmployeePerformanceReview(
        user.employee.id, 
        req.params.reviewId
      );
      
      res.json({
        success: true,
        data: review
      });
    } catch (error: any) {
      logger.error('Error getting performance review:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Performance review not found'
      });
    }
  }
);

/**
 * Submit self-assessment
 * POST /api/v1/employee-portal/performance/self-assessment
 */
router.post('/performance/self-assessment',
  authenticate,
  validate({ body: selfAssessmentSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'UPDATE', 'PERFORMANCE_REVIEW');
      
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const assessment = await employeePortalService.submitSelfAssessment(
        user.employee.id, 
        req.body
      );
      
      res.json({
        success: true,
        message: 'Self-assessment submitted successfully',
        data: assessment
      });
    } catch (error: any) {
      logger.error('Error submitting self-assessment:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to submit self-assessment'
      });
    }
  }
);

/**
 * Get performance history
 * GET /api/v1/employee-portal/performance/history
 */
router.get('/performance/history',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'READ', 'PERFORMANCE_REVIEW');
      
      const limit = parseInt(req.query.limit as string) || 5;

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const history = await employeePortalService.getEmployeePerformanceHistory(
        user.employee.id, 
        limit
      );
      
      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      logger.error('Error getting performance history:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get performance history'
      });
    }
  }
);

// ============================================================================
// NOTIFICATIONS ROUTES
// ============================================================================

/**
 * @swagger
 * /employee-portal/notifications:
 *   get:
 *     summary: Get employee notifications
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/notifications',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'READ', 'NOTIFICATION');
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const notifications = await employeePortalService.getEmployeeNotifications(
        user.employee.id, 
        page, 
        limit
      );
      
      res.json({
        success: true,
        data: notifications
      });
    } catch (error: any) {
      logger.error('Error getting notifications:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get notifications'
      });
    }
  }
);

/**
 * Mark notification as read
 * POST /api/v1/employee-portal/notifications/:id/read
 */
router.post('/notifications/:id/read',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'UPDATE', 'NOTIFICATION');
      
      if (!req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Notification ID is required'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const readRecord = await employeePortalService.markNotificationAsRead(
        user.employee.id, 
        req.params.id
      );
      
      res.json({
        success: true,
        message: 'Notification marked as read',
        data: readRecord
      });
    } catch (error: any) {
      logger.error('Error marking notification as read:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to mark notification as read'
      });
    }
  }
);

/**
 * Create employee notification (Admin/HR only)
 * POST /api/v1/employee-portal/notifications
 */
router.post('/notifications',
  authenticate,
  validate({ body: notificationCreateSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'CREATE', 'EMPLOYEE_NOTIFICATION');
      
      const notification = await employeePortalService.createEmployeeNotification(
        req.body, 
        req.user!.id
      );
      
      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: notification
      });
    } catch (error: any) {
      logger.error('Error creating notification:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create notification'
      });
    }
  }
);

// ============================================================================
// EMPLOYEE DIRECTORY ROUTES
// ============================================================================

/**
 * @swagger
 * /employee-portal/directory:
 *   get:
 *     summary: Get employee directory
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Employee directory retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/directory',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'READ', 'DIRECTORY');
      
      const branchId = req.query.branchId as string;
      const department = req.query.department as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const directory = await employeePortalService.getEmployeeDirectory(
        user.employee.id, 
        branchId, 
        department, 
        page, 
        limit
      );
      
      res.json({
        success: true,
        data: directory
      });
    } catch (error: any) {
      logger.error('Error getting employee directory:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get employee directory'
      });
    }
  }
);

/**
 * @swagger
 * /employee-portal/organization/chart:
 *   get:
 *     summary: Get organizational chart
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organizational chart retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/organization/chart',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'READ', 'ORGANIZATION');
      
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const chart = await employeePortalService.getOrganizationalChart(user.employee.id);
      
      res.json({
        success: true,
        data: chart
      });
    } catch (error: any) {
      logger.error('Error getting organizational chart:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get organizational chart'
      });
    }
  }
);

// ============================================================================
// DOCUMENT MANAGEMENT ROUTES
// ============================================================================

/**
 * Upload employee document
 * POST /api/v1/employee-portal/documents/upload
 */
router.post('/documents/upload',
  authenticate,
  upload.single('document'),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'CREATE', 'DOCUMENT');
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { documentType } = req.body;
      
      if (!documentType) {
        return res.status(400).json({
          success: false,
          message: 'Document type is required'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const document = await employeePortalService.uploadEmployeeDocument(
        user.employee.id,
        documentType,
        req.file.originalname,
        req.file.path
      );
      
      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document
      });
    } catch (error: any) {
      logger.error('Error uploading document:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to upload document'
      });
    }
  }
);

/**
 * @swagger
 * /employee-portal/documents:
 *   get:
 *     summary: Get employee documents
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/documents',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'EMPLOYEE_PORTAL', 'READ', 'DOCUMENT');
      
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employee: true }
      });

      if (!user?.employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found'
        });
      }

      const documents = await employeePortalService.getEmployeeDocuments(user.employee.id);
      
      res.json({
        success: true,
        data: documents
      });
    } catch (error: any) {
      logger.error('Error getting documents:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get documents'
      });
    }
  }
);

export default router;
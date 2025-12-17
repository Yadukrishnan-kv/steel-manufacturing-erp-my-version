// HR Routes - API endpoints for human resource management
import { Router, Request, Response } from 'express';
import { hrService } from '../services/hr.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { requirePermission } from '../utils/rbac';
import { z } from 'zod';
import { logger } from '../utils/logger';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().transform(str => new Date(str)).optional(),
  dateOfJoining: z.string().transform(str => new Date(str)),
  designation: z.string().min(1, 'Designation is required'),
  department: z.string().min(1, 'Department is required'),
  branchId: z.string().uuid('Invalid branch ID'),
  reportingTo: z.string().uuid().optional(),
  salary: z.number().positive().optional()
});

const updateEmployeeSchema = createEmployeeSchema.partial();

const biometricAttendanceSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  date: z.string().transform(str => new Date(str)),
  checkIn: z.string().transform(str => new Date(str)).optional(),
  checkOut: z.string().transform(str => new Date(str)).optional(),
  deviceId: z.string().optional(),
  location: z.string().optional()
});

const geoAttendanceSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  date: z.string().transform(str => new Date(str)),
  checkIn: z.string().transform(str => new Date(str)).optional(),
  checkOut: z.string().transform(str => new Date(str)).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
  address: z.string().optional()
});

const payrollCalculationSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format'),
  basicSalary: z.number().positive('Basic salary must be positive'),
  allowances: z.number().min(0).optional(),
  overtimeHours: z.number().min(0).optional(),
  overtimeRate: z.number().min(0).optional()
});

const kpiMetricSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  metricName: z.string().min(1, 'Metric name is required'),
  targetValue: z.number().positive('Target value must be positive'),
  actualValue: z.number().min(0, 'Actual value must be non-negative'),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format'),
  weightage: z.number().min(0).max(100, 'Weightage must be between 0 and 100'),
  jobDescRef: z.string().optional()
});

const leaveRequestSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  leaveType: z.enum(['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'COMPENSATORY']),
  fromDate: z.string().transform(str => new Date(str)),
  toDate: z.string().transform(str => new Date(str)),
  reason: z.string().min(1, 'Reason is required')
});

const processLeaveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().optional()
});

// Performance Management Schemas
const performanceReviewSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  reviewPeriod: z.string().min(1, 'Review period is required'),
  reviewType: z.enum(['ANNUAL', 'QUARTERLY', 'PROBATION', 'PROMOTION']),
  reviewerIds: z.array(z.string().uuid()),
  goals: z.string().optional(),
  developmentPlan: z.string().optional()
});

const appraisalItemSchema = z.object({
  reviewId: z.string().uuid('Invalid review ID'),
  category: z.enum(['TECHNICAL', 'BEHAVIORAL', 'LEADERSHIP', 'GOALS']),
  criterion: z.string().min(1, 'Criterion is required'),
  description: z.string().optional(),
  targetValue: z.number().optional(),
  actualValue: z.number().optional(),
  managerRating: z.number().min(1).max(5),
  weightage: z.number().min(0).max(100),
  comments: z.string().optional(),
  evidences: z.array(z.string()).optional(),
  jobDescRef: z.string().optional(),
  kpiMetricId: z.string().uuid().optional()
});

const selfAssessmentSchema = z.object({
  reviewId: z.string().uuid('Invalid review ID'),
  selfAssessment: z.record(z.any()),
  selfRatings: z.record(z.number().min(1).max(5))
});

const promotionSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  reviewId: z.string().uuid().optional(),
  toDesignation: z.string().min(1, 'Designation is required'),
  toSalary: z.number().positive('Salary must be positive'),
  salaryIncrease: z.number().min(0),
  effectiveDate: z.string().transform(str => new Date(str)),
  reason: z.string().min(1, 'Reason is required'),
  approvedBy: z.string().uuid('Invalid approver ID')
});

const incentiveSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  reviewId: z.string().uuid().optional(),
  incentiveType: z.string().min(1, 'Incentive type is required'),
  amount: z.number().positive('Amount must be positive'),
  period: z.string().min(1, 'Period is required'),
  criteria: z.string().min(1, 'Criteria is required'),
  kpiMetrics: z.array(z.string()).optional(),
  calculationBase: z.string().optional(),
  approvedBy: z.string().uuid('Invalid approver ID')
});

const trainingProgramSchema = z.object({
  name: z.string().min(1, 'Program name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  duration: z.number().positive('Duration must be positive'),
  provider: z.string().optional(),
  cost: z.number().min(0).optional(),
  maxParticipants: z.number().positive().optional()
});

const trainingEnrollmentSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  programId: z.string().uuid('Invalid program ID'),
  startDate: z.string().transform(str => new Date(str)).optional()
});

// ============================================================================
// EMPLOYEE MASTER DATA ROUTES
// ============================================================================

/**
 * @swagger
 * /hr/employees:
 *   post:
 *     summary: Create new employee
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeCode
 *               - firstName
 *               - lastName
 *               - dateOfJoining
 *               - designation
 *               - department
 *               - branchId
 *             properties:
 *               employeeCode:
 *                 type: string
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
 *               dateOfJoining:
 *                 type: string
 *                 format: date
 *               designation:
 *                 type: string
 *               department:
 *                 type: string
 *               branchId:
 *                 type: string
 *                 format: uuid
 *               reportingTo:
 *                 type: string
 *                 format: uuid
 *               salary:
 *                 type: number
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/employees', 
  authenticate,
  validate({ body: createEmployeeSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'CREATE', 'EMPLOYEE');
      
      const employee = await hrService.createEmployee(req.body, req.user!.id);
      
      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: employee
      });
    } catch (error: any) {
      logger.error('Error creating employee:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create employee'
      });
    }
  }
);

/**
 * @swagger
 * /hr/employees/{id}:
 *   put:
 *     summary: Update employee
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   get:
 *     summary: Get employee by ID
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Employee retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/employees/:id',
  authenticate,
  validate({ body: updateEmployeeSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'UPDATE', 'EMPLOYEE');
      
      if (!req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required'
        });
      }
      
      const employee = await hrService.updateEmployee(req.params.id, req.body, req.user!.id);
      
      res.json({
        success: true,
        message: 'Employee updated successfully',
        data: employee
      });
    } catch (error: any) {
      logger.error('Error updating employee:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update employee'
      });
    }
  }
);

/**
 * @swagger
 * /hr/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Employee retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/employees/:id',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'READ', 'EMPLOYEE');
      
      if (!req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required'
        });
      }
      
      const employee = await hrService.getEmployeeById(req.params.id);
      
      res.json({
        success: true,
        data: employee
      });
    } catch (error: any) {
      logger.error('Error getting employee:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Employee not found'
      });
    }
  }
);

/**
 * @swagger
 * /hr/employees/branch/{branchId}:
 *   get:
 *     summary: Get employees by branch
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Employees retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/employees/branch/:branchId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'READ', 'EMPLOYEE');
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (!req.params.branchId) {
        return res.status(400).json({
          success: false,
          message: 'Branch ID is required'
        });
      }
      
      const result = await hrService.getEmployeesByBranch(req.params.branchId, page, limit);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Error getting employees by branch:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get employees'
      });
    }
  }
);

// ============================================================================
// ATTENDANCE MANAGEMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /hr/attendance/biometric:
 *   post:
 *     summary: Process biometric attendance
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - date
 *             properties:
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               checkIn:
 *                 type: string
 *                 format: date-time
 *               checkOut:
 *                 type: string
 *                 format: date-time
 *               deviceId:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attendance processed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/attendance/biometric',
  authenticate,
  validate({ body: biometricAttendanceSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'CREATE', 'ATTENDANCE');
      
      const attendance = await hrService.processBiometricAttendance(req.body);
      
      res.json({
        success: true,
        message: 'Attendance processed successfully',
        data: attendance
      });
    } catch (error: any) {
      logger.error('Error processing biometric attendance:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to process attendance'
      });
    }
  }
);

/**
 * @swagger
 * /hr/attendance/geo-tagged:
 *   post:
 *     summary: Process geo-tagged attendance
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - date
 *               - latitude
 *               - longitude
 *             properties:
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               checkIn:
 *                 type: string
 *                 format: date-time
 *               checkOut:
 *                 type: string
 *                 format: date-time
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               accuracy:
 *                 type: number
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Geo-tagged attendance processed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/attendance/geo-tagged',
  authenticate,
  validate({ body: geoAttendanceSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'CREATE', 'ATTENDANCE');
      
      const attendance = await hrService.processGeoTaggedAttendance(req.body);
      
      res.json({
        success: true,
        message: 'Geo-tagged attendance processed successfully',
        data: attendance
      });
    } catch (error: any) {
      logger.error('Error processing geo-tagged attendance:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to process geo-tagged attendance'
      });
    }
  }
);

/**
 * @swagger
 * /hr/attendance/report/{employeeId}:
 *   get:
 *     summary: Get attendance report
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Attendance report retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/attendance/report/:employeeId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'READ', 'ATTENDANCE');
      
      const fromDate = new Date(req.query.fromDate as string);
      const toDate = new Date(req.query.toDate as string);
      
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD format.'
        });
      }
      
      if (!req.params.employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required'
        });
      }
      
      const report = await hrService.getAttendanceReport(req.params.employeeId, fromDate, toDate);
      
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      logger.error('Error getting attendance report:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get attendance report'
      });
    }
  }
);

/**
 * @swagger
 * /hr/attendance/overtime/{employeeId}:
 *   post:
 *     summary: Calculate overtime
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
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
 *             required: [date]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               shiftType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Overtime calculated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/attendance/overtime/:employeeId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'UPDATE', 'ATTENDANCE');
      
      const { date, shiftType } = req.body;
      const attendanceDate = new Date(date);
      
      if (isNaN(attendanceDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }
      
      if (!req.params.employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required'
        });
      }
      
      const result = await hrService.calculateOvertime(req.params.employeeId, attendanceDate, shiftType);
      
      res.json({
        success: true,
        message: 'Overtime calculated successfully',
        data: result
      });
    } catch (error: any) {
      logger.error('Error calculating overtime:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to calculate overtime'
      });
    }
  }
);

// ============================================================================
// PAYROLL MANAGEMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /hr/payroll/calculate:
 *   post:
 *     summary: Calculate payroll
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - period
 *               - basicSalary
 *             properties:
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               period:
 *                 type: string
 *                 description: Period in YYYY-MM format
 *               basicSalary:
 *                 type: number
 *               allowances:
 *                 type: number
 *               overtimeHours:
 *                 type: number
 *               overtimeRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payroll calculated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/payroll/calculate',
  authenticate,
  validate({ body: payrollCalculationSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'CREATE', 'PAYROLL');
      
      const payroll = await hrService.calculatePayroll(req.body);
      
      res.json({
        success: true,
        message: 'Payroll calculated successfully',
        data: payroll
      });
    } catch (error: any) {
      logger.error('Error calculating payroll:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to calculate payroll'
      });
    }
  }
);

/**
 * @swagger
 * /hr/payroll/process/{employeeId}/{period}:
 *   post:
 *     summary: Process payroll
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           description: Period in YYYY-MM format
 *     responses:
 *       200:
 *         description: Payroll processed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/payroll/process/:employeeId/:period',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'UPDATE', 'PAYROLL');
      
      if (!req.params.employeeId || !req.params.period) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID and period are required'
        });
      }
      
      const payroll = await hrService.processPayroll(req.params.employeeId, req.params.period);
      
      res.json({
        success: true,
        message: 'Payroll processed successfully',
        data: payroll
      });
    } catch (error: any) {
      logger.error('Error processing payroll:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to process payroll'
      });
    }
  }
);

// ============================================================================
// KPI MANAGEMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /hr/kpi/metrics:
 *   post:
 *     summary: Record KPI metric
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - metricName
 *               - targetValue
 *               - actualValue
 *               - period
 *               - weightage
 *             properties:
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               metricName:
 *                 type: string
 *               targetValue:
 *                 type: number
 *               actualValue:
 *                 type: number
 *               period:
 *                 type: string
 *                 description: Period in YYYY-MM format
 *               weightage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               jobDescRef:
 *                 type: string
 *     responses:
 *       200:
 *         description: KPI metric recorded successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/kpi/metrics',
  authenticate,
  validate({ body: kpiMetricSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'CREATE', 'KPI');
      
      const metric = await hrService.recordKPIMetric(req.body);
      
      res.json({
        success: true,
        message: 'KPI metric recorded successfully',
        data: metric
      });
    } catch (error: any) {
      logger.error('Error recording KPI metric:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to record KPI metric'
      });
    }
  }
);

/**
 * @swagger
 * /hr/kpi/summary/{employeeId}/{period}:
 *   get:
 *     summary: Get KPI summary
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           description: Period in YYYY-MM format
 *     responses:
 *       200:
 *         description: KPI summary retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/kpi/summary/:employeeId/:period',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'READ', 'KPI');
      
      if (!req.params.employeeId || !req.params.period) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID and period are required'
        });
      }
      
      const summary = await hrService.getKPISummary(req.params.employeeId, req.params.period);
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      logger.error('Error getting KPI summary:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get KPI summary'
      });
    }
  }
);

// ============================================================================
// LEAVE MANAGEMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /hr/leave/requests:
 *   post:
 *     summary: Submit leave request
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - leaveType
 *               - fromDate
 *               - toDate
 *               - reason
 *             properties:
 *               employeeId:
 *                 type: string
 *                 format: uuid
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
 */
router.post('/leave/requests',
  authenticate,
  validate({ body: leaveRequestSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'CREATE', 'LEAVE');
      
      const leaveRequest = await hrService.submitLeaveRequest(req.body);
      
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
 * @swagger
 * /hr/leave/requests/{id}/process:
 *   put:
 *     summary: Process leave request (approve/reject)
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Leave request processed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/leave/requests/:id/process',
  authenticate,
  validate({ body: processLeaveSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'UPDATE', 'LEAVE');
      
      if (!req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Leave request ID is required'
        });
      }
      
      const { status, remarks } = req.body;
      const leaveRequest = await hrService.processLeaveRequest(
        req.params.id, 
        status, 
        req.user!.id, 
        remarks
      );
      
      res.json({
        success: true,
        message: `Leave request ${status.toLowerCase()} successfully`,
        data: leaveRequest
      });
    } catch (error: any) {
      logger.error('Error processing leave request:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to process leave request'
      });
    }
  }
);

/**
 * @swagger
 * /hr/leave/balance/{employeeId}/{year}:
 *   get:
 *     summary: Get leave balance
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 2100
 *     responses:
 *       200:
 *         description: Leave balance retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/leave/balance/:employeeId/:year',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'READ', 'LEAVE');
      
      if (!req.params.employeeId || !req.params.year) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID and year are required'
        });
      }
      
      const year = parseInt(req.params.year);
      if (isNaN(year) || year < 2000 || year > 2100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid year'
        });
      }
      
      const balance = await hrService.getLeaveBalance(req.params.employeeId, year);
      
      res.json({
        success: true,
        data: balance
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
// PERFORMANCE MANAGEMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /hr/performance/reviews:
 *   post:
 *     summary: Create performance review
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - reviewPeriod
 *               - reviewType
 *               - reviewerIds
 *             properties:
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               reviewPeriod:
 *                 type: string
 *               reviewType:
 *                 type: string
 *                 enum: [ANNUAL, QUARTERLY, PROBATION, PROMOTION]
 *               reviewerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               goals:
 *                 type: string
 *               developmentPlan:
 *                 type: string
 *     responses:
 *       201:
 *         description: Performance review created successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/performance/reviews',
  authenticate,
  validate({ body: performanceReviewSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'CREATE', 'PERFORMANCE_REVIEW');
      
      const review = await hrService.createPerformanceReview(req.body, req.user!.id);
      
      res.status(201).json({
        success: true,
        message: 'Performance review created successfully',
        data: review
      });
    } catch (error: any) {
      logger.error('Error creating performance review:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create performance review'
      });
    }
  }
);

/**
 * @swagger
 * /hr/performance/appraisal-items:
 *   post:
 *     summary: Add appraisal item
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reviewId, category, criterion, managerRating, weightage]
 *             properties:
 *               reviewId:
 *                 type: string
 *                 format: uuid
 *               category:
 *                 type: string
 *                 enum: [TECHNICAL, BEHAVIORAL, LEADERSHIP, GOALS]
 *               criterion:
 *                 type: string
 *               description:
 *                 type: string
 *               targetValue:
 *                 type: number
 *               actualValue:
 *                 type: number
 *               managerRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               weightage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               comments:
 *                 type: string
 *               evidences:
 *                 type: array
 *                 items:
 *                   type: string
 *               jobDescRef:
 *                 type: string
 *               kpiMetricId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Appraisal item added successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/performance/appraisal-items',
  authenticate,
  validate({ body: appraisalItemSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'CREATE', 'APPRAISAL_ITEM');
      
      const item = await hrService.addAppraisalItem(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Appraisal item added successfully',
        data: item
      });
    } catch (error: any) {
      logger.error('Error adding appraisal item:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to add appraisal item'
      });
    }
  }
);

/**
 * @swagger
 * /hr/performance/self-assessment:
 *   post:
 *     summary: Submit self-assessment
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reviewId, selfAssessment, selfRatings]
 *             properties:
 *               reviewId:
 *                 type: string
 *                 format: uuid
 *               selfAssessment:
 *                 type: object
 *               selfRatings:
 *                 type: object
 *                 additionalProperties:
 *                   type: number
 *                   minimum: 1
 *                   maximum: 5
 *     responses:
 *       200:
 *         description: Self-assessment submitted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/performance/self-assessment',
  authenticate,
  validate({ body: selfAssessmentSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'UPDATE', 'PERFORMANCE_REVIEW');
      
      const review = await hrService.submitSelfAssessment(req.body);
      
      res.json({
        success: true,
        message: 'Self-assessment submitted successfully',
        data: review
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
 * @swagger
 * /hr/performance/reviews/{id}/complete:
 *   put:
 *     summary: Complete performance review
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             required: [managerComments]
 *             properties:
 *               managerComments:
 *                 type: string
 *               hrComments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Performance review completed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/performance/reviews/:id/complete',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'UPDATE', 'PERFORMANCE_REVIEW');
      
      if (!req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Review ID is required'
        });
      }
      
      const { managerComments, hrComments } = req.body;
      
      if (!managerComments) {
        return res.status(400).json({
          success: false,
          message: 'Manager comments are required'
        });
      }
      
      const review = await hrService.completePerformanceReview(
        req.params.id,
        managerComments,
        hrComments,
        req.user!.id
      );
      
      res.json({
        success: true,
        message: 'Performance review completed successfully',
        data: review
      });
    } catch (error: any) {
      logger.error('Error completing performance review:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to complete performance review'
      });
    }
  }
);

/**
 * @swagger
 * /hr/performance/reviews/{id}:
 *   get:
 *     summary: Get performance review
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Performance review retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/performance/reviews/:id',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'READ', 'PERFORMANCE_REVIEW');
      
      if (!req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Review ID is required'
        });
      }
      
      const review = await hrService.getPerformanceReview(req.params.id);
      
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
 * @swagger
 * /hr/performance/history/{employeeId}:
 *   get:
 *     summary: Get employee performance history
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Performance history retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/performance/history/:employeeId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'READ', 'PERFORMANCE_REVIEW');
      
      if (!req.params.employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required'
        });
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const history = await hrService.getEmployeePerformanceHistory(req.params.employeeId, limit);
      
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

/**
 * @swagger
 * /hr/performance/promotions:
 *   post:
 *     summary: Process promotion
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - toDesignation
 *               - toSalary
 *               - salaryIncrease
 *               - effectiveDate
 *               - reason
 *               - approvedBy
 *             properties:
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               reviewId:
 *                 type: string
 *                 format: uuid
 *               toDesignation:
 *                 type: string
 *               toSalary:
 *                 type: number
 *               salaryIncrease:
 *                 type: number
 *               effectiveDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *               approvedBy:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Promotion processed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/performance/promotions',
  authenticate,
  validate({ body: promotionSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'CREATE', 'PROMOTION');
      
      const promotion = await hrService.processPromotion(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Promotion processed successfully',
        data: promotion
      });
    } catch (error: any) {
      logger.error('Error processing promotion:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to process promotion'
      });
    }
  }
);

/**
 * @swagger
 * /hr/performance/incentives:
 *   post:
 *     summary: Award incentive
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, incentiveType, amount, period, criteria, approvedBy]
 *             properties:
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               reviewId:
 *                 type: string
 *                 format: uuid
 *               incentiveType:
 *                 type: string
 *               amount:
 *                 type: number
 *               period:
 *                 type: string
 *               criteria:
 *                 type: string
 *               kpiMetrics:
 *                 type: array
 *                 items:
 *                   type: string
 *               calculationBase:
 *                 type: string
 *               approvedBy:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Incentive awarded successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/performance/incentives',
  authenticate,
  validate({ body: incentiveSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'CREATE', 'INCENTIVE');
      
      const incentive = await hrService.awardIncentive(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Incentive awarded successfully',
        data: incentive
      });
    } catch (error: any) {
      logger.error('Error awarding incentive:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to award incentive'
      });
    }
  }
);

/**
 * @swagger
 * /hr/organization/hierarchy:
 *   get:
 *     summary: Get organizational hierarchy
 *     tags: [HR]
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
 *         description: Organizational hierarchy retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/organization/hierarchy',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'READ', 'ORGANIZATION');
      
      const branchId = req.query.branchId as string;
      const hierarchy = await hrService.getOrganizationalHierarchy(branchId);
      
      res.json({
        success: true,
        data: hierarchy
      });
    } catch (error: any) {
      logger.error('Error getting organizational hierarchy:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get organizational hierarchy'
      });
    }
  }
);

/**
 * @swagger
 * /hr/organization/hierarchy/{employeeId}:
 *   put:
 *     summary: Update organizational hierarchy
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
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
 *             required: [level, department, designation]
 *             properties:
 *               level:
 *                 type: number
 *               department:
 *                 type: string
 *               designation:
 *                 type: string
 *               reportingTo:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Organizational hierarchy updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/organization/hierarchy/:employeeId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'UPDATE', 'ORGANIZATION');
      
      if (!req.params.employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required'
        });
      }
      
      const { level, department, designation, reportingTo } = req.body;
      
      if (!level || !department || !designation) {
        return res.status(400).json({
          success: false,
          message: 'Level, department, and designation are required'
        });
      }
      
      const hierarchy = await hrService.updateOrganizationalHierarchy(
        req.params.employeeId,
        level,
        department,
        designation,
        reportingTo
      );
      
      res.json({
        success: true,
        message: 'Organizational hierarchy updated successfully',
        data: hierarchy
      });
    } catch (error: any) {
      logger.error('Error updating organizational hierarchy:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update organizational hierarchy'
      });
    }
  }
);

// ============================================================================
// TRAINING AND DEVELOPMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /hr/training/programs:
 *   post:
 *     summary: Create training program
 *     tags: [HR]
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
 *               - category
 *               - duration
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               duration:
 *                 type: number
 *               provider:
 *                 type: string
 *               cost:
 *                 type: number
 *               maxParticipants:
 *                 type: number
 *     responses:
 *       201:
 *         description: Training program created successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/training/programs',
  authenticate,
  validate({ body: trainingProgramSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'CREATE', 'TRAINING_PROGRAM');
      
      const program = await hrService.createTrainingProgram(req.body, req.user!.id);
      
      res.status(201).json({
        success: true,
        message: 'Training program created successfully',
        data: program
      });
    } catch (error: any) {
      logger.error('Error creating training program:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create training program'
      });
    }
  }
);

/**
 * @swagger
 * /hr/training/enrollments:
 *   post:
 *     summary: Enroll in training
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, programId]
 *             properties:
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               programId:
 *                 type: string
 *                 format: uuid
 *               startDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Employee enrolled in training successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/training/enrollments',
  authenticate,
  validate({ body: trainingEnrollmentSchema }),
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'CREATE', 'TRAINING_ENROLLMENT');
      
      const enrollment = await hrService.enrollInTraining(req.body, req.user!.id);
      
      res.status(201).json({
        success: true,
        message: 'Employee enrolled in training successfully',
        data: enrollment
      });
    } catch (error: any) {
      logger.error('Error enrolling in training:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to enroll in training'
      });
    }
  }
);

/**
 * @swagger
 * /hr/training/enrollments/{id}/complete:
 *   put:
 *     summary: Complete training
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *               feedback:
 *                 type: string
 *               certificateUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Training completed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/training/enrollments/:id/complete',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'UPDATE', 'TRAINING_ENROLLMENT');
      
      if (!req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Enrollment ID is required'
        });
      }
      
      const { score, feedback, certificateUrl } = req.body;
      
      const enrollment = await hrService.completeTraining(
        req.params.id,
        score,
        feedback,
        certificateUrl
      );
      
      res.json({
        success: true,
        message: 'Training completed successfully',
        data: enrollment
      });
    } catch (error: any) {
      logger.error('Error completing training:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to complete training'
      });
    }
  }
);

/**
 * @swagger
 * /hr/training/history/{employeeId}:
 *   get:
 *     summary: Get employee training history
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Training history retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/training/history/:employeeId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'READ', 'TRAINING_ENROLLMENT');
      
      if (!req.params.employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required'
        });
      }
      
      const history = await hrService.getEmployeeTrainingHistory(req.params.employeeId);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      logger.error('Error getting training history:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get training history'
      });
    }
  }
);

/**
 * @swagger
 * /hr/performance/analytics:
 *   get:
 *     summary: Get performance analytics
 *     tags: [HR]
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
 *         name: period
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance analytics retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/performance/analytics',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await requirePermission(req, 'HR', 'READ', 'PERFORMANCE_ANALYTICS');
      
      const branchId = req.query.branchId as string;
      const department = req.query.department as string;
      const period = req.query.period as string;
      
      const analytics = await hrService.getPerformanceAnalytics(branchId, department, period);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      logger.error('Error getting performance analytics:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get performance analytics'
      });
    }
  }
);

export default router;
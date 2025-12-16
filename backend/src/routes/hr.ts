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
 * Create new employee
 * POST /api/v1/hr/employees
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
 * Update employee
 * PUT /api/v1/hr/employees/:id
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
 * Get employee by ID
 * GET /api/v1/hr/employees/:id
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
 * Get employees by branch
 * GET /api/v1/hr/employees/branch/:branchId
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
 * Process biometric attendance
 * POST /api/v1/hr/attendance/biometric
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
 * Process geo-tagged attendance
 * POST /api/v1/hr/attendance/geo-tagged
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
 * Get attendance report
 * GET /api/v1/hr/attendance/report/:employeeId
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
 * Calculate overtime
 * POST /api/v1/hr/attendance/overtime/:employeeId
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
 * Calculate payroll
 * POST /api/v1/hr/payroll/calculate
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
 * Process payroll
 * POST /api/v1/hr/payroll/process/:employeeId/:period
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
 * Record KPI metric
 * POST /api/v1/hr/kpi/metrics
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
 * Get KPI summary
 * GET /api/v1/hr/kpi/summary/:employeeId/:period
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
 * Submit leave request
 * POST /api/v1/hr/leave/requests
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
 * Process leave request (approve/reject)
 * PUT /api/v1/hr/leave/requests/:id/process
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
 * Get leave balance
 * GET /api/v1/hr/leave/balance/:employeeId/:year
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
 * Create performance review
 * POST /api/v1/hr/performance/reviews
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
 * Add appraisal item to review
 * POST /api/v1/hr/performance/appraisal-items
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
 * Submit self-assessment
 * POST /api/v1/hr/performance/self-assessment
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
 * Complete performance review
 * PUT /api/v1/hr/performance/reviews/:id/complete
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
 * Get performance review
 * GET /api/v1/hr/performance/reviews/:id
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
 * Get employee performance history
 * GET /api/v1/hr/performance/history/:employeeId
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
 * Process promotion
 * POST /api/v1/hr/performance/promotions
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
 * Award incentive
 * POST /api/v1/hr/performance/incentives
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
 * Get organizational hierarchy
 * GET /api/v1/hr/organization/hierarchy
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
 * Update organizational hierarchy
 * PUT /api/v1/hr/organization/hierarchy/:employeeId
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
 * Create training program
 * POST /api/v1/hr/training/programs
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
 * Enroll in training
 * POST /api/v1/hr/training/enrollments
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
 * Complete training
 * PUT /api/v1/hr/training/enrollments/:id/complete
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
 * Get employee training history
 * GET /api/v1/hr/training/history/:employeeId
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
 * Get performance analytics
 * GET /api/v1/hr/performance/analytics
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
// HR Service - Core functionality for human resource management
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface CreateEmployeeRequest {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  dateOfJoining: Date;
  designation: string;
  department: string;
  branchId: string;
  reportingTo?: string;
  salary?: number;
}

export interface BiometricAttendanceData {
  employeeId: string;
  date: Date;
  checkIn?: Date | undefined;
  checkOut?: Date | undefined;
  deviceId?: string;
  location?: string; // For geo-tagged attendance
}

export interface ShiftConfiguration {
  shiftType: string; // MORNING, EVENING, NIGHT
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  bufferMinutes: number;
  overtimeThreshold: number; // Minutes after shift end
}

export interface PayrollCalculationRequest {
  employeeId: string;
  period: string; // YYYY-MM format
  basicSalary: number;
  allowances?: number;
  overtimeHours?: number;
  overtimeRate?: number;
}

export interface KPIMetricRequest {
  employeeId: string;
  metricName: string;
  targetValue: number;
  actualValue: number;
  period: string; // YYYY-MM format
  weightage: number;
  jobDescRef?: string;
}

export interface LeaveRequestData {
  employeeId: string;
  leaveType: string; // CASUAL, SICK, EARNED, MATERNITY, etc.
  fromDate: Date;
  toDate: Date;
  reason: string;
}

export interface GeoTaggedAttendance {
  employeeId: string;
  date: Date;
  checkIn?: Date | undefined;
  checkOut?: Date | undefined;
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

// ============================================================================
// PERFORMANCE MANAGEMENT INTERFACES
// ============================================================================

export interface PerformanceReviewRequest {
  employeeId: string;
  reviewPeriod: string;
  reviewType: 'ANNUAL' | 'QUARTERLY' | 'PROBATION' | 'PROMOTION';
  reviewerIds: string[];
  goals?: string;
  developmentPlan?: string;
}

export interface AppraisalItemRequest {
  reviewId: string;
  category: 'TECHNICAL' | 'BEHAVIORAL' | 'LEADERSHIP' | 'GOALS';
  criterion: string;
  description?: string;
  targetValue?: number;
  actualValue?: number;
  managerRating: number;
  weightage: number;
  comments?: string;
  evidences?: string[];
  jobDescRef?: string;
  kpiMetricId?: string;
}

export interface SelfAssessmentRequest {
  reviewId: string;
  selfAssessment: Record<string, any>;
  selfRatings: Record<string, number>; // appraisalItemId -> rating
}

export interface PromotionRequest {
  employeeId: string;
  reviewId?: string;
  toDesignation: string;
  toSalary: number;
  salaryIncrease: number;
  effectiveDate: Date;
  reason: string;
  approvedBy: string;
}

export interface IncentiveRequest {
  employeeId: string;
  reviewId?: string;
  incentiveType: string;
  amount: number;
  period: string;
  criteria: string;
  kpiMetrics?: string[];
  calculationBase?: string;
  approvedBy: string;
}

export interface TrainingProgramRequest {
  name: string;
  description?: string;
  category: string;
  duration: number;
  provider?: string;
  cost?: number;
  maxParticipants?: number;
}

export interface TrainingEnrollmentRequest {
  employeeId: string;
  programId: string;
  startDate?: Date;
}

// ============================================================================
// EMPLOYEE MASTER DATA MANAGEMENT
// ============================================================================

export class HRService {
  
  /**
   * Create new employee record
   */
  async createEmployee(request: CreateEmployeeRequest, createdBy: string) {
    try {
      // Check if employee code already exists
      const existingEmployee = await prisma.employee.findUnique({
        where: { employeeCode: request.employeeCode }
      });

      if (existingEmployee) {
        throw new Error(`Employee with code ${request.employeeCode} already exists`);
      }

      // Validate branch exists
      const branch = await prisma.branch.findUnique({
        where: { id: request.branchId }
      });

      if (!branch) {
        throw new Error('Branch not found');
      }

      // Validate reporting manager if provided
      if (request.reportingTo) {
        const manager = await prisma.employee.findUnique({
          where: { id: request.reportingTo }
        });

        if (!manager) {
          throw new Error('Reporting manager not found');
        }
      }

      const employee = await prisma.employee.create({
        data: {
          ...request,
          createdBy
        },
        include: {
          branch: true,
          manager: true
        }
      });

      logger.info(`Employee created: ${employee.employeeCode}`);
      return employee;

    } catch (error) {
      logger.error('Error creating employee:', error);
      throw error;
    }
  }

  /**
   * Update employee information
   */
  async updateEmployee(employeeId: string, updates: Partial<CreateEmployeeRequest>, updatedBy: string) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Check if employee code is being changed and already exists
      if (updates.employeeCode && updates.employeeCode !== employee.employeeCode) {
        const existingEmployee = await prisma.employee.findUnique({
          where: { employeeCode: updates.employeeCode }
        });

        if (existingEmployee) {
          throw new Error(`Employee with code ${updates.employeeCode} already exists`);
        }
      }

      const updatedEmployee = await prisma.employee.update({
        where: { id: employeeId },
        data: {
          ...updates,
          updatedBy,
          updatedAt: new Date()
        },
        include: {
          branch: true,
          manager: true
        }
      });

      logger.info(`Employee updated: ${updatedEmployee.employeeCode}`);
      return updatedEmployee;

    } catch (error) {
      logger.error('Error updating employee:', error);
      throw error;
    }
  }

  /**
   * Get employee by ID with full details
   */
  async getEmployeeById(employeeId: string) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          branch: true,
          manager: true,
          subordinates: true,
          user: true,
          attendance: {
            orderBy: { date: 'desc' },
            take: 30 // Last 30 days
          },
          kpiMetrics: {
            orderBy: { period: 'desc' },
            take: 12 // Last 12 months
          },
          leaveRequests: {
            orderBy: { createdAt: 'desc' },
            take: 10 // Last 10 requests
          },
          payrollRecords: {
            orderBy: { period: 'desc' },
            take: 12 // Last 12 months
          }
        }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      return employee;

    } catch (error) {
      logger.error('Error getting employee:', error);
      throw error;
    }
  }

  /**
   * Get employees by branch with pagination
   */
  async getEmployeesByBranch(branchId: string, page: number = 1, limit: number = 50) {
    try {
      const skip = (page - 1) * limit;

      const [employees, total] = await Promise.all([
        prisma.employee.findMany({
          where: { 
            branchId,
            isDeleted: false 
          },
          include: {
            branch: true,
            manager: true
          },
          skip,
          take: limit,
          orderBy: { employeeCode: 'asc' }
        }),
        prisma.employee.count({
          where: { 
            branchId,
            isDeleted: false 
          }
        })
      ]);

      return {
        employees,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('Error getting employees by branch:', error);
      throw error;
    }
  }

  // ============================================================================
  // BIOMETRIC ATTENDANCE INTEGRATION
  // ============================================================================

  /**
   * Process biometric attendance data from Hikvision systems
   */
  async processBiometricAttendance(attendanceData: BiometricAttendanceData) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: attendanceData.employeeId }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Check if attendance record already exists for the date
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: attendanceData.employeeId,
            date: attendanceData.date
          }
        }
      });

      let attendance;
      
      if (existingAttendance) {
        // Update existing record
        const updateData: any = {};
        
        if (attendanceData.checkIn && !existingAttendance.checkIn) {
          updateData.checkIn = attendanceData.checkIn;
        }
        
        if (attendanceData.checkOut) {
          updateData.checkOut = attendanceData.checkOut;
          
          // Calculate working hours if both check-in and check-out are available
          const checkIn = existingAttendance.checkIn || attendanceData.checkIn;
          if (checkIn) {
            const workingHours = this.calculateWorkingHours(checkIn, attendanceData.checkOut);
            updateData.workingHours = workingHours.regular;
            updateData.overtimeHours = workingHours.overtime;
          }
        }

        if (attendanceData.location) {
          updateData.location = attendanceData.location;
        }

        updateData.isPresent = true;

        attendance = await prisma.attendance.update({
          where: { id: existingAttendance.id },
          data: updateData
        });
      } else {
        // Create new attendance record
        let workingHours = 0;
        let overtimeHours = 0;

        if (attendanceData.checkIn && attendanceData.checkOut) {
          const hours = this.calculateWorkingHours(attendanceData.checkIn, attendanceData.checkOut);
          workingHours = hours.regular;
          overtimeHours = hours.overtime;
        }

        attendance = await prisma.attendance.create({
          data: {
            employeeId: attendanceData.employeeId,
            date: attendanceData.date,
            checkIn: attendanceData.checkIn || null,
            checkOut: attendanceData.checkOut || null,
            workingHours,
            overtimeHours,
            location: attendanceData.location || null,
            isPresent: true
          }
        });
      }

      logger.info(`Attendance processed for employee: ${employee.employeeCode}`);
      return attendance;

    } catch (error) {
      logger.error('Error processing biometric attendance:', error);
      throw error;
    }
  }

  /**
   * Process geo-tagged attendance for field executives
   */
  async processGeoTaggedAttendance(geoAttendance: GeoTaggedAttendance) {
    try {
      const location = {
        latitude: geoAttendance.latitude,
        longitude: geoAttendance.longitude,
        accuracy: geoAttendance.accuracy,
        address: geoAttendance.address,
        timestamp: new Date()
      };

      const attendanceData: BiometricAttendanceData = {
        employeeId: geoAttendance.employeeId,
        date: geoAttendance.date,
        checkIn: geoAttendance.checkIn || undefined,
        checkOut: geoAttendance.checkOut || undefined,
        location: JSON.stringify(location)
      };

      return await this.processBiometricAttendance(attendanceData);

    } catch (error) {
      logger.error('Error processing geo-tagged attendance:', error);
      throw error;
    }
  }

  /**
   * Calculate working hours and overtime
   */
  private calculateWorkingHours(checkIn: Date, checkOut: Date): { regular: number; overtime: number } {
    const totalMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60));
    const totalHours = totalMinutes / 60;

    // Standard working hours (8 hours)
    const standardHours = 8;
    
    if (totalHours <= standardHours) {
      return {
        regular: totalHours,
        overtime: 0
      };
    } else {
      return {
        regular: standardHours,
        overtime: totalHours - standardHours
      };
    }
  }

  /**
   * Get attendance report for employee
   */
  async getAttendanceReport(employeeId: string, fromDate: Date, toDate: Date) {
    try {
      const attendance = await prisma.attendance.findMany({
        where: {
          employeeId,
          date: {
            gte: fromDate,
            lte: toDate
          }
        },
        orderBy: { date: 'asc' }
      });

      const summary = {
        totalDays: attendance.length,
        presentDays: attendance.filter(a => a.isPresent).length,
        totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0),
        totalOvertimeHours: attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
        averageWorkingHours: 0
      };

      if (summary.presentDays > 0) {
        summary.averageWorkingHours = summary.totalWorkingHours / summary.presentDays;
      }

      return {
        attendance,
        summary
      };

    } catch (error) {
      logger.error('Error getting attendance report:', error);
      throw error;
    }
  }

  // ============================================================================
  // SHIFT MANAGEMENT AND OVERTIME TRACKING
  // ============================================================================

  /**
   * Configure shift patterns
   */
  async configureShift(shiftConfig: ShiftConfiguration) {
    try {
      // This would typically be stored in a shift configuration table
      // For now, we'll use a simple approach with the existing attendance system
      
      logger.info(`Shift configured: ${shiftConfig.shiftType}`);
      return shiftConfig;

    } catch (error) {
      logger.error('Error configuring shift:', error);
      throw error;
    }
  }

  /**
   * Calculate overtime based on shift rules
   */
  async calculateOvertime(employeeId: string, date: Date, shiftType: string = 'MORNING') {
    try {
      const attendance = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId,
            date
          }
        }
      });

      if (!attendance || !attendance.checkIn || !attendance.checkOut) {
        return { overtime: 0, earlyOut: false };
      }

      // Get shift configuration (this would come from a configuration table)
      const shiftConfig = this.getShiftConfiguration(shiftType);
      
      const checkInTime = attendance.checkIn.getHours() * 60 + attendance.checkIn.getMinutes();
      const checkOutTime = attendance.checkOut.getHours() * 60 + attendance.checkOut.getMinutes();
      
      const shiftEndTime = this.parseTime(shiftConfig.endTime);
      const overtimeThreshold = shiftEndTime + shiftConfig.bufferMinutes;

      let overtime = 0;
      let earlyOut = false;

      if (checkOutTime > overtimeThreshold) {
        overtime = (checkOutTime - overtimeThreshold) / 60; // Convert to hours
      } else if (checkOutTime < shiftEndTime) {
        earlyOut = true;
      }

      // Update attendance record with calculated overtime
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          overtimeHours: overtime,
          shiftType,
          remarks: earlyOut ? 'Early out' : null
        }
      });

      return { overtime, earlyOut };

    } catch (error) {
      logger.error('Error calculating overtime:', error);
      throw error;
    }
  }

  /**
   * Get shift configuration (mock implementation)
   */
  private getShiftConfiguration(shiftType: string): ShiftConfiguration {
    const configs = {
      MORNING: {
        shiftType: 'MORNING',
        startTime: '09:00',
        endTime: '18:00',
        bufferMinutes: 30,
        overtimeThreshold: 30
      },
      EVENING: {
        shiftType: 'EVENING',
        startTime: '14:00',
        endTime: '23:00',
        bufferMinutes: 30,
        overtimeThreshold: 30
      },
      NIGHT: {
        shiftType: 'NIGHT',
        startTime: '22:00',
        endTime: '07:00',
        bufferMinutes: 30,
        overtimeThreshold: 30
      }
    };

    return configs[shiftType as keyof typeof configs] || configs.MORNING;
  }

  /**
   * Parse time string to minutes
   */
  private parseTime(timeStr: string): number {
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr || '0', 10);
    const minutes = parseInt(minutesStr || '0', 10);
    return hours * 60 + minutes;
  }

  // ============================================================================
  // PAYROLL PROCESSING
  // ============================================================================

  /**
   * Calculate payroll for employee
   */
  async calculatePayroll(request: PayrollCalculationRequest) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: request.employeeId }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Check if payroll already exists for the period
      const existingPayroll = await prisma.payrollRecord.findUnique({
        where: {
          employeeId_period: {
            employeeId: request.employeeId,
            period: request.period
          }
        }
      });

      if (existingPayroll && existingPayroll.status === 'PROCESSED') {
        throw new Error('Payroll already processed for this period');
      }

      // Calculate components
      const basicSalary = request.basicSalary;
      const allowances = request.allowances || 0;
      const overtimeAmount = (request.overtimeHours || 0) * (request.overtimeRate || 0);
      const grossSalary = basicSalary + allowances + overtimeAmount;

      // Calculate statutory deductions
      const pfDeduction = this.calculatePF(basicSalary);
      const esiDeduction = this.calculateESI(grossSalary);
      const taxDeduction = this.calculateProfessionalTax(grossSalary);

      const totalDeductions = pfDeduction + esiDeduction + taxDeduction;
      const netSalary = grossSalary - totalDeductions;

      const payrollData = {
        employeeId: request.employeeId,
        period: request.period,
        basicSalary,
        allowances,
        overtime: overtimeAmount,
        grossSalary,
        pfDeduction,
        esiDeduction,
        taxDeduction,
        otherDeductions: 0,
        netSalary,
        status: 'DRAFT' as const
      };

      let payroll;
      if (existingPayroll) {
        payroll = await prisma.payrollRecord.update({
          where: { id: existingPayroll.id },
          data: payrollData
        });
      } else {
        payroll = await prisma.payrollRecord.create({
          data: payrollData
        });
      }

      logger.info(`Payroll calculated for employee: ${employee.employeeCode}, period: ${request.period}`);
      return payroll;

    } catch (error) {
      logger.error('Error calculating payroll:', error);
      throw error;
    }
  }

  /**
   * Process payroll (mark as processed)
   */
  async processPayroll(employeeId: string, period: string) {
    try {
      const payroll = await prisma.payrollRecord.findUnique({
        where: {
          employeeId_period: {
            employeeId,
            period
          }
        }
      });

      if (!payroll) {
        throw new Error('Payroll record not found');
      }

      if (payroll.status === 'PROCESSED') {
        throw new Error('Payroll already processed');
      }

      const processedPayroll = await prisma.payrollRecord.update({
        where: { id: payroll.id },
        data: {
          status: 'PROCESSED',
          processedAt: new Date()
        }
      });

      logger.info(`Payroll processed for employee: ${employeeId}, period: ${period}`);
      return processedPayroll;

    } catch (error) {
      logger.error('Error processing payroll:', error);
      throw error;
    }
  }

  /**
   * Calculate PF deduction (12% of basic salary)
   */
  private calculatePF(basicSalary: number): number {
    return Math.round(basicSalary * 0.12);
  }

  /**
   * Calculate ESI deduction (0.75% of gross salary up to 21,000)
   */
  private calculateESI(grossSalary: number): number {
    if (grossSalary <= 21000) {
      return Math.round(grossSalary * 0.0075);
    }
    return 0;
  }

  /**
   * Calculate Professional Tax (state-specific, using Karnataka rates as example)
   */
  private calculateProfessionalTax(grossSalary: number): number {
    if (grossSalary <= 15000) {
      return 0;
    } else if (grossSalary <= 20000) {
      return 150;
    } else {
      return 200;
    }
  }

  // ============================================================================
  // KPI TRACKING
  // ============================================================================

  /**
   * Record KPI metric for employee
   */
  async recordKPIMetric(request: KPIMetricRequest) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: request.employeeId }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Calculate score based on achievement percentage
      const achievementPercentage = (request.actualValue / request.targetValue) * 100;
      const score = Math.min(achievementPercentage * request.weightage / 100, request.weightage);

      const kpiMetric = await prisma.kPIMetric.upsert({
        where: {
          employeeId_metricName_period: {
            employeeId: request.employeeId,
            metricName: request.metricName,
            period: request.period
          }
        },
        update: {
          targetValue: request.targetValue,
          actualValue: request.actualValue,
          weightage: request.weightage,
          score,
          jobDescRef: request.jobDescRef || null,
          updatedAt: new Date()
        },
        create: {
          employeeId: request.employeeId,
          metricName: request.metricName,
          targetValue: request.targetValue,
          actualValue: request.actualValue,
          period: request.period,
          weightage: request.weightage,
          score,
          jobDescRef: request.jobDescRef || null
        }
      });

      logger.info(`KPI metric recorded for employee: ${employee.employeeCode}, metric: ${request.metricName}`);
      return kpiMetric;

    } catch (error) {
      logger.error('Error recording KPI metric:', error);
      throw error;
    }
  }

  /**
   * Get KPI summary for employee
   */
  async getKPISummary(employeeId: string, period: string) {
    try {
      const metrics = await prisma.kPIMetric.findMany({
        where: {
          employeeId,
          period
        }
      });

      const totalWeightage = metrics.reduce((sum, metric) => sum + metric.weightage, 0);
      const totalScore = metrics.reduce((sum, metric) => sum + metric.score, 0);
      const overallScore = totalWeightage > 0 ? (totalScore / totalWeightage) * 100 : 0;

      return {
        metrics,
        summary: {
          totalMetrics: metrics.length,
          totalWeightage,
          totalScore,
          overallScore,
          period
        }
      };

    } catch (error) {
      logger.error('Error getting KPI summary:', error);
      throw error;
    }
  }

  // ============================================================================
  // LEAVE MANAGEMENT
  // ============================================================================

  /**
   * Submit leave request
   */
  async submitLeaveRequest(request: LeaveRequestData) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: request.employeeId },
        include: { manager: true }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Calculate number of days
      const fromDate = new Date(request.fromDate);
      const toDate = new Date(request.toDate);
      const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const leaveRequest = await prisma.leaveRequest.create({
        data: {
          employeeId: request.employeeId,
          leaveType: request.leaveType,
          fromDate,
          toDate,
          days,
          reason: request.reason,
          status: 'PENDING'
        }
      });

      logger.info(`Leave request submitted for employee: ${employee.employeeCode}`);
      return leaveRequest;

    } catch (error) {
      logger.error('Error submitting leave request:', error);
      throw error;
    }
  }

  /**
   * Approve/Reject leave request
   */
  async processLeaveRequest(requestId: string, status: 'APPROVED' | 'REJECTED', approvedBy: string, remarks?: string) {
    try {
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: requestId },
        include: { employee: true }
      });

      if (!leaveRequest) {
        throw new Error('Leave request not found');
      }

      if (leaveRequest.status !== 'PENDING') {
        throw new Error('Leave request already processed');
      }

      const updatedRequest = await prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          status,
          approvedBy,
          approvedAt: new Date(),
          remarks: remarks || null
        }
      });

      logger.info(`Leave request ${status.toLowerCase()} for employee: ${leaveRequest.employee.employeeCode}`);
      return updatedRequest;

    } catch (error) {
      logger.error('Error processing leave request:', error);
      throw error;
    }
  }

  /**
   * Get leave balance for employee
   */
  async getLeaveBalance(employeeId: string, year: number) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Get approved leave requests for the year
      const approvedLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId,
          status: 'APPROVED',
          fromDate: {
            gte: new Date(`${year}-01-01`),
            lte: new Date(`${year}-12-31`)
          }
        }
      });

      // Calculate leave balances (standard allocation)
      const leaveAllocation = {
        CASUAL: 12,
        SICK: 12,
        EARNED: 21,
        MATERNITY: 180, // Only for eligible employees
        PATERNITY: 15   // Only for eligible employees
      };

      const usedLeaves = approvedLeaves.reduce((acc, leave) => {
        acc[leave.leaveType] = (acc[leave.leaveType] || 0) + leave.days;
        return acc;
      }, {} as Record<string, number>);

      const leaveBalance = Object.entries(leaveAllocation).map(([type, allocated]) => ({
        leaveType: type,
        allocated,
        used: usedLeaves[type] || 0,
        balance: allocated - (usedLeaves[type] || 0)
      }));

      return {
        employeeId,
        year,
        leaveBalance
      };

    } catch (error) {
      logger.error('Error getting leave balance:', error);
      throw error;
    }
  }

  // ============================================================================
  // PERFORMANCE MANAGEMENT AND APPRAISAL SYSTEM
  // ============================================================================

  /**
   * Create performance review
   */
  async createPerformanceReview(request: PerformanceReviewRequest, createdBy: string) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: request.employeeId }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Check if review already exists for the period and type
      const existingReview = await prisma.performanceReview.findUnique({
        where: {
          employeeId_reviewPeriod_reviewType: {
            employeeId: request.employeeId,
            reviewPeriod: request.reviewPeriod,
            reviewType: request.reviewType
          }
        }
      });

      if (existingReview) {
        throw new Error('Performance review already exists for this period and type');
      }

      const review = await prisma.performanceReview.create({
        data: {
          employeeId: request.employeeId,
          reviewPeriod: request.reviewPeriod,
          reviewType: request.reviewType,
          reviewerIds: JSON.stringify(request.reviewerIds),
          goals: request.goals || null,
          developmentPlan: request.developmentPlan || null,
          overallScore: 0,
          overallRating: 'MEETS',
          createdBy
        }
      });

      logger.info(`Performance review created for employee: ${employee.employeeCode}, period: ${request.reviewPeriod}`);
      return review;

    } catch (error) {
      logger.error('Error creating performance review:', error);
      throw error;
    }
  }

  /**
   * Add appraisal item to performance review
   */
  async addAppraisalItem(request: AppraisalItemRequest) {
    try {
      const review = await prisma.performanceReview.findUnique({
        where: { id: request.reviewId }
      });

      if (!review) {
        throw new Error('Performance review not found');
      }

      if (review.status !== 'DRAFT') {
        throw new Error('Cannot modify appraisal items for submitted review');
      }

      // Calculate score based on rating and weightage
      const score = (request.managerRating / 5) * request.weightage;

      const appraisalItem = await prisma.appraisalItem.create({
        data: {
          reviewId: request.reviewId,
          category: request.category,
          criterion: request.criterion,
          description: request.description || null,
          targetValue: request.targetValue || null,
          actualValue: request.actualValue || null,
          managerRating: request.managerRating,
          weightage: request.weightage,
          score,
          comments: request.comments || null,
          evidences: request.evidences ? JSON.stringify(request.evidences) : null,
          jobDescRef: request.jobDescRef || null,
          kpiMetricId: request.kpiMetricId || null
        }
      });

      // Recalculate overall score for the review
      await this.recalculateReviewScore(request.reviewId);

      logger.info(`Appraisal item added to review: ${request.reviewId}`);
      return appraisalItem;

    } catch (error) {
      logger.error('Error adding appraisal item:', error);
      throw error;
    }
  }

  /**
   * Submit self-assessment for performance review
   */
  async submitSelfAssessment(request: SelfAssessmentRequest) {
    try {
      const review = await prisma.performanceReview.findUnique({
        where: { id: request.reviewId },
        include: { appraisalItems: true }
      });

      if (!review) {
        throw new Error('Performance review not found');
      }

      if (review.status !== 'DRAFT') {
        throw new Error('Cannot submit self-assessment for non-draft review');
      }

      // Update appraisal items with self-ratings
      const updatePromises = review.appraisalItems.map(item => {
        const selfRating = request.selfRatings[item.id];
        if (selfRating !== undefined) {
          return prisma.appraisalItem.update({
            where: { id: item.id },
            data: { selfRating }
          });
        }
        return Promise.resolve(item);
      });

      await Promise.all(updatePromises);

      // Update review with self-assessment data
      const updatedReview = await prisma.performanceReview.update({
        where: { id: request.reviewId },
        data: {
          selfAssessment: JSON.stringify(request.selfAssessment),
          status: 'SUBMITTED',
          submittedAt: new Date()
        }
      });

      logger.info(`Self-assessment submitted for review: ${request.reviewId}`);
      return updatedReview;

    } catch (error) {
      logger.error('Error submitting self-assessment:', error);
      throw error;
    }
  }

  /**
   * Complete performance review with manager comments
   */
  async completePerformanceReview(reviewId: string, managerComments: string, hrComments?: string, completedBy?: string) {
    try {
      const review = await prisma.performanceReview.findUnique({
        where: { id: reviewId },
        include: { 
          appraisalItems: true,
          employee: true
        }
      });

      if (!review) {
        throw new Error('Performance review not found');
      }

      if (review.status !== 'SUBMITTED') {
        throw new Error('Review must be submitted before completion');
      }

      // Calculate final overall rating based on score
      const overallRating = this.calculateOverallRating(review.overallScore);

      // Determine promotion and incentive eligibility
      const promotionEligible = review.overallScore >= 80; // 80% and above
      const incentiveEligible = review.overallScore >= 70; // 70% and above

      const updatedReview = await prisma.performanceReview.update({
        where: { id: reviewId },
        data: {
          managerComments,
          hrComments: hrComments || null,
          overallRating,
          promotionEligible,
          incentiveEligible,
          status: 'COMPLETED',
          completedAt: new Date(),
          updatedBy: completedBy || null
        }
      });

      logger.info(`Performance review completed for employee: ${review.employee.employeeCode}`);
      return updatedReview;

    } catch (error) {
      logger.error('Error completing performance review:', error);
      throw error;
    }
  }

  /**
   * Get performance review with all details
   */
  async getPerformanceReview(reviewId: string) {
    try {
      const review = await prisma.performanceReview.findUnique({
        where: { id: reviewId },
        include: {
          employee: {
            include: {
              branch: true,
              manager: true
            }
          },
          appraisalItems: {
            include: {
              kpiMetric: true
            }
          },
          promotions: true,
          incentives: true
        }
      });

      if (!review) {
        throw new Error('Performance review not found');
      }

      return review;

    } catch (error) {
      logger.error('Error getting performance review:', error);
      throw error;
    }
  }

  /**
   * Get employee performance history
   */
  async getEmployeePerformanceHistory(employeeId: string, limit: number = 10) {
    try {
      const reviews = await prisma.performanceReview.findMany({
        where: { employeeId },
        include: {
          appraisalItems: true,
          promotions: true,
          incentives: true
        },
        orderBy: { reviewPeriod: 'desc' },
        take: limit
      });

      // Calculate performance trends
      const performanceTrend = reviews.map(review => ({
        period: review.reviewPeriod,
        score: review.overallScore,
        rating: review.overallRating
      }));

      return {
        reviews,
        performanceTrend,
        totalReviews: reviews.length
      };

    } catch (error) {
      logger.error('Error getting employee performance history:', error);
      throw error;
    }
  }

  /**
   * Process promotion based on performance review
   */
  async processPromotion(request: PromotionRequest) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: request.employeeId }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Calculate salary increase percentage if not provided
      let salaryIncrease = request.salaryIncrease;
      if (request.toSalary && employee.salary) {
        salaryIncrease = ((request.toSalary - employee.salary) / employee.salary) * 100;
      }

      const promotion = await prisma.promotion.create({
        data: {
          employeeId: request.employeeId,
          reviewId: request.reviewId || null,
          fromDesignation: employee.designation,
          toDesignation: request.toDesignation,
          fromSalary: employee.salary || 0,
          toSalary: request.toSalary,
          salaryIncrease,
          effectiveDate: request.effectiveDate,
          reason: request.reason,
          approvedBy: request.approvedBy,
          approvedAt: new Date(),
          status: 'APPROVED'
        }
      });

      // Update employee record with new designation and salary
      await prisma.employee.update({
        where: { id: request.employeeId },
        data: {
          designation: request.toDesignation,
          salary: request.toSalary
        }
      });

      logger.info(`Promotion processed for employee: ${employee.employeeCode}`);
      return promotion;

    } catch (error) {
      logger.error('Error processing promotion:', error);
      throw error;
    }
  }

  /**
   * Calculate and award incentive
   */
  async awardIncentive(request: IncentiveRequest) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: request.employeeId }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const incentive = await prisma.incentive.create({
        data: {
          employeeId: request.employeeId,
          reviewId: request.reviewId || null,
          incentiveType: request.incentiveType,
          amount: request.amount,
          period: request.period,
          criteria: request.criteria,
          kpiMetrics: request.kpiMetrics ? JSON.stringify(request.kpiMetrics) : null,
          calculationBase: request.calculationBase || null,
          approvedBy: request.approvedBy,
          approvedAt: new Date(),
          status: 'APPROVED'
        }
      });

      logger.info(`Incentive awarded to employee: ${employee.employeeCode}, amount: ${request.amount}`);
      return incentive;

    } catch (error) {
      logger.error('Error awarding incentive:', error);
      throw error;
    }
  }

  /**
   * Get organizational hierarchy
   */
  async getOrganizationalHierarchy(branchId?: string) {
    try {
      const whereClause: any = {
        isActive: true
      };

      if (branchId) {
        whereClause.employee = {
          branchId
        };
      }

      const hierarchy = await prisma.organizationalHierarchy.findMany({
        where: whereClause,
        include: {
          employee: {
            include: {
              branch: true
            }
          }
        },
        orderBy: [
          { level: 'asc' },
          { department: 'asc' }
        ]
      });

      // Build hierarchical structure
      const hierarchyMap = new Map();
      const rootNodes: any[] = [];

      hierarchy.forEach(item => {
        const node = {
          ...item,
          children: []
        };
        hierarchyMap.set(item.employeeId, node);

        if (!item.reportingTo) {
          rootNodes.push(node);
        }
      });

      // Build parent-child relationships
      hierarchy.forEach(item => {
        if (item.reportingTo) {
          const parent = hierarchyMap.get(item.reportingTo);
          const child = hierarchyMap.get(item.employeeId);
          if (parent && child) {
            parent.children.push(child);
          }
        }
      });

      return {
        hierarchy: rootNodes,
        totalEmployees: hierarchy.length
      };

    } catch (error) {
      logger.error('Error getting organizational hierarchy:', error);
      throw error;
    }
  }

  /**
   * Update organizational hierarchy
   */
  async updateOrganizationalHierarchy(employeeId: string, level: number, department: string, designation: string, reportingTo?: string) {
    try {
      // End current hierarchy record
      await prisma.organizationalHierarchy.updateMany({
        where: {
          employeeId,
          isActive: true
        },
        data: {
          isActive: false,
          effectiveTo: new Date()
        }
      });

      // Create new hierarchy record
      const hierarchy = await prisma.organizationalHierarchy.create({
        data: {
          employeeId,
          level,
          department,
          designation,
          reportingTo: reportingTo || null,
          effectiveFrom: new Date()
        }
      });

      logger.info(`Organizational hierarchy updated for employee: ${employeeId}`);
      return hierarchy;

    } catch (error) {
      logger.error('Error updating organizational hierarchy:', error);
      throw error;
    }
  }

  // ============================================================================
  // TRAINING AND DEVELOPMENT
  // ============================================================================

  /**
   * Create training program
   */
  async createTrainingProgram(request: TrainingProgramRequest, createdBy: string) {
    try {
      const program = await prisma.trainingProgram.create({
        data: {
          ...request,
          createdBy
        }
      });

      logger.info(`Training program created: ${program.name}`);
      return program;

    } catch (error) {
      logger.error('Error creating training program:', error);
      throw error;
    }
  }

  /**
   * Enroll employee in training program
   */
  async enrollInTraining(request: TrainingEnrollmentRequest, createdBy: string) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: request.employeeId }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const program = await prisma.trainingProgram.findUnique({
        where: { id: request.programId }
      });

      if (!program) {
        throw new Error('Training program not found');
      }

      // Check if already enrolled
      const existingEnrollment = await prisma.trainingEnrollment.findUnique({
        where: {
          employeeId_programId: {
            employeeId: request.employeeId,
            programId: request.programId
          }
        }
      });

      if (existingEnrollment) {
        throw new Error('Employee already enrolled in this program');
      }

      const enrollment = await prisma.trainingEnrollment.create({
        data: {
          employeeId: request.employeeId,
          programId: request.programId,
          startDate: request.startDate || null,
          createdBy
        }
      });

      logger.info(`Employee enrolled in training: ${employee.employeeCode} -> ${program.name}`);
      return enrollment;

    } catch (error) {
      logger.error('Error enrolling in training:', error);
      throw error;
    }
  }

  /**
   * Complete training enrollment
   */
  async completeTraining(enrollmentId: string, score?: number, feedback?: string, certificateUrl?: string) {
    try {
      const enrollment = await prisma.trainingEnrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          employee: true,
          program: true
        }
      });

      if (!enrollment) {
        throw new Error('Training enrollment not found');
      }

      const updatedEnrollment = await prisma.trainingEnrollment.update({
        where: { id: enrollmentId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          score: score || null,
          feedback: feedback || null,
          certificateUrl: certificateUrl || null
        }
      });

      logger.info(`Training completed: ${enrollment.employee.employeeCode} -> ${enrollment.program.name}`);
      return updatedEnrollment;

    } catch (error) {
      logger.error('Error completing training:', error);
      throw error;
    }
  }

  /**
   * Get employee training history
   */
  async getEmployeeTrainingHistory(employeeId: string) {
    try {
      const trainings = await prisma.trainingEnrollment.findMany({
        where: { employeeId },
        include: {
          program: true
        },
        orderBy: { enrolledAt: 'desc' }
      });

      const summary = {
        totalEnrollments: trainings.length,
        completedTrainings: trainings.filter(t => t.status === 'COMPLETED').length,
        inProgressTrainings: trainings.filter(t => t.status === 'IN_PROGRESS').length,
        totalHours: trainings
          .filter(t => t.status === 'COMPLETED')
          .reduce((sum, t) => sum + t.program.duration, 0)
      };

      return {
        trainings,
        summary
      };

    } catch (error) {
      logger.error('Error getting employee training history:', error);
      throw error;
    }
  }

  // ============================================================================
  // PERFORMANCE ANALYTICS AND REPORTING
  // ============================================================================

  /**
   * Get performance analytics for branch/department
   */
  async getPerformanceAnalytics(branchId?: string, department?: string, period?: string) {
    try {
      const whereClause: any = {};
      
      if (period) {
        whereClause.reviewPeriod = period;
      }

      if (branchId || department) {
        whereClause.employee = {};
        if (branchId) {
          whereClause.employee.branchId = branchId;
        }
        if (department) {
          whereClause.employee.department = department;
        }
      }

      const reviews = await prisma.performanceReview.findMany({
        where: whereClause,
        include: {
          employee: {
            include: {
              branch: true
            }
          },
          appraisalItems: true
        }
      });

      // Calculate analytics
      const totalReviews = reviews.length;
      const averageScore = reviews.reduce((sum, r) => sum + r.overallScore, 0) / totalReviews || 0;
      
      const ratingDistribution = reviews.reduce((acc, r) => {
        acc[r.overallRating] = (acc[r.overallRating] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const promotionEligible = reviews.filter(r => r.promotionEligible).length;
      const incentiveEligible = reviews.filter(r => r.incentiveEligible).length;

      // Department-wise analytics
      const departmentAnalytics = reviews.reduce((acc, r) => {
        const dept = r.employee.department;
        if (!acc[dept]) {
          acc[dept] = {
            totalReviews: 0,
            averageScore: 0,
            scores: []
          };
        }
        acc[dept].totalReviews++;
        acc[dept].scores.push(r.overallScore);
        return acc;
      }, {} as Record<string, any>);

      // Calculate department averages
      Object.keys(departmentAnalytics).forEach(dept => {
        const scores = departmentAnalytics[dept].scores;
        departmentAnalytics[dept].averageScore = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
        delete departmentAnalytics[dept].scores;
      });

      return {
        totalReviews,
        averageScore,
        ratingDistribution,
        promotionEligible,
        incentiveEligible,
        departmentAnalytics,
        period: period || 'All periods'
      };

    } catch (error) {
      logger.error('Error getting performance analytics:', error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Recalculate overall score for performance review
   */
  private async recalculateReviewScore(reviewId: string) {
    try {
      const appraisalItems = await prisma.appraisalItem.findMany({
        where: { reviewId }
      });

      const totalWeightage = appraisalItems.reduce((sum, item) => sum + item.weightage, 0);
      const totalScore = appraisalItems.reduce((sum, item) => sum + item.score, 0);
      
      const overallScore = totalWeightage > 0 ? (totalScore / totalWeightage) * 100 : 0;

      await prisma.performanceReview.update({
        where: { id: reviewId },
        data: { overallScore }
      });

      return overallScore;

    } catch (error) {
      logger.error('Error recalculating review score:', error);
      throw error;
    }
  }

  /**
   * Calculate overall rating based on score
   */
  private calculateOverallRating(score: number): string {
    if (score >= 90) return 'OUTSTANDING';
    if (score >= 80) return 'EXCEEDS';
    if (score >= 70) return 'MEETS';
    if (score >= 60) return 'BELOW';
    return 'UNSATISFACTORY';
  }
}

export const hrService = new HRService();
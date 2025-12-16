// Employee Portal Service - Self-service functionality for employees
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { hrService } from './hr.service';

const prisma = new PrismaClient();

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface EmployeeProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
}

export interface EmployeeLeaveRequestData {
  leaveType: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
}

export interface EmployeeNotificationRequest {
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  targetEmployees?: string[]; // If empty, send to all
  targetDepartments?: string[];
  targetBranches?: string[];
  expiresAt?: Date;
}

export interface SelfAssessmentSubmission {
  reviewId: string;
  responses: Record<string, any>;
  selfRatings: Record<string, number>;
  comments?: string;
}

// ============================================================================
// EMPLOYEE PORTAL SERVICE
// ============================================================================

export class EmployeePortalService {

  // ============================================================================
  // AUTHENTICATION AND PROFILE MANAGEMENT
  // ============================================================================

  /**
   * Get employee dashboard data
   */
  async getEmployeeDashboard(employeeId: string) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          branch: true,
          manager: true,
          user: true,
          attendance: {
            where: {
              date: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Current month
              }
            },
            orderBy: { date: 'desc' }
          },
          leaveRequests: {
            where: {
              status: 'PENDING'
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          kpiMetrics: {
            where: {
              period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
            }
          },
          performanceReviews: {
            where: {
              status: { in: ['DRAFT', 'SUBMITTED'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Calculate attendance summary for current month
      const attendanceSummary = {
        totalDays: employee.attendance.length,
        presentDays: employee.attendance.filter(a => a.isPresent).length,
        totalWorkingHours: employee.attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0),
        totalOvertimeHours: employee.attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0)
      };

      // Get recent notifications
      const notifications = await this.getEmployeeNotifications(employeeId, 1, 5);

      // Get leave balance for current year
      const leaveBalance = await hrService.getLeaveBalance(employeeId, new Date().getFullYear());

      return {
        employee: {
          id: employee.id,
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          designation: employee.designation,
          department: employee.department,
          dateOfJoining: employee.dateOfJoining,
          branch: employee.branch,
          manager: employee.manager
        },
        attendanceSummary,
        pendingLeaveRequests: employee.leaveRequests,
        leaveBalance: leaveBalance.leaveBalance,
        kpiMetrics: employee.kpiMetrics,
        activePerformanceReview: employee.performanceReviews[0] || null,
        recentNotifications: notifications.notifications
      };

    } catch (error) {
      logger.error('Error getting employee dashboard:', error);
      throw error;
    }
  }

  /**
   * Get employee profile with personal information
   */
  async getEmployeeProfile(employeeId: string) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          branch: true,
          manager: true,
          user: true,
          subordinates: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              designation: true
            }
          }
        }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      return employee;

    } catch (error) {
      logger.error('Error getting employee profile:', error);
      throw error;
    }
  }

  /**
   * Update employee profile (limited fields)
   */
  async updateEmployeeProfile(employeeId: string, updates: EmployeeProfileUpdateRequest) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Only allow updating specific fields
      const allowedUpdates: any = {};
      
      if (updates.firstName !== undefined) allowedUpdates.firstName = updates.firstName;
      if (updates.lastName !== undefined) allowedUpdates.lastName = updates.lastName;
      if (updates.email !== undefined) allowedUpdates.email = updates.email;
      if (updates.phone !== undefined) allowedUpdates.phone = updates.phone;
      if (updates.dateOfBirth !== undefined) allowedUpdates.dateOfBirth = updates.dateOfBirth;

      const updatedEmployee = await prisma.employee.update({
        where: { id: employeeId },
        data: {
          ...allowedUpdates,
          updatedAt: new Date(),
          updatedBy: employeeId
        },
        include: {
          branch: true,
          manager: true
        }
      });

      logger.info(`Employee profile updated: ${updatedEmployee.employeeCode}`);
      return updatedEmployee;

    } catch (error) {
      logger.error('Error updating employee profile:', error);
      throw error;
    }
  }

  // ============================================================================
  // ATTENDANCE HISTORY AND TRACKING
  // ============================================================================

  /**
   * Get employee attendance history
   */
  async getEmployeeAttendanceHistory(employeeId: string, fromDate: Date, toDate: Date) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      return await hrService.getAttendanceReport(employeeId, fromDate, toDate);

    } catch (error) {
      logger.error('Error getting employee attendance history:', error);
      throw error;
    }
  }

  /**
   * Get current month attendance summary
   */
  async getCurrentMonthAttendance(employeeId: string) {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      return await this.getEmployeeAttendanceHistory(employeeId, firstDay, lastDay);

    } catch (error) {
      logger.error('Error getting current month attendance:', error);
      throw error;
    }
  }

  // ============================================================================
  // LEAVE MANAGEMENT
  // ============================================================================

  /**
   * Submit leave request through employee portal
   */
  async submitLeaveRequest(employeeId: string, request: EmployeeLeaveRequestData) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Check leave balance before submitting
      const leaveBalance = await hrService.getLeaveBalance(employeeId, new Date().getFullYear());
      const typeBalance = leaveBalance.leaveBalance.find(lb => lb.leaveType === request.leaveType);

      if (!typeBalance) {
        throw new Error(`Invalid leave type: ${request.leaveType}`);
      }

      // Calculate requested days
      const fromDate = new Date(request.fromDate);
      const toDate = new Date(request.toDate);
      const requestedDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (requestedDays > typeBalance.balance) {
        throw new Error(`Insufficient leave balance. Available: ${typeBalance.balance} days, Requested: ${requestedDays} days`);
      }

      const leaveRequestData = {
        employeeId,
        leaveType: request.leaveType,
        fromDate: request.fromDate,
        toDate: request.toDate,
        reason: request.reason
      };

      return await hrService.submitLeaveRequest(leaveRequestData);

    } catch (error) {
      logger.error('Error submitting leave request:', error);
      throw error;
    }
  }

  /**
   * Get employee leave requests history
   */
  async getEmployeeLeaveRequests(employeeId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [leaveRequests, total] = await Promise.all([
        prisma.leaveRequest.findMany({
          where: { employeeId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.leaveRequest.count({
          where: { employeeId }
        })
      ]);

      return {
        leaveRequests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('Error getting employee leave requests:', error);
      throw error;
    }
  }

  /**
   * Get employee leave balance
   */
  async getEmployeeLeaveBalance(employeeId: string, year?: number) {
    try {
      const targetYear = year || new Date().getFullYear();
      return await hrService.getLeaveBalance(employeeId, targetYear);

    } catch (error) {
      logger.error('Error getting employee leave balance:', error);
      throw error;
    }
  }

  // ============================================================================
  // PAYROLL ACCESS
  // ============================================================================

  /**
   * Get employee payroll records
   */
  async getEmployeePayrollRecords(employeeId: string, page: number = 1, limit: number = 12) {
    try {
      const skip = (page - 1) * limit;

      const [payrollRecords, total] = await Promise.all([
        prisma.payrollRecord.findMany({
          where: { 
            employeeId,
            status: 'PROCESSED' // Only show processed payroll
          },
          orderBy: { period: 'desc' },
          skip,
          take: limit
        }),
        prisma.payrollRecord.count({
          where: { 
            employeeId,
            status: 'PROCESSED'
          }
        })
      ]);

      return {
        payrollRecords,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('Error getting employee payroll records:', error);
      throw error;
    }
  }

  /**
   * Get specific payroll record (salary slip)
   */
  async getPayrollRecord(employeeId: string, period: string) {
    try {
      const payrollRecord = await prisma.payrollRecord.findUnique({
        where: {
          employeeId_period: {
            employeeId,
            period
          }
        },
        include: {
          employee: {
            include: {
              branch: true
            }
          }
        }
      });

      if (!payrollRecord) {
        throw new Error('Payroll record not found');
      }

      if (payrollRecord.status !== 'PROCESSED') {
        throw new Error('Payroll record is not yet processed');
      }

      return payrollRecord;

    } catch (error) {
      logger.error('Error getting payroll record:', error);
      throw error;
    }
  }

  // ============================================================================
  // KPI TRACKING AND PERFORMANCE
  // ============================================================================

  /**
   * Get employee KPI metrics
   */
  async getEmployeeKPIMetrics(employeeId: string, period?: string) {
    try {
      const targetPeriod = period || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      
      return await hrService.getKPISummary(employeeId, targetPeriod);

    } catch (error) {
      logger.error('Error getting employee KPI metrics:', error);
      throw error;
    }
  }

  /**
   * Get employee performance review for self-assessment
   */
  async getEmployeePerformanceReview(employeeId: string, reviewId: string) {
    try {
      const review = await prisma.performanceReview.findUnique({
        where: { 
          id: reviewId,
          employeeId // Ensure employee can only access their own reviews
        },
        include: {
          appraisalItems: {
            include: {
              kpiMetric: true
            }
          }
        }
      });

      if (!review) {
        throw new Error('Performance review not found or access denied');
      }

      return review;

    } catch (error) {
      logger.error('Error getting employee performance review:', error);
      throw error;
    }
  }

  /**
   * Submit self-assessment for performance review
   */
  async submitSelfAssessment(employeeId: string, assessment: SelfAssessmentSubmission) {
    try {
      // Verify the review belongs to the employee
      const review = await prisma.performanceReview.findUnique({
        where: { 
          id: assessment.reviewId,
          employeeId
        }
      });

      if (!review) {
        throw new Error('Performance review not found or access denied');
      }

      if (review.status !== 'DRAFT') {
        throw new Error('Self-assessment can only be submitted for draft reviews');
      }

      const selfAssessmentData = {
        reviewId: assessment.reviewId,
        selfAssessment: assessment.responses,
        selfRatings: assessment.selfRatings
      };

      return await hrService.submitSelfAssessment(selfAssessmentData);

    } catch (error) {
      logger.error('Error submitting self-assessment:', error);
      throw error;
    }
  }

  /**
   * Get employee performance history
   */
  async getEmployeePerformanceHistory(employeeId: string, limit: number = 5) {
    try {
      return await hrService.getEmployeePerformanceHistory(employeeId, limit);

    } catch (error) {
      logger.error('Error getting employee performance history:', error);
      throw error;
    }
  }

  // ============================================================================
  // NOTIFICATIONS AND ANNOUNCEMENTS
  // ============================================================================

  /**
   * Get employee notifications
   */
  async getEmployeeNotifications(employeeId: string, page: number = 1, limit: number = 20) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { department: true, branchId: true }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const skip = (page - 1) * limit;

      // Get all notifications and filter in application logic
      const [allNotifications, total] = await Promise.all([
        prisma.employeeNotification.findMany({
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.employeeNotification.count({
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        })
      ]);

      // Filter notifications based on targeting
      const notifications = allNotifications.filter(notification => {
        const targetEmployees = notification.targetEmployees ? JSON.parse(notification.targetEmployees) : [];
        const targetDepartments = notification.targetDepartments ? JSON.parse(notification.targetDepartments) : [];
        const targetBranches = notification.targetBranches ? JSON.parse(notification.targetBranches) : [];

        // Global notification (no specific targets)
        if (targetEmployees.length === 0 && targetDepartments.length === 0 && targetBranches.length === 0) {
          return true;
        }

        // Check if employee is specifically targeted
        if (targetEmployees.includes(employeeId)) {
          return true;
        }

        // Check if employee's department is targeted
        if (targetDepartments.includes(employee.department)) {
          return true;
        }

        // Check if employee's branch is targeted
        if (targetBranches.includes(employee.branchId)) {
          return true;
        }

        return false;
      }).slice(skip, skip + limit);

      const filteredTotal = allNotifications.filter(notification => {
        const targetEmployees = notification.targetEmployees ? JSON.parse(notification.targetEmployees) : [];
        const targetDepartments = notification.targetDepartments ? JSON.parse(notification.targetDepartments) : [];
        const targetBranches = notification.targetBranches ? JSON.parse(notification.targetBranches) : [];

        if (targetEmployees.length === 0 && targetDepartments.length === 0 && targetBranches.length === 0) {
          return true;
        }

        return targetEmployees.includes(employeeId) || 
               targetDepartments.includes(employee.department) || 
               targetBranches.includes(employee.branchId);
      }).length;

      return {
        notifications,
        pagination: {
          page,
          limit,
          total: filteredTotal,
          pages: Math.ceil(filteredTotal / limit)
        }
      };

    } catch (error) {
      logger.error('Error getting employee notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(employeeId: string, notificationId: string) {
    try {
      // Check if read record already exists
      const existingRead = await prisma.notificationRead.findUnique({
        where: {
          employeeId_notificationId: {
            employeeId,
            notificationId
          }
        }
      });

      if (existingRead) {
        return existingRead;
      }

      const readRecord = await prisma.notificationRead.create({
        data: {
          employeeId,
          notificationId,
          readAt: new Date()
        }
      });

      return readRecord;

    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Create employee notification (for HR/Admin use)
   */
  async createEmployeeNotification(request: EmployeeNotificationRequest, createdBy: string) {
    try {
      const notification = await prisma.employeeNotification.create({
        data: {
          title: request.title,
          message: request.message,
          type: request.type,
          targetEmployees: request.targetEmployees ? JSON.stringify(request.targetEmployees) : null,
          targetDepartments: request.targetDepartments ? JSON.stringify(request.targetDepartments) : null,
          targetBranches: request.targetBranches ? JSON.stringify(request.targetBranches) : null,
          expiresAt: request.expiresAt || null,
          createdBy
        }
      });

      logger.info(`Employee notification created: ${notification.title}`);
      return notification;

    } catch (error) {
      logger.error('Error creating employee notification:', error);
      throw error;
    }
  }

  // ============================================================================
  // EMPLOYEE DIRECTORY AND ORGANIZATIONAL CHART
  // ============================================================================

  /**
   * Get employee directory
   */
  async getEmployeeDirectory(employeeId: string, branchId?: string, department?: string, page: number = 1, limit: number = 50) {
    try {
      const requestingEmployee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { branchId: true }
      });

      if (!requestingEmployee) {
        throw new Error('Employee not found');
      }

      const skip = (page - 1) * limit;
      const whereClause: any = {
        isActive: true,
        isDeleted: false
      };

      // If no specific branch requested, show employees from same branch
      if (branchId) {
        whereClause.branchId = branchId;
      } else {
        whereClause.branchId = requestingEmployee.branchId;
      }

      if (department) {
        whereClause.department = department;
      }

      const [employees, total] = await Promise.all([
        prisma.employee.findMany({
          where: whereClause,
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            designation: true,
            department: true,
            branch: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true
              }
            },
            manager: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                designation: true
              }
            }
          },
          orderBy: [
            { department: 'asc' },
            { designation: 'asc' },
            { firstName: 'asc' }
          ],
          skip,
          take: limit
        }),
        prisma.employee.count({
          where: whereClause
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
      logger.error('Error getting employee directory:', error);
      throw error;
    }
  }

  /**
   * Get organizational chart for employee's branch
   */
  async getOrganizationalChart(employeeId: string) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { branchId: true }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      return await hrService.getOrganizationalHierarchy(employee.branchId);

    } catch (error) {
      logger.error('Error getting organizational chart:', error);
      throw error;
    }
  }

  // ============================================================================
  // DOCUMENT MANAGEMENT
  // ============================================================================

  /**
   * Upload employee document
   */
  async uploadEmployeeDocument(employeeId: string, documentType: string, fileName: string, filePath: string) {
    try {
      const document = await prisma.employeeDocument.create({
        data: {
          employeeId,
          documentType,
          fileName,
          filePath,
          uploadedAt: new Date()
        }
      });

      logger.info(`Document uploaded for employee: ${employeeId}, type: ${documentType}`);
      return document;

    } catch (error) {
      logger.error('Error uploading employee document:', error);
      throw error;
    }
  }

  /**
   * Get employee documents
   */
  async getEmployeeDocuments(employeeId: string) {
    try {
      const documents = await prisma.employeeDocument.findMany({
        where: { employeeId },
        orderBy: { uploadedAt: 'desc' }
      });

      return documents;

    } catch (error) {
      logger.error('Error getting employee documents:', error);
      throw error;
    }
  }
}

export const employeePortalService = new EmployeePortalService();
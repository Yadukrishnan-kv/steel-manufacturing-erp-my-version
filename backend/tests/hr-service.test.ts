// HR Service Functionality Tests
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock HR Service class for testing core functionality
class TestHRService {
  
  async createEmployee(employeeData: any, createdBy: string) {
    // Check if employee code already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeCode: employeeData.employeeCode }
    });

    if (existingEmployee) {
      throw new Error(`Employee with code ${employeeData.employeeCode} already exists`);
    }

    // Validate branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: employeeData.branchId }
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    const employee = await prisma.employee.create({
      data: {
        ...employeeData,
        createdBy
      },
      include: {
        branch: true
      }
    });

    return employee;
  }

  async processBiometricAttendance(attendanceData: any) {
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

    if (existingAttendance) {
      // Update existing record
      const attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkOut: attendanceData.checkOut || null,
          workingHours: attendanceData.workingHours || 0,
          overtimeHours: attendanceData.overtimeHours || 0,
          isPresent: true
        }
      });
      return attendance;
    } else {
      // Create new attendance record
      const attendance = await prisma.attendance.create({
        data: {
          employeeId: attendanceData.employeeId,
          date: attendanceData.date,
          checkIn: attendanceData.checkIn || null,
          checkOut: attendanceData.checkOut || null,
          workingHours: attendanceData.workingHours || 0,
          overtimeHours: attendanceData.overtimeHours || 0,
          isPresent: true
        }
      });
      return attendance;
    }
  }

  async calculatePayroll(payrollData: any) {
    const employee = await prisma.employee.findUnique({
      where: { id: payrollData.employeeId }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Calculate components
    const basicSalary = payrollData.basicSalary;
    const allowances = payrollData.allowances || 0;
    const overtimeAmount = (payrollData.overtimeHours || 0) * (payrollData.overtimeRate || 0);
    const grossSalary = basicSalary + allowances + overtimeAmount;

    // Calculate statutory deductions
    const pfDeduction = Math.round(basicSalary * 0.12); // 12% of basic salary
    const esiDeduction = grossSalary > 21000 ? 0 : Math.round(grossSalary * 0.0075); // 0.75% if <= 21000
    const taxDeduction = grossSalary <= 15000 ? 0 : grossSalary <= 20000 ? 150 : 200; // Professional tax

    const totalDeductions = pfDeduction + esiDeduction + taxDeduction;
    const netSalary = grossSalary - totalDeductions;

    const payroll = await prisma.payrollRecord.upsert({
      where: {
        employeeId_period: {
          employeeId: payrollData.employeeId,
          period: payrollData.period
        }
      },
      update: {
        basicSalary,
        allowances,
        overtime: overtimeAmount,
        grossSalary,
        pfDeduction,
        esiDeduction,
        taxDeduction,
        otherDeductions: 0,
        netSalary,
        status: 'DRAFT'
      },
      create: {
        employeeId: payrollData.employeeId,
        period: payrollData.period,
        basicSalary,
        allowances,
        overtime: overtimeAmount,
        grossSalary,
        pfDeduction,
        esiDeduction,
        taxDeduction,
        otherDeductions: 0,
        netSalary,
        status: 'DRAFT'
      }
    });

    return payroll;
  }

  async recordKPIMetric(kpiData: any) {
    const employee = await prisma.employee.findUnique({
      where: { id: kpiData.employeeId }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Calculate score based on achievement percentage
    const achievementPercentage = (kpiData.actualValue / kpiData.targetValue) * 100;
    const score = Math.min((achievementPercentage / 100) * kpiData.weightage, kpiData.weightage);

    const kpiMetric = await prisma.kPIMetric.upsert({
      where: {
        employeeId_metricName_period: {
          employeeId: kpiData.employeeId,
          metricName: kpiData.metricName,
          period: kpiData.period
        }
      },
      update: {
        targetValue: kpiData.targetValue,
        actualValue: kpiData.actualValue,
        weightage: kpiData.weightage,
        score,
        jobDescRef: kpiData.jobDescRef || null
      },
      create: {
        employeeId: kpiData.employeeId,
        metricName: kpiData.metricName,
        targetValue: kpiData.targetValue,
        actualValue: kpiData.actualValue,
        period: kpiData.period,
        weightage: kpiData.weightage,
        score,
        jobDescRef: kpiData.jobDescRef || null
      }
    });

    return kpiMetric;
  }

  async submitLeaveRequest(leaveData: any) {
    const employee = await prisma.employee.findUnique({
      where: { id: leaveData.employeeId }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Calculate number of days
    const fromDate = new Date(leaveData.fromDate);
    const toDate = new Date(leaveData.toDate);
    const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: leaveData.employeeId,
        leaveType: leaveData.leaveType,
        fromDate,
        toDate,
        days,
        reason: leaveData.reason,
        status: 'PENDING'
      }
    });

    return leaveRequest;
  }
}

describe('HR Service Functionality Tests', () => {
  let testBranchId: string;
  let testEmployeeId: string;
  let hrService: TestHRService;

  beforeAll(async () => {
    await prisma.$connect();
    hrService = new TestHRService();

    // Create test branch
    const branch = await prisma.branch.upsert({
      where: { code: 'HR-TEST-BR' },
      update: {},
      create: {
        code: 'HR-TEST-BR',
        name: 'HR Test Branch',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        phone: '1234567890'
      }
    });
    testBranchId = branch.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testEmployeeId) {
      await prisma.payrollRecord.deleteMany({ where: { employeeId: testEmployeeId } });
      await prisma.leaveRequest.deleteMany({ where: { employeeId: testEmployeeId } });
      await prisma.kPIMetric.deleteMany({ where: { employeeId: testEmployeeId } });
      await prisma.attendance.deleteMany({ where: { employeeId: testEmployeeId } });
      await prisma.employee.delete({ where: { id: testEmployeeId } });
    }
    await prisma.branch.deleteMany({ where: { code: 'HR-TEST-BR' } });
    await prisma.$disconnect();
  });

  describe('Employee Management', () => {
    it('should create a new employee', async () => {
      const employeeData = {
        employeeCode: 'HR-TEST-001',
        firstName: 'Test',
        lastName: 'Employee',
        email: 'test@example.com',
        phone: '9876543210',
        dateOfJoining: new Date('2023-01-01'),
        designation: 'Test Engineer',
        department: 'Testing',
        branchId: testBranchId,
        salary: 50000
      };

      const employee = await hrService.createEmployee(employeeData, 'test-user');
      testEmployeeId = employee.id;

      expect(employee).toBeDefined();
      expect(employee.employeeCode).toBe('HR-TEST-001');
      expect(employee.firstName).toBe('Test');
      expect(employee.lastName).toBe('Employee');
      expect(employee.branchId).toBe(testBranchId);
      expect(employee.branch).toBeDefined();
    });

    it('should throw error for duplicate employee code', async () => {
      const duplicateEmployeeData = {
        employeeCode: 'HR-TEST-001', // Same as above
        firstName: 'Duplicate',
        lastName: 'Employee',
        dateOfJoining: new Date('2023-01-01'),
        designation: 'Test Engineer',
        department: 'Testing',
        branchId: testBranchId
      };

      await expect(
        hrService.createEmployee(duplicateEmployeeData, 'test-user')
      ).rejects.toThrow('Employee with code HR-TEST-001 already exists');
    });

    it('should throw error for invalid branch', async () => {
      const employeeData = {
        employeeCode: 'HR-TEST-002',
        firstName: 'Test',
        lastName: 'Employee',
        dateOfJoining: new Date('2023-01-01'),
        designation: 'Test Engineer',
        department: 'Testing',
        branchId: 'invalid-branch-id'
      };

      await expect(
        hrService.createEmployee(employeeData, 'test-user')
      ).rejects.toThrow('Branch not found');
    });
  });

  describe('Attendance Management', () => {
    it('should process biometric attendance', async () => {
      const attendanceData = {
        employeeId: testEmployeeId,
        date: new Date('2023-12-15'),
        checkIn: new Date('2023-12-15T09:00:00'),
        checkOut: new Date('2023-12-15T18:00:00'),
        workingHours: 8,
        overtimeHours: 0
      };

      const attendance = await hrService.processBiometricAttendance(attendanceData);

      expect(attendance).toBeDefined();
      expect(attendance.employeeId).toBe(testEmployeeId);
      expect(attendance.isPresent).toBe(true);
      expect(attendance.workingHours).toBe(8);
      expect(attendance.overtimeHours).toBe(0);
    });

    it('should update existing attendance record', async () => {
      const attendanceData = {
        employeeId: testEmployeeId,
        date: new Date('2023-12-15'), // Same date as above
        checkOut: new Date('2023-12-15T19:00:00'), // Different checkout time
        workingHours: 9,
        overtimeHours: 1
      };

      const attendance = await hrService.processBiometricAttendance(attendanceData);

      expect(attendance).toBeDefined();
      expect(attendance.workingHours).toBe(9);
      expect(attendance.overtimeHours).toBe(1);
    });

    it('should throw error for invalid employee', async () => {
      const attendanceData = {
        employeeId: 'invalid-employee-id',
        date: new Date('2023-12-16'),
        checkIn: new Date('2023-12-16T09:00:00')
      };

      await expect(
        hrService.processBiometricAttendance(attendanceData)
      ).rejects.toThrow('Employee not found');
    });
  });

  describe('Payroll Management', () => {
    it('should calculate payroll correctly', async () => {
      const payrollData = {
        employeeId: testEmployeeId,
        period: '2023-12',
        basicSalary: 50000,
        allowances: 5000,
        overtimeHours: 10,
        overtimeRate: 500
      };

      const payroll = await hrService.calculatePayroll(payrollData);

      expect(payroll).toBeDefined();
      expect(payroll.employeeId).toBe(testEmployeeId);
      expect(payroll.period).toBe('2023-12');
      expect(payroll.basicSalary).toBe(50000);
      expect(payroll.allowances).toBe(5000);
      expect(payroll.overtime).toBe(5000); // 10 * 500
      expect(payroll.grossSalary).toBe(60000); // 50000 + 5000 + 5000
      expect(payroll.pfDeduction).toBe(6000); // 12% of 50000
      expect(payroll.esiDeduction).toBe(0); // No ESI for gross salary > 21000
      expect(payroll.taxDeduction).toBe(200); // Professional tax for > 20000
      expect(payroll.netSalary).toBe(53800); // 60000 - 6000 - 0 - 200
      expect(payroll.status).toBe('DRAFT');
    });

    it('should handle ESI exemption for high salary', async () => {
      const payrollData = {
        employeeId: testEmployeeId,
        period: '2024-01',
        basicSalary: 25000,
        allowances: 0,
        overtimeHours: 0,
        overtimeRate: 0
      };

      const payroll = await hrService.calculatePayroll(payrollData);

      expect(payroll.grossSalary).toBe(25000);
      expect(payroll.esiDeduction).toBe(0); // No ESI for salary > 21000
    });

    it('should throw error for invalid employee', async () => {
      const payrollData = {
        employeeId: 'invalid-employee-id',
        period: '2023-12',
        basicSalary: 50000
      };

      await expect(
        hrService.calculatePayroll(payrollData)
      ).rejects.toThrow('Employee not found');
    });
  });

  describe('KPI Management', () => {
    it('should record KPI metric', async () => {
      const kpiData = {
        employeeId: testEmployeeId,
        metricName: 'Code Quality',
        targetValue: 90,
        actualValue: 85,
        period: '2023-12',
        weightage: 30,
        jobDescRef: 'Quality standards'
      };

      const kpiMetric = await hrService.recordKPIMetric(kpiData);

      expect(kpiMetric).toBeDefined();
      expect(kpiMetric.employeeId).toBe(testEmployeeId);
      expect(kpiMetric.metricName).toBe('Code Quality');
      expect(kpiMetric.targetValue).toBe(90);
      expect(kpiMetric.actualValue).toBe(85);
      expect(kpiMetric.score).toBeCloseTo(28.33, 1); // (85/90) * 30
    });

    it('should update existing KPI metric', async () => {
      const kpiData = {
        employeeId: testEmployeeId,
        metricName: 'Code Quality', // Same metric name
        targetValue: 90,
        actualValue: 95, // Different actual value
        period: '2023-12',
        weightage: 30
      };

      const kpiMetric = await hrService.recordKPIMetric(kpiData);

      expect(kpiMetric.actualValue).toBe(95);
      expect(kpiMetric.score).toBe(30); // (95/90) * 30 = 31.67, but capped at 30
    });

    it('should throw error for invalid employee', async () => {
      const kpiData = {
        employeeId: 'invalid-employee-id',
        metricName: 'Test Metric',
        targetValue: 100,
        actualValue: 90,
        period: '2023-12',
        weightage: 25
      };

      await expect(
        hrService.recordKPIMetric(kpiData)
      ).rejects.toThrow('Employee not found');
    });
  });

  describe('Leave Management', () => {
    it('should submit leave request', async () => {
      const leaveData = {
        employeeId: testEmployeeId,
        leaveType: 'CASUAL',
        fromDate: new Date('2024-01-15'),
        toDate: new Date('2024-01-17'),
        reason: 'Personal work'
      };

      const leaveRequest = await hrService.submitLeaveRequest(leaveData);

      expect(leaveRequest).toBeDefined();
      expect(leaveRequest.employeeId).toBe(testEmployeeId);
      expect(leaveRequest.leaveType).toBe('CASUAL');
      expect(leaveRequest.days).toBe(3); // 15, 16, 17 = 3 days
      expect(leaveRequest.status).toBe('PENDING');
      expect(leaveRequest.reason).toBe('Personal work');
    });

    it('should calculate days correctly for single day leave', async () => {
      const leaveData = {
        employeeId: testEmployeeId,
        leaveType: 'SICK',
        fromDate: new Date('2024-02-01'),
        toDate: new Date('2024-02-01'), // Same day
        reason: 'Medical checkup'
      };

      const leaveRequest = await hrService.submitLeaveRequest(leaveData);

      expect(leaveRequest.days).toBe(1);
    });

    it('should throw error for invalid employee', async () => {
      const leaveData = {
        employeeId: 'invalid-employee-id',
        leaveType: 'CASUAL',
        fromDate: new Date('2024-01-15'),
        toDate: new Date('2024-01-17'),
        reason: 'Personal work'
      };

      await expect(
        hrService.submitLeaveRequest(leaveData)
      ).rejects.toThrow('Employee not found');
    });
  });
});
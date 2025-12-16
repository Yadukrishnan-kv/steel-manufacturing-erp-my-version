// HR Service Tests
import { PrismaClient } from '@prisma/client';
import { hrService } from '../src/services/hr.service';
import request from 'supertest';
import app from '../src/index';

const prisma = new PrismaClient();

// Test data
let testBranchId: string;
let testEmployeeId: string;
let testManagerId: string;
let authToken: string;

const mockBranch = {
  id: 'hr-test-branch-1',
  code: 'HR-BR001',
  name: 'HR Test Branch',
  address: '123 HR Test St',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600001',
  phone: '9876543210',
  isActive: true,
  isDeleted: false,
};

const mockManager = {
  id: 'hr-test-manager-1',
  employeeCode: 'HR-MGR001',
  firstName: 'Manager',
  lastName: 'Test',
  email: 'manager@test.com',
  phone: '9876543210',
  dateOfJoining: new Date('2020-01-01'),
  designation: 'HR Manager',
  department: 'Human Resources',
  branchId: 'hr-test-branch-1',
  salary: 80000,
  isActive: true,
  isDeleted: false,
};

const mockEmployee = {
  id: 'hr-test-employee-1',
  employeeCode: 'HR-EMP001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@test.com',
  phone: '9876543211',
  dateOfBirth: new Date('1990-01-01'),
  dateOfJoining: new Date('2023-01-01'),
  designation: 'Software Engineer',
  department: 'IT',
  branchId: 'hr-test-branch-1',
  reportingTo: 'hr-test-manager-1',
  salary: 50000,
  isActive: true,
  isDeleted: false,
};

describe('HR Service', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.payrollRecord.deleteMany({
      where: { employeeId: { in: [mockEmployee.id, mockManager.id] } }
    });
    await prisma.leaveRequest.deleteMany({
      where: { employeeId: { in: [mockEmployee.id, mockManager.id] } }
    });
    await prisma.kPIMetric.deleteMany({
      where: { employeeId: { in: [mockEmployee.id, mockManager.id] } }
    });
    await prisma.attendance.deleteMany({
      where: { employeeId: { in: [mockEmployee.id, mockManager.id] } }
    });
    await prisma.user.deleteMany({
      where: { employeeId: { in: [mockEmployee.id, mockManager.id] } }
    });
    await prisma.employee.deleteMany({
      where: { id: { in: [mockEmployee.id, mockManager.id] } }
    });
    await prisma.branch.deleteMany({
      where: { id: mockBranch.id }
    });

    // Create test branch
    await prisma.branch.create({ data: mockBranch });
    testBranchId = mockBranch.id;

    // Create test manager
    await prisma.employee.create({ data: mockManager });
    testManagerId = mockManager.id;

    // Create test employee
    await prisma.employee.create({ data: mockEmployee });
    testEmployeeId = mockEmployee.id;

    // Create test user and get auth token
    const authResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    if (authResponse.status === 200) {
      authToken = authResponse.body.data.token;
    } else {
      // Create test user if login fails
      const testUser = {
        email: 'hr.test@example.com',
        username: 'hrtest',
        password: 'test123',
        firstName: 'HR',
        lastName: 'Test'
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      if (registerResponse.status === 201) {
        const loginResponse = await request(app)
          .post('/api/v1/auth/login')
          .send({
            username: testUser.username,
            password: testUser.password
          });
        authToken = loginResponse.body.data.token;
      }
    }
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.payrollRecord.deleteMany({
      where: { employeeId: { in: [testEmployeeId, testManagerId] } }
    });
    await prisma.leaveRequest.deleteMany({
      where: { employeeId: { in: [testEmployeeId, testManagerId] } }
    });
    await prisma.kPIMetric.deleteMany({
      where: { employeeId: { in: [testEmployeeId, testManagerId] } }
    });
    await prisma.attendance.deleteMany({
      where: { employeeId: { in: [testEmployeeId, testManagerId] } }
    });
    await prisma.user.deleteMany({
      where: { employeeId: { in: [testEmployeeId, testManagerId] } }
    });
    await prisma.employee.deleteMany({
      where: { id: { in: [testEmployeeId, testManagerId] } }
    });
    await prisma.branch.deleteMany({
      where: { id: testBranchId }
    });

    await prisma.$disconnect();
  });

  // ============================================================================
  // EMPLOYEE MASTER DATA TESTS
  // ============================================================================

  describe('Employee Management', () => {
    it('should create a new employee', async () => {
      const newEmployee = {
        employeeCode: 'HR-EMP002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@test.com',
        phone: '9876543212',
        dateOfJoining: new Date('2023-06-01'),
        designation: 'HR Executive',
        department: 'Human Resources',
        branchId: testBranchId,
        reportingTo: testManagerId,
        salary: 45000
      };

      const employee = await hrService.createEmployee(newEmployee, 'test-user');

      expect(employee).toBeDefined();
      expect(employee.employeeCode).toBe(newEmployee.employeeCode);
      expect(employee.firstName).toBe(newEmployee.firstName);
      expect(employee.lastName).toBe(newEmployee.lastName);
      expect(employee.branchId).toBe(testBranchId);

      // Clean up
      await prisma.employee.delete({ where: { id: employee.id } });
    });

    it('should throw error for duplicate employee code', async () => {
      const duplicateEmployee = {
        employeeCode: mockEmployee.employeeCode, // Same as existing employee
        firstName: 'Duplicate',
        lastName: 'Employee',
        dateOfJoining: new Date('2023-06-01'),
        designation: 'Test Role',
        department: 'Test Dept',
        branchId: testBranchId
      };

      await expect(
        hrService.createEmployee(duplicateEmployee, 'test-user')
      ).rejects.toThrow('Employee with code HR-EMP001 already exists');
    });

    it('should get employee by ID with full details', async () => {
      const employee = await hrService.getEmployeeById(testEmployeeId);

      expect(employee).toBeDefined();
      expect(employee.id).toBe(testEmployeeId);
      expect(employee.employeeCode).toBe(mockEmployee.employeeCode);
      expect(employee.branch).toBeDefined();
      expect(employee.manager).toBeDefined();
      expect(employee.attendance).toBeDefined();
      expect(employee.kpiMetrics).toBeDefined();
    });

    it('should update employee information', async () => {
      const updates = {
        designation: 'Senior Software Engineer',
        salary: 60000
      };

      const updatedEmployee = await hrService.updateEmployee(testEmployeeId, updates, 'test-user');

      expect(updatedEmployee.designation).toBe(updates.designation);
      expect(updatedEmployee.salary).toBe(updates.salary);
    });

    it('should get employees by branch with pagination', async () => {
      const result = await hrService.getEmployeesByBranch(testBranchId, 1, 10);

      expect(result).toBeDefined();
      expect(result.employees).toBeInstanceOf(Array);
      expect(result.employees.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  // ============================================================================
  // ATTENDANCE MANAGEMENT TESTS
  // ============================================================================

  describe('Attendance Management', () => {
    it('should process biometric attendance data', async () => {
      const attendanceData = {
        employeeId: testEmployeeId,
        date: new Date('2023-12-15'),
        checkIn: new Date('2023-12-15T09:00:00'),
        checkOut: new Date('2023-12-15T18:00:00')
      };

      const attendance = await hrService.processBiometricAttendance(attendanceData);

      expect(attendance).toBeDefined();
      expect(attendance.employeeId).toBe(testEmployeeId);
      expect(attendance.isPresent).toBe(true);
      expect(attendance.workingHours).toBe(8); // 9 hours - 1 hour break = 8 hours
      expect(attendance.overtimeHours).toBe(0);
    });

    it('should process geo-tagged attendance', async () => {
      const geoAttendance = {
        employeeId: testEmployeeId,
        date: new Date('2023-12-16'),
        checkIn: new Date('2023-12-16T09:30:00'),
        latitude: 13.0827,
        longitude: 80.2707,
        accuracy: 10,
        address: 'Chennai, Tamil Nadu'
      };

      const attendance = await hrService.processGeoTaggedAttendance(geoAttendance);

      expect(attendance).toBeDefined();
      expect(attendance.employeeId).toBe(testEmployeeId);
      expect(attendance.location).toBeDefined();
      
      const location = JSON.parse(attendance.location!);
      expect(location.latitude).toBe(geoAttendance.latitude);
      expect(location.longitude).toBe(geoAttendance.longitude);
    });

    it('should calculate overtime correctly', async () => {
      // Create attendance with overtime
      const attendanceData = {
        employeeId: testEmployeeId,
        date: new Date('2023-12-17'),
        checkIn: new Date('2023-12-17T09:00:00'),
        checkOut: new Date('2023-12-17T20:00:00') // 11 hours total
      };

      await hrService.processBiometricAttendance(attendanceData);
      
      const result = await hrService.calculateOvertime(testEmployeeId, attendanceData.date, 'MORNING');

      expect(result.overtime).toBeGreaterThan(0);
      expect(result.earlyOut).toBe(false);
    });

    it('should get attendance report with summary', async () => {
      const fromDate = new Date('2023-12-01');
      const toDate = new Date('2023-12-31');

      const report = await hrService.getAttendanceReport(testEmployeeId, fromDate, toDate);

      expect(report).toBeDefined();
      expect(report.attendance).toBeInstanceOf(Array);
      expect(report.summary).toBeDefined();
      expect(report.summary.totalDays).toBeGreaterThanOrEqual(0);
      expect(report.summary.presentDays).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // PAYROLL MANAGEMENT TESTS
  // ============================================================================

  describe('Payroll Management', () => {
    it('should calculate payroll correctly', async () => {
      const payrollRequest = {
        employeeId: testEmployeeId,
        period: '2023-12',
        basicSalary: 50000,
        allowances: 5000,
        overtimeHours: 10,
        overtimeRate: 500
      };

      const payroll = await hrService.calculatePayroll(payrollRequest);

      expect(payroll).toBeDefined();
      expect(payroll.employeeId).toBe(testEmployeeId);
      expect(payroll.period).toBe('2023-12');
      expect(payroll.basicSalary).toBe(50000);
      expect(payroll.allowances).toBe(5000);
      expect(payroll.overtime).toBe(5000); // 10 hours * 500 rate
      expect(payroll.grossSalary).toBe(60000); // 50000 + 5000 + 5000
      expect(payroll.pfDeduction).toBe(6000); // 12% of basic salary
      expect(payroll.esiDeduction).toBe(450); // 0.75% of gross salary
      expect(payroll.taxDeduction).toBe(200); // Professional tax for salary > 20000
      expect(payroll.netSalary).toBe(53350); // 60000 - 6000 - 450 - 200
      expect(payroll.status).toBe('DRAFT');
    });

    it('should process payroll (mark as processed)', async () => {
      const processedPayroll = await hrService.processPayroll(testEmployeeId, '2023-12');

      expect(processedPayroll.status).toBe('PROCESSED');
      expect(processedPayroll.processedAt).toBeDefined();
    });

    it('should throw error when processing already processed payroll', async () => {
      await expect(
        hrService.processPayroll(testEmployeeId, '2023-12')
      ).rejects.toThrow('Payroll already processed');
    });
  });

  // ============================================================================
  // KPI MANAGEMENT TESTS
  // ============================================================================

  describe('KPI Management', () => {
    it('should record KPI metric', async () => {
      const kpiRequest = {
        employeeId: testEmployeeId,
        metricName: 'Code Quality',
        targetValue: 90,
        actualValue: 85,
        period: '2023-12',
        weightage: 30,
        jobDescRef: 'Software quality standards'
      };

      const kpiMetric = await hrService.recordKPIMetric(kpiRequest);

      expect(kpiMetric).toBeDefined();
      expect(kpiMetric.employeeId).toBe(testEmployeeId);
      expect(kpiMetric.metricName).toBe('Code Quality');
      expect(kpiMetric.targetValue).toBe(90);
      expect(kpiMetric.actualValue).toBe(85);
      expect(kpiMetric.score).toBeCloseTo(28.33, 1); // (85/90) * 30 = 28.33
    });

    it('should get KPI summary for employee', async () => {
      // Add another KPI metric
      await hrService.recordKPIMetric({
        employeeId: testEmployeeId,
        metricName: 'Task Completion',
        targetValue: 100,
        actualValue: 95,
        period: '2023-12',
        weightage: 40,
        jobDescRef: 'Task delivery standards'
      });

      const summary = await hrService.getKPISummary(testEmployeeId, '2023-12');

      expect(summary).toBeDefined();
      expect(summary.metrics).toBeInstanceOf(Array);
      expect(summary.metrics.length).toBe(2);
      expect(summary.summary.totalMetrics).toBe(2);
      expect(summary.summary.totalWeightage).toBe(70); // 30 + 40
      expect(summary.summary.overallScore).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // LEAVE MANAGEMENT TESTS
  // ============================================================================

  describe('Leave Management', () => {
    let leaveRequestId: string;

    it('should submit leave request', async () => {
      const leaveRequest = {
        employeeId: testEmployeeId,
        leaveType: 'CASUAL',
        fromDate: new Date('2024-01-15'),
        toDate: new Date('2024-01-17'),
        reason: 'Personal work'
      };

      const request = await hrService.submitLeaveRequest(leaveRequest);

      expect(request).toBeDefined();
      expect(request.employeeId).toBe(testEmployeeId);
      expect(request.leaveType).toBe('CASUAL');
      expect(request.days).toBe(3); // 15, 16, 17 = 3 days
      expect(request.status).toBe('PENDING');

      leaveRequestId = request.id;
    });

    it('should approve leave request', async () => {
      const processedRequest = await hrService.processLeaveRequest(
        leaveRequestId,
        'APPROVED',
        testManagerId,
        'Approved for personal work'
      );

      expect(processedRequest.status).toBe('APPROVED');
      expect(processedRequest.approvedBy).toBe(testManagerId);
      expect(processedRequest.approvedAt).toBeDefined();
      expect(processedRequest.remarks).toBe('Approved for personal work');
    });

    it('should get leave balance for employee', async () => {
      const balance = await hrService.getLeaveBalance(testEmployeeId, 2024);

      expect(balance).toBeDefined();
      expect(balance.employeeId).toBe(testEmployeeId);
      expect(balance.year).toBe(2024);
      expect(balance.leaveBalance).toBeInstanceOf(Array);
      
      const casualLeave = balance.leaveBalance.find(l => l.leaveType === 'CASUAL');
      expect(casualLeave).toBeDefined();
      expect(casualLeave!.allocated).toBe(12);
      expect(casualLeave!.used).toBe(3); // From the approved leave request
      expect(casualLeave!.balance).toBe(9);
    });

    it('should throw error when processing non-existent leave request', async () => {
      await expect(
        hrService.processLeaveRequest('non-existent-id', 'APPROVED', testManagerId)
      ).rejects.toThrow('Leave request not found');
    });
  });

  // ============================================================================
  // API ENDPOINT TESTS
  // ============================================================================

  describe('HR API Endpoints', () => {
    it('should create employee via API', async () => {
      const newEmployee = {
        employeeCode: 'HR-API001',
        firstName: 'API',
        lastName: 'Test',
        email: 'api.test@example.com',
        dateOfJoining: '2023-12-01',
        designation: 'Test Engineer',
        department: 'QA',
        branchId: testBranchId,
        salary: 40000
      };

      const response = await request(app)
        .post('/api/v1/hr/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newEmployee);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.employeeCode).toBe(newEmployee.employeeCode);

      // Clean up
      await prisma.employee.delete({ where: { id: response.body.data.id } });
    });

    it('should process biometric attendance via API', async () => {
      const attendanceData = {
        employeeId: testEmployeeId,
        date: '2023-12-20',
        checkIn: '2023-12-20T09:00:00Z',
        checkOut: '2023-12-20T18:00:00Z'
      };

      const response = await request(app)
        .post('/api/v1/hr/attendance/biometric')
        .set('Authorization', `Bearer ${authToken}`)
        .send(attendanceData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.employeeId).toBe(testEmployeeId);
    });

    it('should calculate payroll via API', async () => {
      const payrollData = {
        employeeId: testEmployeeId,
        period: '2024-01',
        basicSalary: 50000,
        allowances: 3000,
        overtimeHours: 5,
        overtimeRate: 400
      };

      const response = await request(app)
        .post('/api/v1/hr/payroll/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payrollData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBe('2024-01');
      expect(response.body.data.grossSalary).toBe(55000); // 50000 + 3000 + 2000
    });

    it('should record KPI metric via API', async () => {
      const kpiData = {
        employeeId: testEmployeeId,
        metricName: 'API Testing',
        targetValue: 100,
        actualValue: 90,
        period: '2024-01',
        weightage: 25
      };

      const response = await request(app)
        .post('/api/v1/hr/kpi/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .send(kpiData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.metricName).toBe('API Testing');
    });

    it('should submit leave request via API', async () => {
      const leaveData = {
        employeeId: testEmployeeId,
        leaveType: 'SICK',
        fromDate: '2024-02-01',
        toDate: '2024-02-02',
        reason: 'Medical checkup'
      };

      const response = await request(app)
        .post('/api/v1/hr/leave/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(leaveData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.leaveType).toBe('SICK');
      expect(response.body.data.days).toBe(2);
    });

    it('should return validation error for invalid employee data', async () => {
      const invalidEmployee = {
        employeeCode: '', // Empty code should fail validation
        firstName: 'Invalid',
        lastName: 'Employee'
      };

      const response = await request(app)
        .post('/api/v1/hr/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEmployee);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
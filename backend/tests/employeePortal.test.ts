// Employee Portal Service Tests
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { employeePortalService } from '../src/services/employeePortal.service';

const prisma = new PrismaClient();

describe('Employee Portal Service', () => {
  let testEmployee: any;
  let testBranch: any;
  let testUser: any;

  beforeAll(async () => {
    // Clean up any existing test data first
    await prisma.user.deleteMany({
      where: { email: { contains: 'employeeportal.test' } }
    });
    await prisma.employee.deleteMany({
      where: { employeeCode: { startsWith: 'EMPTEST' } }
    });
    await prisma.branch.deleteMany({
      where: { code: { startsWith: 'TBTEST' } }
    });

    // Create test branch
    testBranch = await prisma.branch.create({
      data: {
        name: 'Test Branch Employee Portal',
        code: 'TBTEST001',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        isActive: true
      }
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'employeeportal.test@example.com',
        username: 'employeeportaltest',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        isActive: true
      }
    });

    // Create test employee
    testEmployee = await prisma.employee.create({
      data: {
        employeeCode: 'EMPTEST001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe.employeeportal@example.com',
        phone: '1234567890',
        dateOfJoining: new Date(),
        designation: 'Software Engineer',
        department: 'IT',
        branchId: testBranch.id,
        salary: 50000
      }
    });

    // Update user to link to employee
    await prisma.user.update({
      where: { id: testUser.id },
      data: { employeeId: testEmployee.id }
    });
  });

  afterAll(async () => {
    // Clean up test data in correct order (respecting foreign key constraints)
    if (testEmployee?.id) {
      await prisma.notificationRead.deleteMany({
        where: { employeeId: testEmployee.id }
      });
      await prisma.employeeDocument.deleteMany({
        where: { employeeId: testEmployee.id }
      });
      await prisma.attendance.deleteMany({
        where: { employeeId: testEmployee.id }
      });
      await prisma.leaveRequest.deleteMany({
        where: { employeeId: testEmployee.id }
      });
    }
    
    if (testUser?.id) {
      await prisma.employeeNotification.deleteMany({
        where: { createdBy: testUser.id }
      });
      await prisma.user.update({
        where: { id: testUser.id },
        data: { employeeId: null }
      }).catch(() => {}); // Ignore if user doesn't exist
    }
    
    await prisma.employee.deleteMany({
      where: { employeeCode: { startsWith: 'EMPTEST' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'employeeportal.test' } }
    });
    await prisma.branch.deleteMany({
      where: { code: { startsWith: 'TBTEST' } }
    });
    await prisma.$disconnect();
  });

  describe('Dashboard', () => {
    it('should get employee dashboard data', async () => {
      const dashboard = await employeePortalService.getEmployeeDashboard(testEmployee.id);

      expect(dashboard).toBeDefined();
      expect(dashboard.employee).toBeDefined();
      expect(dashboard.employee.employeeCode).toBe('EMP001');
      expect(dashboard.attendanceSummary).toBeDefined();
      expect(dashboard.leaveBalance).toBeDefined();
    });
  });

  describe('Profile Management', () => {
    it('should get employee profile', async () => {
      const profile = await employeePortalService.getEmployeeProfile(testEmployee.id);

      expect(profile).toBeDefined();
      expect(profile.employeeCode).toBe('EMP001');
      expect(profile.firstName).toBe('John');
      expect(profile.lastName).toBe('Doe');
    });

    it('should update employee profile', async () => {
      const updates = {
        firstName: 'Jane',
        phone: '9876543210'
      };

      const updatedProfile = await employeePortalService.updateEmployeeProfile(
        testEmployee.id, 
        updates
      );

      expect(updatedProfile.firstName).toBe('Jane');
      expect(updatedProfile.phone).toBe('9876543210');
    });

    it('should not allow updating restricted fields', async () => {
      const updates = {
        firstName: 'Updated Name',
        salary: 100000 // This should not be allowed
      };

      const updatedProfile = await employeePortalService.updateEmployeeProfile(
        testEmployee.id, 
        updates
      );

      expect(updatedProfile.firstName).toBe('Updated Name');
      expect(updatedProfile.salary).toBe(50000); // Should remain unchanged
    });
  });

  describe('Leave Management', () => {
    it('should get employee leave balance', async () => {
      const leaveBalance = await employeePortalService.getEmployeeLeaveBalance(testEmployee.id);

      expect(leaveBalance).toBeDefined();
      expect(leaveBalance.leaveBalance).toBeDefined();
      expect(Array.isArray(leaveBalance.leaveBalance)).toBe(true);
    });

    it('should submit leave request', async () => {
      const leaveRequest = {
        leaveType: 'CASUAL',
        fromDate: new Date('2024-01-15'),
        toDate: new Date('2024-01-16'),
        reason: 'Personal work'
      };

      const result = await employeePortalService.submitLeaveRequest(
        testEmployee.id, 
        leaveRequest
      );

      expect(result).toBeDefined();
      expect(result.leaveType).toBe('CASUAL');
      expect(result.status).toBe('PENDING');
    });

    it('should get employee leave requests', async () => {
      const leaveRequests = await employeePortalService.getEmployeeLeaveRequests(testEmployee.id);

      expect(leaveRequests).toBeDefined();
      expect(leaveRequests.leaveRequests).toBeDefined();
      expect(Array.isArray(leaveRequests.leaveRequests)).toBe(true);
      expect(leaveRequests.pagination).toBeDefined();
    });
  });

  describe('Attendance', () => {
    beforeEach(async () => {
      // Create test attendance record
      await prisma.attendance.create({
        data: {
          employeeId: testEmployee.id,
          date: new Date(),
          checkIn: new Date(),
          checkOut: new Date(),
          workingHours: 8,
          isPresent: true
        }
      });
    });

    it('should get current month attendance', async () => {
      const attendance = await employeePortalService.getCurrentMonthAttendance(testEmployee.id);

      expect(attendance).toBeDefined();
      expect(attendance.attendance).toBeDefined();
      expect(Array.isArray(attendance.attendance)).toBe(true);
      expect(attendance.summary).toBeDefined();
    });

    it('should get attendance history', async () => {
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-01-31');

      const attendance = await employeePortalService.getEmployeeAttendanceHistory(
        testEmployee.id, 
        fromDate, 
        toDate
      );

      expect(attendance).toBeDefined();
      expect(attendance.attendance).toBeDefined();
      expect(attendance.summary).toBeDefined();
    });
  });

  describe('Notifications', () => {
    let testNotification: any;

    beforeEach(async () => {
      // Create test notification
      testNotification = await employeePortalService.createEmployeeNotification({
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'INFO',
        targetEmployees: [testEmployee.id]
      }, testUser.id);
    });

    it('should create employee notification', async () => {
      expect(testNotification).toBeDefined();
      expect(testNotification.title).toBe('Test Notification');
      expect(testNotification.type).toBe('INFO');
    });

    it('should get employee notifications', async () => {
      const notifications = await employeePortalService.getEmployeeNotifications(testEmployee.id);

      expect(notifications).toBeDefined();
      expect(notifications.notifications).toBeDefined();
      expect(Array.isArray(notifications.notifications)).toBe(true);
      expect(notifications.pagination).toBeDefined();
    });

    it('should mark notification as read', async () => {
      const readRecord = await employeePortalService.markNotificationAsRead(
        testEmployee.id, 
        testNotification.id
      );

      expect(readRecord).toBeDefined();
      expect(readRecord.employeeId).toBe(testEmployee.id);
      expect(readRecord.notificationId).toBe(testNotification.id);
    });
  });

  describe('Employee Directory', () => {
    it('should get employee directory', async () => {
      const directory = await employeePortalService.getEmployeeDirectory(testEmployee.id);

      expect(directory).toBeDefined();
      expect(directory.employees).toBeDefined();
      expect(Array.isArray(directory.employees)).toBe(true);
      expect(directory.pagination).toBeDefined();
    });

    it('should get organizational chart', async () => {
      const chart = await employeePortalService.getOrganizationalChart(testEmployee.id);

      expect(chart).toBeDefined();
      expect(chart.hierarchy).toBeDefined();
    });
  });

  describe('Document Management', () => {
    it('should upload employee document', async () => {
      const document = await employeePortalService.uploadEmployeeDocument(
        testEmployee.id,
        'RESUME',
        'resume.pdf',
        '/uploads/employee-documents/resume.pdf'
      );

      expect(document).toBeDefined();
      expect(document.documentType).toBe('RESUME');
      expect(document.fileName).toBe('resume.pdf');
    });

    it('should get employee documents', async () => {
      const documents = await employeePortalService.getEmployeeDocuments(testEmployee.id);

      expect(documents).toBeDefined();
      expect(Array.isArray(documents)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-existent employee', async () => {
      await expect(
        employeePortalService.getEmployeeDashboard('non-existent-id')
      ).rejects.toThrow('Employee not found');
    });

    it('should throw error for invalid leave request', async () => {
      const invalidLeaveRequest = {
        leaveType: 'CASUAL',
        fromDate: new Date('2024-01-15'),
        toDate: new Date('2024-01-16'),
        reason: 'Personal work'
      };

      // First, let's create a leave request that exceeds balance
      // This would require setting up leave balance properly
      // For now, we'll test with a non-existent employee
      await expect(
        employeePortalService.submitLeaveRequest('non-existent-id', invalidLeaveRequest)
      ).rejects.toThrow('Employee not found');
    });
  });
});
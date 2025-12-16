import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/index';
import { alertService } from '../src/services/alert.service';

const prisma = new PrismaClient();

describe('Alert and SLA Management Service', () => {
  let authToken: string;
  let testBranchId: string;
  let testUserId: string;
  let testSLAConfigId: string;
  let testAlertId: string;

  beforeAll(async () => {
    // Clean up existing test data
    await prisma.alertNotification.deleteMany({});
    await prisma.alert.deleteMany({});
    await prisma.sLAConfiguration.deleteMany({});
    await prisma.userSession.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.branch.deleteMany({});

    // Create test branch
    const branch = await prisma.branch.create({
      data: {
        code: 'TEST-BRANCH-ALERT',
        name: 'Test Branch for Alerts',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
      },
    });
    testBranchId = branch.id;

    // Create test employee
    const employee = await prisma.employee.create({
      data: {
        employeeCode: 'EMP-ALERT-001',
        firstName: 'Alert',
        lastName: 'Tester',
        email: 'alert.tester@test.com',
        phone: '9876543210',
        dateOfJoining: new Date(),
        designation: 'Alert Manager',
        department: 'ALERTS',
        branchId: testBranchId,
      },
    });

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'alert.tester@test.com',
        username: 'alerttester',
        password: 'hashedpassword',
        firstName: 'Alert',
        lastName: 'Tester',
        employeeId: employee.id,
      },
    });
    testUserId = user.id;

    // Create auth session
    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        token: 'test-alert-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
    authToken = session.token;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.alertNotification.deleteMany({});
    await prisma.alert.deleteMany({});
    await prisma.sLAConfiguration.deleteMany({});
    await prisma.userSession.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.branch.deleteMany({});
    await prisma.$disconnect();
  });

  describe('SLA Configuration Management', () => {
    it('should create SLA configuration', async () => {
      const slaData = {
        module: 'SALES',
        process: 'LEAD_FOLLOWUP',
        slaHours: 24,
        escalationLevels: [
          {
            level: 1,
            roleOrUserId: 'SALES_MANAGER',
            type: 'ROLE',
            hoursAfter: 24,
          },
          {
            level: 2,
            roleOrUserId: 'BRANCH_MANAGER',
            type: 'ROLE',
            hoursAfter: 48,
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/alerts/sla-configurations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(slaData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.module).toBe(slaData.module);
      expect(response.body.data.process).toBe(slaData.process);
      expect(response.body.data.slaHours).toBe(slaData.slaHours);

      testSLAConfigId = response.body.data.id;
    });

    it('should get SLA configurations', async () => {
      const response = await request(app)
        .get('/api/v1/alerts/sla-configurations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const slaConfig = response.body.data[0];
      expect(slaConfig).toHaveProperty('escalationLevels');
      expect(Array.isArray(slaConfig.escalationLevels)).toBe(true);
    });

    it('should filter SLA configurations by module', async () => {
      const response = await request(app)
        .get('/api/v1/alerts/sla-configurations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ module: 'SALES' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((config: any) => {
        expect(config.module).toBe('SALES');
      });
    });

    it('should update SLA configuration', async () => {
      const updateData = {
        slaHours: 48,
        escalationLevels: [
          {
            level: 1,
            roleOrUserId: 'TEAM_LEAD',
            type: 'ROLE',
            hoursAfter: 24,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/v1/alerts/sla-configurations/${testSLAConfigId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slaHours).toBe(updateData.slaHours);
    });
  });

  describe('Alert Management', () => {
    it('should create alert with SLA monitoring', async () => {
      const alertData = {
        type: 'LEAD_FOLLOWUP',
        module: 'SALES',
        referenceId: 'LEAD-001',
        message: 'Lead follow-up required for high-value prospect',
        priority: 'HIGH',
        assignedTo: testUserId,
      };

      const response = await request(app)
        .post('/api/v1/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(alertData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.type).toBe(alertData.type);
      expect(response.body.data.module).toBe(alertData.module);
      expect(response.body.data.priority).toBe(alertData.priority);
      expect(response.body.data).toHaveProperty('dueDate');

      testAlertId = response.body.data.id;
    });

    it('should get alerts with filtering', async () => {
      const response = await request(app)
        .get('/api/v1/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ module: 'SALES', priority: 'HIGH' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.alerts)).toBe(true);

      if (response.body.data.alerts.length > 0) {
        const alert = response.body.data.alerts[0];
        expect(alert.module).toBe('SALES');
        expect(alert.priority).toBe('HIGH');
      }
    });

    it('should update alert status', async () => {
      const updateData = {
        status: 'ACKNOWLEDGED',
      };

      const response = await request(app)
        .put(`/api/v1/alerts/${testAlertId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ACKNOWLEDGED');
    });

    it('should resolve alert', async () => {
      const updateData = {
        status: 'RESOLVED',
        resolvedAt: new Date().toISOString(),
      };

      const response = await request(app)
        .put(`/api/v1/alerts/${testAlertId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('RESOLVED');
      expect(response.body.data.resolvedAt).toBeDefined();
    });
  });

  describe('Alert Notifications', () => {
    it('should send email notification', async () => {
      const notificationData = {
        alertId: testAlertId,
        channel: 'EMAIL',
        recipient: 'test@example.com',
        message: 'Test alert notification via email',
      };

      const response = await request(app)
        .post('/api/v1/alerts/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notification');
      expect(response.body.data.notification.channel).toBe('EMAIL');
    });

    it('should send SMS notification', async () => {
      const notificationData = {
        alertId: testAlertId,
        channel: 'SMS',
        recipient: '+919876543210',
        message: 'Test alert notification via SMS',
      };

      const response = await request(app)
        .post('/api/v1/alerts/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notification');
      expect(response.body.data.notification.channel).toBe('SMS');
    });

    it('should send WhatsApp notification', async () => {
      const notificationData = {
        alertId: testAlertId,
        channel: 'WHATSAPP',
        recipient: '+919876543210',
        message: 'Test alert notification via WhatsApp',
      };

      const response = await request(app)
        .post('/api/v1/alerts/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notification');
      expect(response.body.data.notification.channel).toBe('WHATSAPP');
    });

    it('should send app notification', async () => {
      const notificationData = {
        alertId: testAlertId,
        channel: 'APP',
        recipient: testUserId,
        message: 'Test alert notification via app',
      };

      const response = await request(app)
        .post('/api/v1/alerts/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notification');
      expect(response.body.data.notification.channel).toBe('APP');
    });
  });

  describe('Escalation Processing', () => {
    beforeEach(async () => {
      // Create overdue alert for escalation testing
      const overdueDate = new Date();
      overdueDate.setHours(overdueDate.getHours() - 25); // 25 hours ago

      await prisma.alert.create({
        data: {
          type: 'OVERDUE_TASK',
          module: 'SALES',
          referenceId: 'TASK-OVERDUE-001',
          message: 'Overdue task requiring escalation',
          priority: 'CRITICAL',
          assignedTo: testUserId,
          dueDate: overdueDate,
          createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000), // 26 hours ago
        },
      });
    });

    it('should process escalations for overdue alerts', async () => {
      const response = await request(app)
        .post('/api/v1/alerts/escalations/process')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('processedCount');
      expect(response.body.data).toHaveProperty('escalations');
      expect(Array.isArray(response.body.data.escalations)).toBe(true);
    });
  });

  describe('Reminder Generation', () => {
    beforeEach(async () => {
      // Create alert due in 12 hours for reminder testing
      const dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + 12);

      await prisma.alert.create({
        data: {
          type: 'UPCOMING_TASK',
          module: 'PRODUCTION',
          referenceId: 'TASK-UPCOMING-001',
          message: 'Task due soon, reminder needed',
          priority: 'MEDIUM',
          assignedTo: testUserId,
          dueDate: dueDate,
        },
      });
    });

    it('should generate reminders for upcoming alerts', async () => {
      const response = await request(app)
        .post('/api/v1/alerts/reminders/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('generatedCount');
      expect(response.body.data).toHaveProperty('reminders');
      expect(Array.isArray(response.body.data.reminders)).toBe(true);
    });
  });

  describe('Alert Dashboard', () => {
    it('should get alert dashboard data', async () => {
      const response = await request(app)
        .get('/api/v1/alerts/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalAlerts');
      expect(response.body.data).toHaveProperty('activeAlerts');
      expect(response.body.data).toHaveProperty('criticalAlerts');
      expect(response.body.data).toHaveProperty('overdueAlerts');
      expect(response.body.data).toHaveProperty('alertsByModule');
      expect(response.body.data).toHaveProperty('alertsByPriority');
      expect(response.body.data).toHaveProperty('recentAlerts');
      expect(response.body.data).toHaveProperty('escalationMetrics');

      // Verify structure
      expect(typeof response.body.data.totalAlerts).toBe('number');
      expect(typeof response.body.data.activeAlerts).toBe('number');
      expect(typeof response.body.data.criticalAlerts).toBe('number');
      expect(typeof response.body.data.overdueAlerts).toBe('number');
      expect(typeof response.body.data.alertsByModule).toBe('object');
      expect(typeof response.body.data.alertsByPriority).toBe('object');
      expect(Array.isArray(response.body.data.recentAlerts)).toBe(true);
      expect(typeof response.body.data.escalationMetrics).toBe('object');
    });

    it('should filter dashboard by module', async () => {
      const response = await request(app)
        .get('/api/v1/alerts/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ module: 'SALES' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalAlerts');
    });
  });

  describe('SLA Performance Metrics', () => {
    it('should get SLA performance metrics', async () => {
      const response = await request(app)
        .get('/api/v1/alerts/sla-performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalSLAs');
      expect(response.body.data).toHaveProperty('metSLAs');
      expect(response.body.data).toHaveProperty('breachedSLAs');
      expect(response.body.data).toHaveProperty('slaComplianceRate');
      expect(response.body.data).toHaveProperty('averageResponseTime');
      expect(response.body.data).toHaveProperty('averageResolutionTime');
      expect(response.body.data).toHaveProperty('performanceByModule');

      // Verify data types
      expect(typeof response.body.data.totalSLAs).toBe('number');
      expect(typeof response.body.data.metSLAs).toBe('number');
      expect(typeof response.body.data.breachedSLAs).toBe('number');
      expect(typeof response.body.data.slaComplianceRate).toBe('number');
      expect(typeof response.body.data.averageResponseTime).toBe('number');
      expect(typeof response.body.data.averageResolutionTime).toBe('number');
      expect(typeof response.body.data.performanceByModule).toBe('object');
    });

    it('should filter SLA metrics by module', async () => {
      const response = await request(app)
        .get('/api/v1/alerts/sla-performance')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ module: 'SALES' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalSLAs');
    });

    it('should filter SLA metrics by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const response = await request(app)
        .get('/api/v1/alerts/sla-performance')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalSLAs');
    });
  });

  describe('Alert Service Unit Tests', () => {
    it('should create SLA configuration correctly', async () => {
      const slaData = {
        module: 'QC',
        process: 'INSPECTION_REVIEW',
        slaHours: 8,
        escalationLevels: [
          {
            level: 1,
            roleOrUserId: 'QC_SUPERVISOR',
            type: 'ROLE' as const,
            hoursAfter: 8,
          },
        ],
      };

      const result = await alertService.createSLAConfiguration(slaData);

      expect(result).toHaveProperty('id');
      expect(result.module).toBe(slaData.module);
      expect(result.process).toBe(slaData.process);
      expect(result.slaHours).toBe(slaData.slaHours);
    });

    it('should create alert with automatic due date calculation', async () => {
      const alertData = {
        type: 'INSPECTION_REVIEW',
        module: 'QC',
        referenceId: 'QC-INSPECT-001',
        message: 'QC inspection requires review',
        priority: 'MEDIUM' as const,
        assignedTo: testUserId,
      };

      const result = await alertService.createAlert(alertData);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe(alertData.type);
      expect(result.module).toBe(alertData.module);
      expect(result.priority).toBe(alertData.priority);
      expect(result.dueDate).toBeDefined();
    });

    it('should get alerts with pagination', async () => {
      const result = await alertService.getAlerts({
        page: 1,
        limit: 10,
        module: 'SALES',
      });

      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(result.pagination).toHaveProperty('page');
      expect(result.pagination).toHaveProperty('limit');
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('pages');
    });

    it('should calculate SLA performance metrics correctly', async () => {
      const metrics = await alertService.getSLAPerformanceMetrics({
        module: 'SALES',
      });

      expect(metrics).toHaveProperty('totalSLAs');
      expect(metrics).toHaveProperty('metSLAs');
      expect(metrics).toHaveProperty('breachedSLAs');
      expect(metrics).toHaveProperty('slaComplianceRate');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('averageResolutionTime');
      expect(metrics).toHaveProperty('performanceByModule');

      expect(typeof metrics.totalSLAs).toBe('number');
      expect(typeof metrics.slaComplianceRate).toBe('number');
      expect(metrics.slaComplianceRate).toBeGreaterThanOrEqual(0);
      expect(metrics.slaComplianceRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid SLA configuration data', async () => {
      const invalidData = {
        module: '', // Invalid: empty module
        process: 'TEST_PROCESS',
        slaHours: -1, // Invalid: negative hours
        escalationLevels: [],
      };

      const response = await request(app)
        .post('/api/v1/alerts/sla-configurations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid alert data', async () => {
      const invalidData = {
        type: '', // Invalid: empty type
        module: 'SALES',
        referenceId: '',
        message: '',
        priority: 'INVALID_PRIORITY',
      };

      const response = await request(app)
        .post('/api/v1/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle non-existent alert update', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .put(`/api/v1/alerts/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'RESOLVED' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid notification channel', async () => {
      const invalidData = {
        alertId: testAlertId,
        channel: 'INVALID_CHANNEL',
        recipient: 'test@example.com',
        message: 'Test message',
      };

      const response = await request(app)
        .post('/api/v1/alerts/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
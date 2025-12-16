// Quality Control Service Tests
import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/database/connection';
import { QCService } from '../src/services/qc.service';

describe('Quality Control Service', () => {
  let qcService: QCService;
  let authToken: string;
  let testBranchId: string;
  let testProductionOrderId: string;
  let testInspectionId: string;

  beforeAll(async () => {
    qcService = new QCService(prisma);

    // Create test user and get auth token
    const authResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'testuser',
        password: 'testpass123',
      });

    if (authResponse.status === 200) {
      authToken = authResponse.body.data.token;
    } else {
      // Create test user if login fails
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'testpass123',
          firstName: 'Test',
          lastName: 'User',
        });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123',
        });

      authToken = loginResponse.body.data.token;
    }

    // Create test branch
    const branch = await prisma.branch.create({
      data: {
        code: 'TEST_QC',
        name: 'Test QC Branch',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
      },
    });
    testBranchId = branch.id;

    // Create test product and BOM
    const product = await prisma.product.create({
      data: {
        code: 'TEST_PROD_QC',
        name: 'Test Product for QC',
        category: 'DOOR',
        type: 'STANDARD',
      },
    });

    const bom = await prisma.bOM.create({
      data: {
        productId: product.id,
        revision: '1.0',
        effectiveDate: new Date(),
        status: 'APPROVED',
      },
    });

    // Create test production order
    const productionOrder = await prisma.productionOrder.create({
      data: {
        orderNumber: 'PO-QC-TEST-001',
        bomId: bom.id,
        quantity: 10,
        scheduledStartDate: new Date(),
        scheduledEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'IN_PROGRESS',
        branchId: testBranchId,
      },
    });
    testProductionOrderId = productionOrder.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.qCChecklistItem.deleteMany({});
    await prisma.qCInspection.deleteMany({});
    await prisma.productionOrder.deleteMany({});
    await prisma.bOM.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.branch.deleteMany({});
    await prisma.$disconnect();
  });

  describe('QC Inspection Creation', () => {
    it('should create QC inspection with stage-specific checklist', async () => {
      const inspectionData = {
        productionOrderId: testProductionOrderId,
        stage: 'CUTTING',
        customerRequirements: ['Extra quality checks for visible surfaces'],
        checklistItems: [
          {
            checkpointId: 'CUT_001',
            description: 'Material dimensions accuracy',
            expectedValue: 'Within ±2mm tolerance',
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/qc/inspections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(inspectionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stage).toBe('CUTTING');
      expect(response.body.data.checklistItems).toHaveLength(3); // Template + provided
      expect(response.body.data.customerRequirements).toContain('Extra quality checks for visible surfaces');

      testInspectionId = response.body.data.id;
    });

    it('should validate required fields for QC inspection creation', async () => {
      const invalidData = {
        stage: 'CUTTING',
        // Missing productionOrderId
      };

      const response = await request(app)
        .post('/api/v1/qc/inspections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid QC stage', async () => {
      const invalidData = {
        productionOrderId: testProductionOrderId,
        stage: 'INVALID_STAGE',
        checklistItems: [],
      };

      const response = await request(app)
        .post('/api/v1/qc/inspections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('QC Inspection Recording', () => {
    it('should record QC inspection with photos and scoring', async () => {
      const recordingData = {
        checklistResults: [
          {
            checkpointId: 'CUT_001',
            actualValue: 'Within ±1mm tolerance',
            status: 'PASS',
            photos: ['photo1.jpg', 'photo2.jpg'],
            comments: 'Excellent quality',
          },
          {
            checkpointId: 'CUT_002',
            actualValue: 'Smooth edges achieved',
            status: 'PASS',
          },
          {
            checkpointId: 'CUT_003',
            actualValue: 'Clear marking present',
            status: 'PASS',
          },
        ],
        photos: ['inspection_overview.jpg'],
        remarks: 'All checks passed successfully',
      };

      const response = await request(app)
        .put(`/api/v1/qc/inspections/${testInspectionId}/record`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(recordingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PASSED');
      expect(response.body.data.overallScore).toBe(100);
      expect(response.body.data.photos).toContain('inspection_overview.jpg');
    });

    it('should generate rework job card for failed inspection', async () => {
      // Create another inspection for failure test
      const failInspectionData = {
        productionOrderId: testProductionOrderId,
        stage: 'FABRICATION',
        checklistItems: [
          {
            checkpointId: 'FAB_001',
            description: 'Welding joint quality',
            expectedValue: 'Full penetration, no defects',
          },
        ],
      };

      const createResponse = await request(app)
        .post('/api/v1/qc/inspections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(failInspectionData)
        .expect(201);

      const failInspectionId = createResponse.body.data.id;

      // Record failed inspection
      const failRecordingData = {
        checklistResults: [
          {
            checkpointId: 'FAB_001',
            actualValue: 'Incomplete penetration detected',
            status: 'FAIL',
            comments: 'Welding defects found',
          },
        ],
        photos: ['defect_photo.jpg'],
        remarks: 'Rework required for welding',
      };

      const recordResponse = await request(app)
        .put(`/api/v1/qc/inspections/${failInspectionId}/record`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(failRecordingData)
        .expect(200);

      expect(recordResponse.body.success).toBe(true);
      expect(recordResponse.body.data.status).toBe('FAILED');
      expect(recordResponse.body.data.reworkOrderId).toBeDefined();
    });
  });

  describe('QC Inspector Assignment', () => {
    it('should assign QC inspector to inspection', async () => {
      // Create test employee/inspector
      const employee = await prisma.employee.create({
        data: {
          employeeCode: 'QC_INSPECTOR_001',
          firstName: 'John',
          lastName: 'Inspector',
          dateOfJoining: new Date(),
          designation: 'QC Inspector',
          department: 'Quality Control',
          branchId: testBranchId,
        },
      });

      const response = await request(app)
        .put(`/api/v1/qc/inspections/${testInspectionId}/assign-inspector`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ inspectorId: employee.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('assigned successfully');

      // Verify assignment
      const inspection = await prisma.qCInspection.findUnique({
        where: { id: testInspectionId },
      });
      expect(inspection?.inspectorId).toBe(employee.id);
    });

    it('should reject assignment to non-existent inspector', async () => {
      const response = await request(app)
        .put(`/api/v1/qc/inspections/${testInspectionId}/assign-inspector`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ inspectorId: 'non-existent-id' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('QC Analytics', () => {
    it('should get QC analytics and quality trends', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const response = await request(app)
        .get('/api/v1/qc/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          branchId: testBranchId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalInspections');
      expect(response.body.data).toHaveProperty('passRate');
      expect(response.body.data).toHaveProperty('failRate');
      expect(response.body.data).toHaveProperty('stageWiseMetrics');
      expect(response.body.data).toHaveProperty('trendData');
    });

    it('should require start and end dates for analytics', async () => {
      const response = await request(app)
        .get('/api/v1/qc/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Start date and end date are required');
    });
  });

  describe('QC Report Generation', () => {
    it('should generate QC report for inspection', async () => {
      const response = await request(app)
        .get(`/api/v1/qc/reports/${testInspectionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('inspectionId');
      expect(response.body.data).toHaveProperty('productionOrder');
      expect(response.body.data).toHaveProperty('checklistItems');
      expect(response.body.data).toHaveProperty('overallScore');
    });

    it('should link QC reports to delivery documentation', async () => {
      const linkData = {
        productionOrderId: testProductionOrderId,
        deliveryDocumentIds: ['delivery_doc_1', 'delivery_doc_2'],
      };

      const response = await request(app)
        .post('/api/v1/qc/link-delivery')
        .set('Authorization', `Bearer ${authToken}`)
        .send(linkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('linked to delivery successfully');
    });
  });

  describe('QC Checklist Templates', () => {
    it('should get stage-specific QC checklist', async () => {
      const response = await request(app)
        .get('/api/v1/qc/checklists/CUTTING')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stage).toBe('CUTTING');
      expect(response.body.data.checklist).toBeInstanceOf(Array);
      expect(response.body.data.checklist.length).toBeGreaterThan(0);
    });

    it('should reject invalid stage for checklist', async () => {
      const response = await request(app)
        .get('/api/v1/qc/checklists/INVALID_STAGE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid QC stage');
    });
  });

  describe('QC Inspection Queries', () => {
    it('should get QC inspections with filtering', async () => {
      const response = await request(app)
        .get('/api/v1/qc/inspections')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          productionOrderId: testProductionOrderId,
          stage: 'CUTTING',
          status: 'PASSED',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('inspections');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should get production order QC inspections', async () => {
      const response = await request(app)
        .get(`/api/v1/qc/production-order/${testProductionOrderId}/inspections`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('inspections');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data.summary).toHaveProperty('overallStatus');
    });
  });

  describe('Customer Requirements', () => {
    it('should update customer-specific requirements', async () => {
      const customerRequirements = [
        'Special packaging for export',
        'Additional quality documentation required',
        'Installation supervision mandatory',
      ];

      const response = await request(app)
        .put(`/api/v1/qc/inspections/${testInspectionId}/customer-requirements`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ customerRequirements })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Customer requirements updated successfully');

      // Verify update
      const inspection = await prisma.qCInspection.findUnique({
        where: { id: testInspectionId },
      });
      
      const storedRequirements = inspection?.customerRequirements ? 
        JSON.parse(inspection.customerRequirements) : null;
      expect(storedRequirements).toEqual(customerRequirements);
    });
  });

  describe('QC Certificate Generation', () => {
    it('should generate QC certificate for production order', async () => {
      const certificateData = {
        productionOrderId: testProductionOrderId,
        certificateType: 'QUALITY_CERTIFICATE',
        issuedBy: 'QC Manager',
        customerApprovalRequired: true,
      };

      const response = await request(app)
        .post('/api/v1/qc/certificates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(certificateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.certificateType).toBe('QUALITY_CERTIFICATE');
      expect(response.body.data.customerApprovalRequired).toBe(true);
      expect(response.body.data.customerApprovalStatus).toBe('PENDING');
      expect(response.body.data.certificateData).toHaveProperty('productDetails');
      expect(response.body.data.certificateData).toHaveProperty('qualityResults');
    });

    it('should require all mandatory fields for certificate generation', async () => {
      const invalidData = {
        certificateType: 'QUALITY_CERTIFICATE',
        // Missing productionOrderId and issuedBy
      };

      const response = await request(app)
        .post('/api/v1/qc/certificates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('required');
    });

    it('should submit certificate for customer approval', async () => {
      const submissionData = {
        submissionNotes: 'Please review and approve the quality certificate',
      };

      const response = await request(app)
        .post('/api/v1/qc/certificates/test-cert-id/submit-approval')
        .set('Authorization', `Bearer ${authToken}`)
        .send(submissionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('submitted for customer approval');
    });

    it('should process customer approval for certificate', async () => {
      const approvalData = {
        approved: true,
        approvedBy: 'Customer Manager',
        comments: 'Quality meets our requirements',
      };

      const response = await request(app)
        .post('/api/v1/qc/certificates/test-cert-id/customer-approval')
        .set('Authorization', `Bearer ${authToken}`)
        .send(approvalData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('approved successfully');
    });

    it('should process customer rejection for certificate', async () => {
      const rejectionData = {
        approved: false,
        approvedBy: 'Customer Manager',
        comments: 'Quality does not meet requirements',
      };

      const response = await request(app)
        .post('/api/v1/qc/certificates/test-cert-id/customer-approval')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rejectionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('rejected successfully');
    });
  });

  describe('QC Dashboard and Real-time Monitoring', () => {
    it('should get QC dashboard data', async () => {
      const response = await request(app)
        .get('/api/v1/qc/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ branchId: testBranchId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('realTimeMetrics');
      expect(response.body.data).toHaveProperty('productionIntegration');
      expect(response.body.data).toHaveProperty('inspectorStatus');
      expect(response.body.data).toHaveProperty('qualityTrends');
      expect(response.body.data).toHaveProperty('alerts');

      // Verify real-time metrics structure
      expect(response.body.data.realTimeMetrics).toHaveProperty('activeInspections');
      expect(response.body.data.realTimeMetrics).toHaveProperty('pendingInspections');
      expect(response.body.data.realTimeMetrics).toHaveProperty('completedToday');
      expect(response.body.data.realTimeMetrics).toHaveProperty('currentPassRate');
      expect(response.body.data.realTimeMetrics).toHaveProperty('alertCount');

      // Verify production integration metrics
      expect(response.body.data.productionIntegration).toHaveProperty('ordersAwaitingQC');
      expect(response.body.data.productionIntegration).toHaveProperty('ordersInQC');
      expect(response.body.data.productionIntegration).toHaveProperty('averageQCTime');
    });

    it('should get QC dashboard data without branch filter', async () => {
      const response = await request(app)
        .get('/api/v1/qc/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('realTimeMetrics');
    });
  });

  describe('QC Production Integration', () => {
    it('should integrate QC with production process', async () => {
      const integrationData = {
        productionOrderId: testProductionOrderId,
        stage: 'COATING',
        triggerType: 'STAGE_COMPLETION',
      };

      const response = await request(app)
        .post('/api/v1/qc/production-integration')
        .set('Authorization', `Bearer ${authToken}`)
        .send(integrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('inspectionId');
      expect(response.body.message).toContain('integrated with production');
    });

    it('should update production order status based on QC results', async () => {
      const updateData = {
        qcStatus: 'PASSED',
      };

      const response = await request(app)
        .put(`/api/v1/qc/inspections/${testInspectionId}/update-production`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Production order status updated');
    });

    it('should require valid parameters for production integration', async () => {
      const invalidData = {
        stage: 'COATING',
        // Missing productionOrderId
      };

      const response = await request(app)
        .post('/api/v1/qc/production-integration')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('required');
    });
  });

  describe('QC Performance Metrics and Inspector Evaluation', () => {
    it('should get comprehensive QC performance metrics', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const response = await request(app)
        .get('/api/v1/qc/performance-metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          branchId: testBranchId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
      expect(response.body.data).toHaveProperty('stagePerformance');
      expect(response.body.data).toHaveProperty('inspectorPerformance');
      expect(response.body.data).toHaveProperty('trends');
      expect(response.body.data).toHaveProperty('realTimeMetrics');
      expect(response.body.data).toHaveProperty('productionIntegration');

      // Verify overview metrics
      expect(response.body.data.overview).toHaveProperty('totalInspections');
      expect(response.body.data.overview).toHaveProperty('passRate');
      expect(response.body.data.overview).toHaveProperty('averageScore');

      // Verify inspector performance data
      expect(response.body.data.inspectorPerformance).toBeInstanceOf(Array);
    });

    it('should require start and end dates for performance metrics', async () => {
      const response = await request(app)
        .get('/api/v1/qc/performance-metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Start date and end date are required');
    });
  });

  describe('QC Alerts and Notifications', () => {
    it('should get QC alerts', async () => {
      const response = await request(app)
        .get('/api/v1/qc/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ branchId: testBranchId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data.alerts).toBeInstanceOf(Array);

      // Verify summary structure
      expect(response.body.data.summary).toHaveProperty('total');
      expect(response.body.data.summary).toHaveProperty('critical');
      expect(response.body.data.summary).toHaveProperty('high');
      expect(response.body.data.summary).toHaveProperty('unacknowledged');
    });

    it('should filter alerts by severity', async () => {
      const response = await request(app)
        .get('/api/v1/qc/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          branchId: testBranchId,
          severity: 'HIGH',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toBeInstanceOf(Array);
    });

    it('should filter alerts by acknowledged status', async () => {
      const response = await request(app)
        .get('/api/v1/qc/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          branchId: testBranchId,
          acknowledged: 'false',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toBeInstanceOf(Array);
    });
  });

  describe('Inspector Workload', () => {
    it('should get inspector workload and performance', async () => {
      // Get the inspector we created earlier
      const employee = await prisma.employee.findFirst({
        where: { employeeCode: 'QC_INSPECTOR_001' },
      });

      if (employee) {
        const response = await request(app)
          .get(`/api/v1/qc/inspector-workload/${employee.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('inspectorId');
        expect(response.body.data).toHaveProperty('pendingCount');
        expect(response.body.data).toHaveProperty('completedToday');
        expect(response.body.data).toHaveProperty('weeklyPassRate');
        expect(response.body.data).toHaveProperty('pendingInspections');
      }
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for QC operations', async () => {
      const response = await request(app)
        .get('/api/v1/qc/inspections')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid authentication token', async () => {
      const response = await request(app)
        .get('/api/v1/qc/inspections')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

// Unit tests for QC Service methods
describe('QC Service Unit Tests', () => {
  let qcService: QCService;

  beforeAll(() => {
    qcService = new QCService(prisma);
  });

  describe('Stage-specific Checklist Generation', () => {
    it('should generate correct checklist for CUTTING stage', async () => {
      // Access private method for testing
      const checklist = await (qcService as any).getStageSpecificChecklist('CUTTING');
      
      expect(checklist).toBeInstanceOf(Array);
      expect(checklist.length).toBeGreaterThan(0);
      expect(checklist[0]).toHaveProperty('checkpointId');
      expect(checklist[0]).toHaveProperty('description');
      expect(checklist[0]).toHaveProperty('expectedValue');
    });

    it('should generate different checklists for different stages', async () => {
      const cuttingChecklist = await (qcService as any).getStageSpecificChecklist('CUTTING');
      const fabricationChecklist = await (qcService as any).getStageSpecificChecklist('FABRICATION');
      
      expect(cuttingChecklist[0].checkpointId).not.toBe(fabricationChecklist[0].checkpointId);
    });
  });

  describe('Score Calculation', () => {
    it('should calculate correct overall score', async () => {
      // Create test inspection and checklist items
      const inspection = await prisma.qCInspection.create({
        data: {
          inspectionNumber: 'TEST_SCORE_001',
          productionOrderId: 'test-po-id',
          stage: 'CUTTING',
          status: 'PENDING',
        },
      });

      // Create checklist items with mixed results
      await prisma.qCChecklistItem.createMany({
        data: [
          {
            inspectionId: inspection.id,
            checkpointId: 'TEST_001',
            description: 'Test checkpoint 1',
            expectedValue: 'Pass',
            status: 'PASS',
          },
          {
            inspectionId: inspection.id,
            checkpointId: 'TEST_002',
            description: 'Test checkpoint 2',
            expectedValue: 'Pass',
            status: 'PASS',
          },
          {
            inspectionId: inspection.id,
            checkpointId: 'TEST_003',
            description: 'Test checkpoint 3',
            expectedValue: 'Pass',
            status: 'FAIL',
          },
          {
            inspectionId: inspection.id,
            checkpointId: 'TEST_004',
            description: 'Test checkpoint 4',
            expectedValue: 'Pass',
            status: 'NA',
          },
        ],
      });

      const score = await (qcService as any).calculateOverallScore(inspection.id);
      
      // 2 passed out of 3 applicable items (excluding NA) = 67%
      expect(score).toBe(67);

      // Clean up
      await prisma.qCChecklistItem.deleteMany({
        where: { inspectionId: inspection.id },
      });
      await prisma.qCInspection.delete({
        where: { id: inspection.id },
      });
    });
  });

  describe('Rework Instructions Generation', () => {
    it('should generate appropriate rework instructions', async () => {
      const failureReasons = [
        'Dimension out of tolerance',
        'Surface finish poor',
      ];

      const instructions = (qcService as any).generateReworkInstructions('CUTTING', failureReasons);
      
      expect(instructions).toContain('Re-cut material');
      expect(instructions).toContain('Dimension out of tolerance');
      expect(instructions).toContain('Surface finish poor');
    });

    it('should estimate rework hours correctly', async () => {
      const hours = (qcService as any).estimateReworkHours('FABRICATION', 3);
      
      // Base hours for FABRICATION (4) + (3 failures * 0.5) = 5.5 hours
      expect(hours).toBe(5.5);
    });
  });

  describe('QC Certificate Generation', () => {
    it('should generate certificate number correctly', async () => {
      const certificateNumber = await (qcService as any).generateCertificateNumber('QUALITY_CERTIFICATE');
      
      expect(certificateNumber).toMatch(/^QC\d{6}\d{4}$/);
      expect(certificateNumber).toContain(new Date().getFullYear().toString());
    });

    it('should generate different prefixes for different certificate types', async () => {
      const qualityCert = await (qcService as any).generateCertificateNumber('QUALITY_CERTIFICATE');
      const complianceCert = await (qcService as any).generateCertificateNumber('COMPLIANCE_CERTIFICATE');
      const testCert = await (qcService as any).generateCertificateNumber('TEST_CERTIFICATE');
      
      expect(qualityCert).toMatch(/^QC/);
      expect(complianceCert).toMatch(/^CC/);
      expect(testCert).toMatch(/^TC/);
    });
  });

  describe('QC Dashboard Data Generation', () => {
    it('should calculate inspector workload correctly', async () => {
      const workloadData = await (qcService as any).getInspectorWorkloadData();
      
      expect(workloadData).toBeInstanceOf(Array);
      
      if (workloadData.length > 0) {
        expect(workloadData[0]).toHaveProperty('inspectorId');
        expect(workloadData[0]).toHaveProperty('inspectorName');
        expect(workloadData[0]).toHaveProperty('pendingCount');
        expect(workloadData[0]).toHaveProperty('efficiency');
      }
    });

    it('should generate QC alerts correctly', async () => {
      const alerts = await (qcService as any).generateQCAlerts();
      
      expect(alerts).toBeInstanceOf(Array);
      
      alerts.forEach((alert: any) => {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('createdAt');
        expect(alert).toHaveProperty('acknowledged');
      });
    });

    it('should calculate average QC time correctly', async () => {
      const avgTime = await (qcService as any).calculateAverageQCTime();
      
      expect(typeof avgTime).toBe('number');
      expect(avgTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Production Integration', () => {
    it('should determine correct production status from QC results', async () => {
      // Get a test production order ID from the outer scope
      const productionOrder = await prisma.productionOrder.findFirst({
        where: { orderNumber: 'PO-QC-TEST-001' },
      });

      if (!productionOrder) {
        throw new Error('Test production order not found');
      }

      // Create test inspection for status determination
      const inspection = await prisma.qCInspection.create({
        data: {
          inspectionNumber: 'TEST_STATUS_001',
          productionOrderId: productionOrder.id,
          stage: 'CUTTING',
          status: 'PASSED',
          overallScore: 95,
        },
      });

      // Test status update
      await qcService.updateProductionOrderFromQC(inspection.id, 'PASSED');

      // Verify production order status was updated
      const updatedOrder = await prisma.productionOrder.findUnique({
        where: { id: productionOrder.id },
      });

      expect(updatedOrder?.status).toBeDefined();

      // Clean up
      await prisma.qCInspection.delete({
        where: { id: inspection.id },
      });
    });
  });
});
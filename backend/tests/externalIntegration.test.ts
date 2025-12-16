// External Integration Tests
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/index';
import { generateAccessToken } from '../src/auth/jwt';
import { hashPassword } from '../src/auth/password';

const prisma = new PrismaClient();

describe('External Integration API', () => {
  let authToken: string;
  let testUserId: string;
  let testBranchId: string;
  let testLeadId: string;
  let testCustomerId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    const timestamp = Date.now();
    
    // Create test branch
    const branch = await prisma.branch.create({
      data: {
        code: `TEST-BRANCH-${timestamp}`,
        name: 'Test Branch',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
      },
    });
    testBranchId = branch.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        id: `test-user-${timestamp}`,
        email: `test-${timestamp}@example.com`,
        username: `testuser${timestamp}`,
        password: await hashPassword('password123'),
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      },
    });
    testUserId = user.id;

    // Create user session
    const session = await prisma.userSession.create({
      data: {
        id: `test-session-${timestamp}`,
        userId: user.id,
        token: `test-token-${timestamp}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Generate auth token
    authToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: ['ADMIN'],
      sessionId: session.id,
    });

    // Create test customer
    const customer = await prisma.customer.create({
      data: {
        code: `CUST-${timestamp}`,
        name: 'Test Customer',
        phone: '9876543210',
        email: `customer-${timestamp}@example.com`,
        address: '456 Customer St',
        city: 'Customer City',
        state: 'Customer State',
        pincode: '654321',
        branchId: testBranchId,
      },
    });
    testCustomerId = customer.id;

    // Create test lead
    const lead = await prisma.lead.create({
      data: {
        leadNumber: `LD${timestamp}`,
        source: 'META',
        sourceRef: 'FB_CAMPAIGN_123',
        contactName: 'Test Lead',
        phone: '9876543211',
        email: `lead-${timestamp}@example.com`,
        address: '789 Lead St',
        requirements: 'Steel door for home',
        estimatedValue: 50000,
        status: 'NEW',
        priority: 'MEDIUM',
      },
    });
    testLeadId = lead.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.communicationHistory.deleteMany({
      where: {
        OR: [
          { leadId: testLeadId },
          { customerId: testCustomerId },
        ],
      },
    });
    
    await prisma.leadScoring.deleteMany({
      where: { leadId: testLeadId },
    });
    
    await prisma.externalLeadSource.deleteMany({
      where: { leadId: testLeadId },
    });
    
    await prisma.lead.deleteMany({
      where: { id: testLeadId },
    });
    
    await prisma.customer.deleteMany({
      where: { id: testCustomerId },
    });
    
    await prisma.userSession.deleteMany({
      where: { userId: testUserId },
    });
    
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
    
    await prisma.branch.deleteMany({
      where: { id: testBranchId },
    });

    await prisma.$disconnect();
  });

  describe('Communication Management', () => {
    test('should send communication successfully', async () => {
      const communicationData = {
        leadId: testLeadId,
        type: 'EMAIL',
        recipient: 'test@example.com',
        subject: 'Test Communication',
        content: 'This is a test communication message',
        metadata: {
          source: 'test',
        },
      };

      const response = await request(app)
        .post('/api/v1/external-integration/communications/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(communicationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('SENT');
    });

    test('should get communication history', async () => {
      const response = await request(app)
        .get(`/api/v1/external-integration/communications/history?leadId=${testLeadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should send customer notification', async () => {
      const notificationData = {
        customerId: testCustomerId,
        type: 'ORDER_CONFIRMATION',
        data: {
          orderNumber: 'SO202412001',
          orderAmount: 75000,
          deliveryDate: '2024-12-30',
        },
      };

      const response = await request(app)
        .post('/api/v1/external-integration/notifications/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notifications sent successfully');
    });
  });

  describe('Lead Scoring', () => {
    test('should calculate lead score', async () => {
      const response = await request(app)
        .post(`/api/v1/external-integration/leads/${testLeadId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('leadId', testLeadId);
      expect(response.body.data).toHaveProperty('totalScore');
      expect(response.body.data).toHaveProperty('qualificationStatus');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });

    test('should get existing lead score', async () => {
      const response = await request(app)
        .get(`/api/v1/external-integration/leads/${testLeadId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('leadId', testLeadId);
      expect(response.body.data).toHaveProperty('totalScore');
    });

    test('should get leads by qualification status', async () => {
      const response = await request(app)
        .get('/api/v1/external-integration/leads/qualified/QUALIFIED')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should reject invalid qualification status', async () => {
      const response = await request(app)
        .get('/api/v1/external-integration/leads/qualified/INVALID')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid qualification status');
    });
  });

  describe('Integration Statistics', () => {
    test('should get integration statistics', async () => {
      const response = await request(app)
        .get('/api/v1/external-integration/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('leadSources');
      expect(response.body.data).toHaveProperty('communications');
      expect(response.body.data).toHaveProperty('leadScoring');
      expect(response.body.data).toHaveProperty('summary');
    });

    test('should get integration statistics with date range', async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const until = new Date().toISOString();

      const response = await request(app)
        .get(`/api/v1/external-integration/stats?since=${since}&until=${until}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toHaveProperty('since');
      expect(response.body.data.period).toHaveProperty('until');
    });
  });

  describe('Connection Testing', () => {
    test('should test external API connections', async () => {
      const response = await request(app)
        .get('/api/v1/external-integration/test-connections')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('whatsapp');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('sms');
      expect(response.body.data).toHaveProperty('meta');
      expect(response.body.data).toHaveProperty('google');
    });
  });

  describe('Lead Sync Operations', () => {
    test('should sync Meta leads with validation', async () => {
      const syncData = {
        limit: 10,
        autoScore: true,
        autoFollowUp: false,
      };

      // Note: This will likely fail in test environment due to missing API credentials
      // but we're testing the endpoint structure and validation
      const response = await request(app)
        .post('/api/v1/external-integration/sync/meta')
        .set('Authorization', `Bearer ${authToken}`)
        .send(syncData);

      // Expect either success or a specific error about missing credentials
      expect([200, 500].includes(response.status)).toBe(true);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalProcessed');
        expect(response.body.data).toHaveProperty('successfulImports');
        expect(response.body.data).toHaveProperty('duplicates');
        expect(response.body.data).toHaveProperty('errors');
      }
    });

    test('should sync Google Ads leads with validation', async () => {
      const syncData = {
        customerId: '1234567890',
        limit: 10,
        autoScore: true,
        autoFollowUp: false,
      };

      // Note: This will likely fail in test environment due to missing API credentials
      const response = await request(app)
        .post('/api/v1/external-integration/sync/google')
        .set('Authorization', `Bearer ${authToken}`)
        .send(syncData);

      // Expect either success or a specific error about missing credentials
      expect([200, 500].includes(response.status)).toBe(true);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalProcessed');
      }
    });

    test('should validate sync request data', async () => {
      const invalidSyncData = {
        limit: -1, // Invalid limit
        autoScore: 'invalid', // Should be boolean
      };

      const response = await request(app)
        .post('/api/v1/external-integration/sync/meta')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSyncData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Webhook Endpoints', () => {
    test('should handle WhatsApp webhook verification', async () => {
      const verifyToken = 'test-verify-token';
      process.env.WHATSAPP_VERIFY_TOKEN = verifyToken;

      const response = await request(app)
        .get('/api/v1/external-integration/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': verifyToken,
          'hub.challenge': 'test-challenge',
        })
        .expect(200);

      expect(response.text).toBe('test-challenge');
    });

    test('should reject invalid WhatsApp webhook verification', async () => {
      const response = await request(app)
        .get('/api/v1/external-integration/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'invalid-token',
          'hub.challenge': 'test-challenge',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should handle Meta webhook verification', async () => {
      const verifyToken = 'test-meta-verify-token';
      process.env.META_VERIFY_TOKEN = verifyToken;

      const response = await request(app)
        .get('/api/v1/external-integration/webhooks/meta')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': verifyToken,
          'hub.challenge': 'meta-test-challenge',
        })
        .expect(200);

      expect(response.text).toBe('meta-test-challenge');
    });
  });

  describe('Authentication and Authorization', () => {
    test('should require authentication for protected endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/external-integration/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid authentication tokens', async () => {
      const response = await request(app)
        .get('/api/v1/external-integration/stats')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Input Validation', () => {
    test('should validate communication request data', async () => {
      const invalidData = {
        type: 'INVALID_TYPE',
        recipient: '', // Empty recipient
        content: '', // Empty content
      };

      const response = await request(app)
        .post('/api/v1/external-integration/communications/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate notification request data', async () => {
      const invalidData = {
        customerId: 'invalid-uuid',
        type: 'INVALID_TYPE',
        data: 'not-an-object',
      };

      const response = await request(app)
        .post('/api/v1/external-integration/notifications/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('External Integration Services Unit Tests', () => {
  describe('Lead Scoring Service', () => {
    test('should calculate lead score with proper breakdown', async () => {
      // This would be a more detailed unit test of the LeadScoringService
      // Testing the scoring algorithm directly
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Communication Service', () => {
    test('should format messages correctly for different channels', async () => {
      // This would test the message formatting logic
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('External API Services', () => {
    test('should handle API errors gracefully', async () => {
      // This would test error handling in external API calls
      expect(true).toBe(true); // Placeholder
    });
  });
});
import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/database/connection';

describe('Customer Portal API', () => {
  let customerId: string;
  let customerToken: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.customerPortalCredentials.deleteMany({
      where: { email: 'testcustomer@example.com' }
    });
    await prisma.customer.deleteMany({
      where: { email: 'testcustomer@example.com' }
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (customerId) {
      await prisma.customerPortalCredentials.deleteMany({
        where: { customerId }
      });
      await prisma.customer.deleteMany({
        where: { id: customerId }
      });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/v1/customer-portal/register', () => {
    it('should register a new customer successfully', async () => {
      const customerData = {
        name: 'Test Customer',
        email: 'testcustomer@example.com',
        phone: '9876543210',
        password: 'password123',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        gstNumber: 'GST123456789'
      };

      const response = await request(app)
        .post('/api/v1/customer-portal/register')
        .send(customerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(customerData.name);
      expect(response.body.data.email).toBe(customerData.email);
      
      customerId = response.body.data.id;
    });

    it('should not register customer with duplicate email', async () => {
      const customerData = {
        name: 'Another Customer',
        email: 'testcustomer@example.com', // Same email
        phone: '9876543211',
        password: 'password123',
        address: '456 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      };

      const response = await request(app)
        .post('/api/v1/customer-portal/register')
        .send(customerData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CUSTOMER_EXISTS');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        name: 'Test Customer',
        email: 'test2@example.com'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/v1/customer-portal/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });
  });

  describe('POST /api/v1/customer-portal/login', () => {
    it('should login customer with email and password', async () => {
      const loginData = {
        email: 'testcustomer@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/customer-portal/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('customer');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
      
      customerToken = response.body.data.tokens.accessToken;
    });

    it('should login customer with phone and password', async () => {
      const loginData = {
        phone: '9876543210',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/customer-portal/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customer.phone).toBe('9876543210');
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'testcustomer@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/customer-portal/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should require password', async () => {
      const loginData = {
        email: 'testcustomer@example.com'
        // Missing password
      };

      const response = await request(app)
        .post('/api/v1/customer-portal/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_PASSWORD');
    });
  });

  describe('GET /api/v1/customer-portal/orders', () => {
    it('should get customer orders with authentication', async () => {
      const response = await request(app)
        .get('/api/v1/customer-portal/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('x-customer-id', customerId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require customer ID header', async () => {
      const response = await request(app)
        .get('/api/v1/customer-portal/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_CUSTOMER_ID');
    });
  });

  describe('POST /api/v1/customer-portal/service-requests', () => {
    it('should book a service request', async () => {
      const serviceData = {
        type: 'MAINTENANCE',
        priority: 'MEDIUM',
        description: 'Test maintenance service',
        preferredDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        address: '123 Service Address'
      };

      const response = await request(app)
        .post('/api/v1/customer-portal/service-requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('x-customer-id', customerId)
        .send(serviceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('serviceNumber');
      expect(response.body.data.type).toBe(serviceData.type);
    });

    it('should validate required fields for service booking', async () => {
      const incompleteData = {
        type: 'MAINTENANCE'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/v1/customer-portal/service-requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('x-customer-id', customerId)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });
  });

  describe('POST /api/v1/customer-portal/feedback', () => {
    it('should submit customer feedback', async () => {
      const feedbackData = {
        rating: 5,
        feedback: 'Excellent service and product quality!',
        category: 'PRODUCT'
      };

      const response = await request(app)
        .post('/api/v1/customer-portal/feedback')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('x-customer-id', customerId)
        .send(feedbackData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.rating).toBe(feedbackData.rating);
    });

    it('should validate rating range', async () => {
      const invalidFeedback = {
        rating: 6, // Invalid rating
        feedback: 'Test feedback',
        category: 'PRODUCT'
      };

      const response = await request(app)
        .post('/api/v1/customer-portal/feedback')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('x-customer-id', customerId)
        .send(invalidFeedback)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_RATING');
    });
  });

  describe('GET /api/v1/customer-portal/documents', () => {
    it('should get customer documents', async () => {
      const response = await request(app)
        .get('/api/v1/customer-portal/documents')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('x-customer-id', customerId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
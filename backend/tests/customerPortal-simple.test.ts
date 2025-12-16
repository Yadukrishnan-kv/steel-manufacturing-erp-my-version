import { CustomerPortalService } from '../src/services/customerPortal.service';
import { prisma } from '../src/database/connection';

describe('Customer Portal Service', () => {
  let customerId: string;

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

  describe('Customer Registration', () => {
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

      const result = await CustomerPortalService.registerCustomer(customerData);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(customerData.name);
      expect(result.email).toBe(customerData.email);
      expect(result.phone).toBe(customerData.phone);
      
      customerId = result.id;
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

      await expect(CustomerPortalService.registerCustomer(customerData))
        .rejects
        .toThrow('Customer with this email or phone already exists');
    });
  });

  describe('Customer Login', () => {
    it('should login customer with email and password', async () => {
      const loginData = {
        email: 'testcustomer@example.com',
        password: 'password123'
      };

      const result = await CustomerPortalService.loginCustomer(loginData);

      expect(result).toHaveProperty('customer');
      expect(result).toHaveProperty('tokens');
      expect(result.customer.email).toBe(loginData.email);
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should login customer with phone and password', async () => {
      const loginData = {
        phone: '9876543210',
        password: 'password123'
      };

      const result = await CustomerPortalService.loginCustomer(loginData);

      expect(result.customer.phone).toBe(loginData.phone);
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'testcustomer@example.com',
        password: 'wrongpassword'
      };

      await expect(CustomerPortalService.loginCustomer(loginData))
        .rejects
        .toThrow('Invalid credentials');
    });
  });

  describe('Customer Orders', () => {
    it('should get customer orders (empty initially)', async () => {
      const orders = await CustomerPortalService.getCustomerOrders(customerId);
      
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBe(0);
    });
  });

  describe('Service Requests', () => {
    it('should get customer service requests (empty initially)', async () => {
      const serviceRequests = await CustomerPortalService.getCustomerServiceRequests(customerId);
      
      expect(Array.isArray(serviceRequests)).toBe(true);
      expect(serviceRequests.length).toBe(0);
    });
  });

  describe('Customer Documents', () => {
    it('should get customer documents (empty initially)', async () => {
      const documents = await CustomerPortalService.getCustomerDocuments(customerId);
      
      expect(Array.isArray(documents)).toBe(true);
      expect(documents.length).toBe(0);
    });
  });

  describe('Customer Feedback', () => {
    it('should submit customer feedback', async () => {
      const feedbackData = {
        customerId,
        rating: 5,
        feedback: 'Excellent service and product quality!',
        category: 'PRODUCT' as const
      };

      const result = await CustomerPortalService.submitFeedback(feedbackData);

      expect(result).toHaveProperty('id');
      expect(result.rating).toBe(feedbackData.rating);
      expect(result.feedback).toBe(feedbackData.feedback);
      expect(result.category).toBe(feedbackData.category);
    });
  });
});
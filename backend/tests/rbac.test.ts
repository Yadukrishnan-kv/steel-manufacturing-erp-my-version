import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/database/connection';
import { RBACService } from '../src/services/rbac.service';
import { hashPassword } from '../src/auth/password';

describe('RBAC System', () => {
  let superAdminToken: string;
  let branchManagerToken: string;
  let salesExecutiveToken: string;
  let testBranchId: string;
  let testUserId: string;
  let testRoleId: string;

  beforeAll(async () => {
    // Initialize RBAC system
    await RBACService.initializePredefinedRoles();

    // Create test branch
    const testBranch = await prisma.branch.create({
      data: {
        code: 'TEST001',
        name: 'Test Branch',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      }
    });
    testBranchId = testBranch.id;

    // Create test users
    const hashedPassword = await hashPassword('password123');

    // Super Admin
    const superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@test.com',
        username: 'superadmin',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin'
      }
    });

    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' }
    });

    if (superAdminRole) {
      await prisma.userRole.create({
        data: {
          userId: superAdmin.id,
          roleId: superAdminRole.id
        }
      });
    }

    // Branch Manager
    const branchManager = await prisma.user.create({
      data: {
        email: 'branchmanager@test.com',
        username: 'branchmanager',
        password: hashedPassword,
        firstName: 'Branch',
        lastName: 'Manager'
      }
    });

    const branchManagerRole = await prisma.role.findUnique({
      where: { name: 'BRANCH_MANAGER' }
    });

    if (branchManagerRole) {
      await prisma.userRole.create({
        data: {
          userId: branchManager.id,
          roleId: branchManagerRole.id,
          branchId: testBranchId
        }
      });
    }

    // Sales Executive
    const salesExecutive = await prisma.user.create({
      data: {
        email: 'salesexec@test.com',
        username: 'salesexec',
        password: hashedPassword,
        firstName: 'Sales',
        lastName: 'Executive'
      }
    });
    testUserId = salesExecutive.id;

    const salesExecutiveRole = await prisma.role.findUnique({
      where: { name: 'SALES_EXECUTIVE' }
    });

    if (salesExecutiveRole) {
      testRoleId = salesExecutiveRole.id;
      await prisma.userRole.create({
        data: {
          userId: salesExecutive.id,
          roleId: salesExecutiveRole.id,
          branchId: testBranchId
        }
      });
    }

    // Login users to get tokens
    const superAdminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@test.com',
        password: 'password123'
      });
    superAdminToken = superAdminLogin.body.data.tokens.accessToken;

    const branchManagerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'branchmanager@test.com',
        password: 'password123'
      });
    branchManagerToken = branchManagerLogin.body.data.tokens.accessToken;

    const salesExecutiveLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'salesexec@test.com',
        password: 'password123'
      });
    salesExecutiveToken = salesExecutiveLogin.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.userRole.deleteMany({});
    await prisma.userSession.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['superadmin@test.com', 'branchmanager@test.com', 'salesexec@test.com']
        }
      }
    });
    await prisma.branch.delete({
      where: { id: testBranchId }
    });
  });

  describe('RBAC Service', () => {
    it('should initialize predefined roles', async () => {
      const roles = await prisma.role.findMany({
        where: { isActive: true }
      });

      expect(roles.length).toBeGreaterThan(0);
      
      const roleNames = roles.map(r => r.name);
      expect(roleNames).toContain('SUPER_ADMIN');
      expect(roleNames).toContain('BRANCH_MANAGER');
      expect(roleNames).toContain('SALES_EXECUTIVE');
    });

    it('should check user permissions correctly', async () => {
      // Super admin should have all permissions
      const superAdminHasPermission = await RBACService.hasPermission({
        userId: (await prisma.user.findUnique({ where: { email: 'superadmin@test.com' } }))!.id,
        module: 'SALES',
        action: 'CREATE',
        resource: 'LEAD'
      });
      expect(superAdminHasPermission).toBe(true);

      // Sales executive should have sales permissions
      const salesExecHasPermission = await RBACService.hasPermission({
        userId: testUserId,
        module: 'SALES',
        action: 'CREATE',
        resource: 'LEAD'
      });
      expect(salesExecHasPermission).toBe(true);

      // Sales executive should not have manufacturing permissions
      const salesExecNoManufacturing = await RBACService.hasPermission({
        userId: testUserId,
        module: 'MANUFACTURING',
        action: 'CREATE',
        resource: 'PRODUCTION_ORDER'
      });
      expect(salesExecNoManufacturing).toBe(false);
    });

    it('should get user accessible branches', async () => {
      const accessibleBranches = await RBACService.getUserAccessibleBranches(testUserId);
      expect(accessibleBranches).toContain(testBranchId);
    });
  });

  describe('RBAC API Endpoints', () => {
    it('should initialize RBAC system (Super Admin only)', async () => {
      const response = await request(app)
        .post('/api/v1/rbac/initialize')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not allow non-super-admin to initialize RBAC', async () => {
      const response = await request(app)
        .post('/api/v1/rbac/initialize')
        .set('Authorization', `Bearer ${branchManagerToken}`);

      expect(response.status).toBe(403);
    });

    it('should get all roles', async () => {
      const response = await request(app)
        .get('/api/v1/rbac/roles')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.roles)).toBe(true);
    });

    it('should get all permissions', async () => {
      const response = await request(app)
        .get('/api/v1/rbac/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.permissions)).toBe(true);
    });

    it('should get users with roles', async () => {
      const response = await request(app)
        .get('/api/v1/rbac/users')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it('should assign role to user', async () => {
      // Create a test user first
      const testUser = await prisma.user.create({
        data: {
          email: 'testuser@test.com',
          username: 'testuser',
          password: await hashPassword('password123'),
          firstName: 'Test',
          lastName: 'User'
        }
      });

      const response = await request(app)
        .post('/api/v1/rbac/users/assign-role')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          userId: testUser.id,
          roleId: testRoleId,
          branchId: testBranchId
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Clean up
      await prisma.userRole.deleteMany({
        where: { userId: testUser.id }
      });
      await prisma.user.delete({
        where: { id: testUser.id }
      });
    });

    it('should get current user permissions', async () => {
      const response = await request(app)
        .get('/api/v1/rbac/me/permissions')
        .set('Authorization', `Bearer ${salesExecutiveToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.permissions)).toBe(true);
      expect(Array.isArray(response.body.data.roles)).toBe(true);
    });

    it('should get accessible branches for current user', async () => {
      const response = await request(app)
        .get('/api/v1/rbac/me/branches')
        .set('Authorization', `Bearer ${salesExecutiveToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.branches)).toBe(true);
    });
  });

  describe('Authorization Middleware', () => {
    it('should allow access with correct permissions', async () => {
      // This would test actual protected endpoints once they're implemented
      // For now, we test the RBAC endpoints themselves
      const response = await request(app)
        .get('/api/v1/rbac/me/permissions')
        .set('Authorization', `Bearer ${salesExecutiveToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/rbac/roles');

      expect(response.status).toBe(401);
    });

    it('should deny access with insufficient permissions', async () => {
      const response = await request(app)
        .post('/api/v1/rbac/initialize')
        .set('Authorization', `Bearer ${salesExecutiveToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Data Isolation', () => {
    it('should create proper branch filters', async () => {
      const branchFilter = await RBACService.createBranchFilter(testUserId, 'sales_orders');
      
      expect(branchFilter).toHaveProperty('branchId');
      expect(branchFilter).toHaveProperty('branchId');
      if (branchFilter.branchId && 'in' in branchFilter.branchId) {
        expect(branchFilter.branchId.in).toContain(testBranchId);
      }
    });

    it('should allow super admin access to all branches', async () => {
      const superAdminUser = await prisma.user.findUnique({
        where: { email: 'superadmin@test.com' }
      });

      const branchFilter = await RBACService.createBranchFilter(superAdminUser!.id, 'sales_orders');
      
      // Super admin should have no filter (access to all)
      expect(Object.keys(branchFilter)).toHaveLength(0);
    });
  });
});
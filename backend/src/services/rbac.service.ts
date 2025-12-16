import { prisma } from '../database/connection';
import { AppError } from '../middleware/error';
import { logger } from '../utils/logger';

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions: string[];
}

export interface AssignRoleData {
  userId: string;
  roleId: string;
  branchId?: string;
}

export interface PermissionContext {
  userId: string;
  module: string;
  action: string;
  resource?: string;
  branchId?: string;
  departmentId?: string;
  resourceId?: string;
}

/**
 * Role-Based Access Control Service
 * Handles roles, permissions, and access control logic
 */
export class RBACService {
  /**
   * Initialize predefined roles and permissions
   */
  static async initializePredefinedRoles() {
    const predefinedRoles = [
      {
        name: 'SUPER_ADMIN',
        description: 'Super Administrator with full system access',
        permissions: ['*:*:*'] // All permissions
      },
      {
        name: 'BRANCH_MANAGER',
        description: 'Branch Manager with branch-level access',
        permissions: [
          'MANUFACTURING:*:*',
          'SALES:*:*',
          'INVENTORY:*:*',
          'PROCUREMENT:*:*',
          'QC:*:*',
          'SERVICE:*:*',
          'FINANCE:READ:*',
          'FINANCE:CREATE:INVOICE',
          'FINANCE:UPDATE:INVOICE',
          'HR:READ:*',
          'BI:READ:*',
          'ALERTS:*:*'
        ]
      },
      {
        name: 'PRODUCTION_MANAGER',
        description: 'Production Manager with manufacturing access',
        permissions: [
          'MANUFACTURING:*:*',
          'INVENTORY:READ:*',
          'INVENTORY:UPDATE:STOCK',
          'QC:*:*',
          'PROCUREMENT:READ:*',
          'PROCUREMENT:CREATE:PR',
          'BI:READ:PRODUCTION',
          'ALERTS:READ:*'
        ]
      },
      {
        name: 'SALES_MANAGER',
        description: 'Sales Manager with sales and customer access',
        permissions: [
          'SALES:*:*',
          'CUSTOMER:*:*',
          'INVENTORY:READ:*',
          'MANUFACTURING:READ:*',
          'SERVICE:READ:*',
          'BI:READ:SALES',
          'ALERTS:READ:*'
        ]
      },
      {
        name: 'INVENTORY_MANAGER',
        description: 'Inventory Manager with warehouse access',
        permissions: [
          'INVENTORY:*:*',
          'PROCUREMENT:READ:*',
          'PROCUREMENT:CREATE:PR',
          'MANUFACTURING:READ:*',
          'SALES:READ:*',
          'BI:READ:INVENTORY',
          'ALERTS:READ:*'
        ]
      },
      {
        name: 'PROCUREMENT_MANAGER',
        description: 'Procurement Manager with supplier and purchase access',
        permissions: [
          'PROCUREMENT:*:*',
          'SUPPLIER:*:*',
          'INVENTORY:READ:*',
          'MANUFACTURING:READ:*',
          'FINANCE:READ:PAYABLES',
          'BI:READ:PROCUREMENT',
          'ALERTS:READ:*'
        ]
      },
      {
        name: 'QC_MANAGER',
        description: 'Quality Control Manager with QC access',
        permissions: [
          'QC:*:*',
          'MANUFACTURING:READ:*',
          'MANUFACTURING:UPDATE:PRODUCTION_ORDER',
          'INVENTORY:READ:*',
          'BI:READ:QC',
          'ALERTS:READ:*'
        ]
      },
      {
        name: 'SERVICE_MANAGER',
        description: 'Service Manager with service and installation access',
        permissions: [
          'SERVICE:*:*',
          'CUSTOMER:READ:*',
          'CUSTOMER:UPDATE:SERVICE_HISTORY',
          'INVENTORY:READ:*',
          'INVENTORY:UPDATE:SERVICE_PARTS',
          'SALES:READ:*',
          'BI:READ:SERVICE',
          'ALERTS:READ:*'
        ]
      },
      {
        name: 'FINANCE_MANAGER',
        description: 'Finance Manager with financial access',
        permissions: [
          'FINANCE:*:*',
          'SALES:READ:*',
          'PROCUREMENT:READ:*',
          'MANUFACTURING:READ:COSTING',
          'HR:READ:PAYROLL',
          'BI:READ:FINANCE',
          'ALERTS:READ:*'
        ]
      },
      {
        name: 'HR_MANAGER',
        description: 'HR Manager with employee and payroll access',
        permissions: [
          'HR:*:*',
          'EMPLOYEE:*:*',
          'BI:READ:HR',
          'ALERTS:READ:*'
        ]
      },
      {
        name: 'SALES_EXECUTIVE',
        description: 'Sales Executive with lead and order access',
        permissions: [
          'SALES:CREATE:LEAD',
          'SALES:UPDATE:LEAD',
          'SALES:READ:LEAD',
          'SALES:CREATE:ESTIMATE',
          'SALES:UPDATE:ESTIMATE',
          'SALES:READ:ESTIMATE',
          'SALES:CREATE:SALES_ORDER',
          'SALES:READ:SALES_ORDER',
          'CUSTOMER:CREATE:*',
          'CUSTOMER:UPDATE:*',
          'CUSTOMER:READ:*',
          'INVENTORY:READ:*',
          'ALERTS:READ:SALES'
        ]
      },
      {
        name: 'PRODUCTION_SUPERVISOR',
        description: 'Production Supervisor with production floor access',
        permissions: [
          'MANUFACTURING:READ:*',
          'MANUFACTURING:UPDATE:PRODUCTION_ORDER',
          'MANUFACTURING:CREATE:SCRAP_RECORD',
          'MANUFACTURING:UPDATE:MATERIAL_CONSUMPTION',
          'QC:READ:*',
          'INVENTORY:READ:*',
          'ALERTS:READ:PRODUCTION'
        ]
      },
      {
        name: 'QC_INSPECTOR',
        description: 'QC Inspector with inspection access',
        permissions: [
          'QC:CREATE:INSPECTION',
          'QC:UPDATE:INSPECTION',
          'QC:READ:INSPECTION',
          'QC:CREATE:REWORK',
          'MANUFACTURING:READ:PRODUCTION_ORDER',
          'ALERTS:READ:QC'
        ]
      },
      {
        name: 'WAREHOUSE_OPERATOR',
        description: 'Warehouse Operator with stock movement access',
        permissions: [
          'INVENTORY:CREATE:STOCK_TRANSACTION',
          'INVENTORY:UPDATE:STOCK_TRANSACTION',
          'INVENTORY:READ:*',
          'PROCUREMENT:READ:GRN',
          'PROCUREMENT:UPDATE:GRN',
          'ALERTS:READ:INVENTORY'
        ]
      },
      {
        name: 'SERVICE_TECHNICIAN',
        description: 'Service Technician with field service access',
        permissions: [
          'SERVICE:READ:SERVICE_REQUEST',
          'SERVICE:UPDATE:SERVICE_REQUEST',
          'SERVICE:CREATE:SERVICE_COMPLETION',
          'CUSTOMER:READ:*',
          'INVENTORY:READ:SERVICE_PARTS',
          'INVENTORY:UPDATE:SERVICE_PARTS',
          'ALERTS:READ:SERVICE'
        ]
      },
      {
        name: 'EMPLOYEE',
        description: 'Regular Employee with basic access',
        permissions: [
          'EMPLOYEE_PORTAL:READ:PROFILE',
          'EMPLOYEE_PORTAL:UPDATE:PROFILE',
          'EMPLOYEE_PORTAL:READ:ATTENDANCE',
          'EMPLOYEE_PORTAL:CREATE:LEAVE_REQUEST',
          'EMPLOYEE_PORTAL:READ:PAYROLL',
          'EMPLOYEE_PORTAL:READ:KPI'
        ]
      }
    ];

    for (const roleData of predefinedRoles) {
      await this.createOrUpdateRole(roleData);
    }

    logger.info('Predefined roles initialized successfully');
  }

  /**
   * Create or update a role with permissions
   */
  static async createOrUpdateRole(roleData: CreateRoleData) {
    const { name, description, permissions } = roleData;

    // Create or update role
    const role = await prisma.role.upsert({
      where: { name },
      update: {
        description: description || null,
        updatedAt: new Date()
      },
      create: {
        name,
        description: description || null,
      }
    });

    // Create permissions if they don't exist
    const permissionRecords = [];
    for (const permissionString of permissions) {
      const parts = permissionString.split(':');
      const module = parts[0] || '';
      const action = parts[1] || '';
      const resource = parts[2] || null;
      
      const createData: any = {
        module,
        action,
        description: `${action} access to ${module}${resource ? `:${resource}` : ''}`
      };

      if (resource !== null) {
        createData.resource = resource;
      }

      const permission = await prisma.permission.upsert({
        where: {
          module_action_resource: {
            module,
            action,
            resource: resource as string
          }
        },
        update: {},
        create: createData
      });

      permissionRecords.push(permission);
    }

    // Clear existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    });

    // Assign permissions to role
    for (const permission of permissionRecords) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }

    return role;
  }

  /**
   * Assign role to user
   */
  static async assignRoleToUser(assignData: AssignRoleData) {
    const { userId, roleId, branchId } = assignData;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
    }

    // Check if branch exists (if provided)
    if (branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId }
      });

      if (!branch) {
        throw new AppError('Branch not found', 404, 'BRANCH_NOT_FOUND');
      }
    }

    // Create user role assignment
    const createData: any = {
      userId,
      roleId,
      isActive: true
    };

    if (branchId) {
      createData.branchId = branchId;
    }

    const userRole = await prisma.userRole.upsert({
      where: {
        userId_roleId_branchId: {
          userId,
          roleId,
          branchId: (branchId || null) as string
        }
      },
      update: {
        isActive: true
      },
      create: createData
    });

    logger.info('Role assigned to user', {
      userId,
      roleId,
      branchId,
      userRoleId: userRole.id
    });

    return userRole;
  }

  /**
   * Remove role from user
   */
  static async removeRoleFromUser(userId: string, roleId: string, branchId?: string) {
    const whereClause: any = {
      userId,
      roleId
    };

    if (branchId !== undefined) {
      whereClause.branchId = branchId;
    }

    await prisma.userRole.updateMany({
      where: whereClause,
      data: {
        isActive: false
      }
    });

    logger.info('Role removed from user', { userId, roleId, branchId });
  }

  /**
   * Check if user has permission
   */
  static async hasPermission(context: PermissionContext): Promise<boolean> {
    const { userId, module, action, resource, branchId } = context;

    // Get user roles with permissions
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        ...(branchId ? { branchId } : {})
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    // Check permissions
    for (const userRole of userRoles) {
      const permissions = userRole.role.permissions;

      for (const rolePermission of permissions) {
        const permission = rolePermission.permission;

        // Check for wildcard permissions
        if (permission.module === '*' && permission.action === '*') {
          return true; // Super admin access
        }

        // Check module-level permissions
        if (permission.module === module || permission.module === '*') {
          // Check action-level permissions
          if (permission.action === action || permission.action === '*') {
            // Check resource-level permissions
            if (!permission.resource || permission.resource === '*' || permission.resource === resource) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Get user permissions
   */
  static async getUserPermissions(userId: string, branchId?: string) {
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        ...(branchId ? { branchId } : {})
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        branch: true
      }
    });

    const permissions = new Set<string>();
    const roles = [];

    for (const userRole of userRoles) {
      roles.push({
        id: userRole.role.id,
        name: userRole.role.name,
        description: userRole.role.description,
        branch: userRole.branch ? {
          id: userRole.branch.id,
          name: userRole.branch.name,
          code: userRole.branch.code
        } : null
      });

      for (const rolePermission of userRole.role.permissions) {
        const permission = rolePermission.permission;
        const permissionString = `${permission.module}:${permission.action}:${permission.resource || '*'}`;
        permissions.add(permissionString);
      }
    }

    return {
      roles,
      permissions: Array.from(permissions)
    };
  }

  /**
   * Get accessible branches for user
   */
  static async getUserAccessibleBranches(userId: string): Promise<string[]> {
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        role: true,
        branch: true
      }
    });

    // Super admin has access to all branches
    const hasSuperAdminRole = userRoles.some(ur => ur.role.name === 'SUPER_ADMIN');
    if (hasSuperAdminRole) {
      const allBranches = await prisma.branch.findMany({
        where: { isActive: true },
        select: { id: true }
      });
      return allBranches.map(b => b.id);
    }

    // Return specific branches user has roles in
    const branchIds = userRoles
      .filter(ur => ur.branchId)
      .map(ur => ur.branchId!);

    return [...new Set(branchIds)];
  }

  /**
   * Get all roles
   */
  static async getAllRoles() {
    return await prisma.role.findMany({
      where: { isActive: true },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  /**
   * Get all permissions
   */
  static async getAllPermissions() {
    return await prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [
        { module: 'asc' },
        { action: 'asc' },
        { resource: 'asc' }
      ]
    });
  }

  /**
   * Get users with roles
   */
  static async getUsersWithRoles(branchId?: string) {
    return await prisma.user.findMany({
      where: {
        isActive: true,
        ...(branchId ? {
          roles: {
            some: {
              branchId,
              isActive: true
            }
          }
        } : {})
      },
      include: {
        roles: {
          where: {
            isActive: true,
            ...(branchId ? { branchId } : {})
          },
          include: {
            role: true,
            branch: true
          }
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: true
          }
        }
      }
    });
  }

  /**
   * Create data isolation filter for branch-specific data
   */
  static async createBranchFilter(userId: string, tableName: string) {
    const accessibleBranches = await this.getUserAccessibleBranches(userId);
    
    // If user has super admin access, return no filter (access all data)
    const userRoles = await prisma.userRole.findMany({
      where: { userId, isActive: true },
      include: { role: true }
    });

    const hasSuperAdminRole = userRoles.some(ur => ur.role.name === 'SUPER_ADMIN');
    if (hasSuperAdminRole) {
      return {};
    }

    // Return branch filter for tables that have branchId
    const branchTables = [
      'branches', 'warehouses', 'employees', 'customers', 'suppliers',
      'sales_orders', 'production_orders', 'user_roles'
    ];

    if (branchTables.includes(tableName)) {
      return {
        branchId: {
          in: accessibleBranches
        }
      };
    }

    return {};
  }
}
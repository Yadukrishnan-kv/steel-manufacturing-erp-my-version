import { Request } from 'express';
import { RBACService } from '../services/rbac.service';
import { AppError } from '../middleware/error';

/**
 * RBAC utility functions for controllers
 */

/**
 * Check if current user has permission
 */
export async function checkPermission(
  req: Request,
  module: string,
  action: string,
  resource?: string,
  branchId?: string
): Promise<boolean> {
  if (!req.user) {
    return false;
  }

  const permissionContext: any = {
    userId: req.user.id,
    module,
    action
  };
  
  if (resource) {
    permissionContext.resource = resource;
  }
  
  if (branchId) {
    permissionContext.branchId = branchId;
  }
  
  return await RBACService.hasPermission(permissionContext);
}

/**
 * Require permission or throw error
 */
export async function requirePermission(
  req: Request,
  module: string,
  action: string,
  resource?: string,
  branchId?: string
): Promise<void> {
  const hasPermission = await checkPermission(req, module, action, resource, branchId);
  
  if (!hasPermission) {
    throw new AppError(
      `Insufficient permissions for ${module}:${action}${resource ? `:${resource}` : ''}`,
      403,
      'INSUFFICIENT_PERMISSIONS'
    );
  }
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(req: Request, roles: string[]): boolean {
  if (!req.user) {
    return false;
  }

  return roles.some(role => req.user!.roles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(req: Request, roles: string[]): boolean {
  if (!req.user) {
    return false;
  }

  return roles.every(role => req.user!.roles.includes(role));
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(req: Request): boolean {
  return hasAnyRole(req, ['SUPER_ADMIN']);
}

/**
 * Check if user is manager (any type)
 */
export function isManager(req: Request): boolean {
  const managerRoles = [
    'SUPER_ADMIN',
    'BRANCH_MANAGER',
    'PRODUCTION_MANAGER',
    'SALES_MANAGER',
    'INVENTORY_MANAGER',
    'PROCUREMENT_MANAGER',
    'QC_MANAGER',
    'SERVICE_MANAGER',
    'FINANCE_MANAGER',
    'HR_MANAGER'
  ];
  
  return hasAnyRole(req, managerRoles);
}

/**
 * Get data filter for branch isolation
 */
export async function getBranchFilter(req: Request, tableName: string): Promise<Record<string, any>> {
  if (!req.user) {
    return {};
  }

  return await RBACService.createBranchFilter(req.user.id, tableName);
}

/**
 * Apply data isolation to query
 */
export async function applyDataIsolation<T extends Record<string, any>>(
  req: Request,
  tableName: string,
  baseQuery: T
): Promise<T> {
  const branchFilter = await getBranchFilter(req, tableName);
  
  return {
    ...baseQuery,
    where: {
      ...baseQuery.where,
      ...branchFilter
    }
  };
}

/**
 * Check branch access for specific branch ID
 */
export async function checkBranchAccess(req: Request, branchId: string): Promise<boolean> {
  if (!req.user) {
    return false;
  }

  if (isSuperAdmin(req)) {
    return true;
  }

  const accessibleBranches = await RBACService.getUserAccessibleBranches(req.user.id);
  return accessibleBranches.includes(branchId);
}

/**
 * Require branch access or throw error
 */
export async function requireBranchAccess(req: Request, branchId: string): Promise<void> {
  const hasAccess = await checkBranchAccess(req, branchId);
  
  if (!hasAccess) {
    throw new AppError(
      'Access denied to this branch',
      403,
      'BRANCH_ACCESS_DENIED'
    );
  }
}

/**
 * Get user's accessible branch IDs
 */
export async function getAccessibleBranches(req: Request): Promise<string[]> {
  if (!req.user) {
    return [];
  }

  return await RBACService.getUserAccessibleBranches(req.user.id);
}

/**
 * Create permission string
 */
export function createPermission(module: string, action: string, resource?: string): string {
  return `${module}:${action}${resource ? `:${resource}` : ''}`;
}

/**
 * Parse permission string
 */
export function parsePermission(permission: string): { module: string; action: string; resource?: string } {
  const parts = permission.split(':');
  if (!parts[0] || !parts[1]) {
    throw new Error(`Invalid permission format: ${permission}`);
  }
  
  const result: { module: string; action: string; resource?: string } = {
    module: parts[0],
    action: parts[1]
  };
  
  if (parts[2]) {
    result.resource = parts[2];
  }
  
  return result;
}

/**
 * Check if permission matches pattern (supports wildcards)
 */
export function matchesPermission(userPermission: string, requiredPermission: string): boolean {
  const userParts = userPermission.split(':');
  const requiredParts = requiredPermission.split(':');

  // Check module
  if (userParts[0] !== '*' && userParts[0] !== requiredParts[0]) {
    return false;
  }

  // Check action
  if (userParts[1] !== '*' && userParts[1] !== requiredParts[1]) {
    return false;
  }

  // Check resource
  if (requiredParts[2] && userParts[2] !== '*' && userParts[2] !== requiredParts[2]) {
    return false;
  }

  return true;
}

/**
 * Filter array based on user permissions
 */
export async function filterByPermission<T extends { id: string }>(
  req: Request,
  items: T[],
  module: string,
  action: string,
  getResourceId?: (item: T) => string
): Promise<T[]> {
  if (!req.user) {
    return [];
  }

  if (isSuperAdmin(req)) {
    return items;
  }

  const filteredItems: T[] = [];

  for (const item of items) {
    const resourceId = getResourceId ? getResourceId(item) : item.id;
    const hasPermission = await checkPermission(req, module, action, resourceId);
    
    if (hasPermission) {
      filteredItems.push(item);
    }
  }

  return filteredItems;
}
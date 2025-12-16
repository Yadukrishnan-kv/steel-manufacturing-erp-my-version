import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default permissions
  const permissions = [
    // Manufacturing permissions
    { module: 'MANUFACTURING', action: 'CREATE', resource: 'PRODUCTION_ORDER', description: 'Create production orders' },
    { module: 'MANUFACTURING', action: 'READ', resource: 'PRODUCTION_ORDER', description: 'View production orders' },
    { module: 'MANUFACTURING', action: 'UPDATE', resource: 'PRODUCTION_ORDER', description: 'Update production orders' },
    { module: 'MANUFACTURING', action: 'DELETE', resource: 'PRODUCTION_ORDER', description: 'Delete production orders' },
    { module: 'MANUFACTURING', action: 'APPROVE', resource: 'BOM', description: 'Approve BOM changes' },
    
    // Sales permissions
    { module: 'SALES', action: 'CREATE', resource: 'LEAD', description: 'Create leads' },
    { module: 'SALES', action: 'READ', resource: 'LEAD', description: 'View leads' },
    { module: 'SALES', action: 'UPDATE', resource: 'LEAD', description: 'Update leads' },
    { module: 'SALES', action: 'CREATE', resource: 'SALES_ORDER', description: 'Create sales orders' },
    { module: 'SALES', action: 'APPROVE', resource: 'DISCOUNT', description: 'Approve discounts' },
    
    // Inventory permissions
    { module: 'INVENTORY', action: 'CREATE', resource: 'STOCK_TRANSACTION', description: 'Create stock transactions' },
    { module: 'INVENTORY', action: 'READ', resource: 'STOCK_TRANSACTION', description: 'View stock transactions' },
    { module: 'INVENTORY', action: 'UPDATE', resource: 'STOCK_TRANSACTION', description: 'Update stock transactions' },
    { module: 'INVENTORY', action: 'APPROVE', resource: 'STOCK_ADJUSTMENT', description: 'Approve stock adjustments' },
    
    // Procurement permissions
    { module: 'PROCUREMENT', action: 'CREATE', resource: 'PURCHASE_ORDER', description: 'Create purchase orders' },
    { module: 'PROCUREMENT', action: 'APPROVE', resource: 'PURCHASE_ORDER', description: 'Approve purchase orders' },
    { module: 'PROCUREMENT', action: 'CREATE', resource: 'GRN', description: 'Create goods receipt notes' },
    
    // QC permissions
    { module: 'QC', action: 'CREATE', resource: 'INSPECTION', description: 'Create QC inspections' },
    { module: 'QC', action: 'APPROVE', resource: 'INSPECTION', description: 'Approve QC inspections' },
    
    // Service permissions
    { module: 'SERVICE', action: 'CREATE', resource: 'SERVICE_REQUEST', description: 'Create service requests' },
    { module: 'SERVICE', action: 'ASSIGN', resource: 'TECHNICIAN', description: 'Assign technicians' },
    
    // Finance permissions
    { module: 'FINANCE', action: 'READ', resource: 'REPORTS', description: 'View financial reports' },
    { module: 'FINANCE', action: 'CREATE', resource: 'INVOICE', description: 'Create invoices' },
    
    // HR permissions
    { module: 'HR', action: 'READ', resource: 'EMPLOYEE', description: 'View employee data' },
    { module: 'HR', action: 'UPDATE', resource: 'PAYROLL', description: 'Update payroll' },
    
    // Admin permissions
    { module: 'ADMIN', action: 'CREATE', resource: 'USER', description: 'Create users' },
    { module: 'ADMIN', action: 'UPDATE', resource: 'ROLE', description: 'Update roles' },
    { module: 'ADMIN', action: 'READ', resource: 'AUDIT_LOG', description: 'View audit logs' },
  ];

  console.log('Creating permissions...');
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        module_action_resource: {
          module: permission.module,
          action: permission.action,
          resource: permission.resource || '',
        },
      },
      update: {},
      create: permission,
    });
  }

  // Create default roles
  const roles = [
    {
      name: 'SUPER_ADMIN',
      description: 'Super Administrator with full system access',
      permissions: permissions.map(p => ({ module: p.module, action: p.action, resource: p.resource })),
    },
    {
      name: 'BRANCH_MANAGER',
      description: 'Branch Manager with branch-level access',
      permissions: permissions.filter(p => 
        !['ADMIN'].includes(p.module) || p.action === 'READ'
      ).map(p => ({ module: p.module, action: p.action, resource: p.resource })),
    },
    {
      name: 'PRODUCTION_MANAGER',
      description: 'Production Manager with manufacturing access',
      permissions: permissions.filter(p => 
        ['MANUFACTURING', 'INVENTORY', 'QC'].includes(p.module)
      ).map(p => ({ module: p.module, action: p.action, resource: p.resource })),
    },
    {
      name: 'SALES_EXECUTIVE',
      description: 'Sales Executive with sales and customer access',
      permissions: permissions.filter(p => 
        ['SALES', 'SERVICE'].includes(p.module) && p.action !== 'APPROVE'
      ).map(p => ({ module: p.module, action: p.action, resource: p.resource })),
    },
    {
      name: 'STORE_KEEPER',
      description: 'Store Keeper with inventory access',
      permissions: permissions.filter(p => 
        p.module === 'INVENTORY' && !['APPROVE'].includes(p.action)
      ).map(p => ({ module: p.module, action: p.action, resource: p.resource })),
    },
    {
      name: 'QC_INSPECTOR',
      description: 'Quality Control Inspector',
      permissions: permissions.filter(p => 
        p.module === 'QC'
      ).map(p => ({ module: p.module, action: p.action, resource: p.resource })),
    },
  ];

  console.log('Creating roles...');
  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: {
        name: roleData.name,
        description: roleData.description,
      },
    });

    // Assign permissions to role
    for (const permData of roleData.permissions) {
      const permission = await prisma.permission.findFirst({
        where: {
          module: permData.module,
          action: permData.action,
          resource: permData.resource || '',
        },
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }
  }

  // Create default branches
  const branches = [
    {
      code: 'KL001',
      name: 'Kochi Branch',
      address: 'Industrial Area, Kochi',
      city: 'Kochi',
      state: 'Kerala',
      pincode: '682001',
      phone: '+91-484-1234567',
      email: 'kochi@steel-erp.com',
      gstNumber: '32ABCDE1234F1Z5',
    },
    {
      code: 'TN001',
      name: 'Chennai Branch',
      address: 'Industrial Estate, Chennai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      phone: '+91-44-1234567',
      email: 'chennai@steel-erp.com',
      gstNumber: '33ABCDE1234F1Z5',
    },
  ];

  console.log('Creating branches...');
  const createdBranches = [];
  for (const branchData of branches) {
    const branch = await prisma.branch.upsert({
      where: { code: branchData.code },
      update: branchData,
      create: branchData,
    });
    createdBranches.push(branch);
  }

  // Create warehouses for each branch
  console.log('Creating warehouses...');
  for (const branch of createdBranches) {
    const warehouses = [
      {
        code: `${branch.code}-RAW`,
        name: 'Raw Materials Warehouse',
        branchId: branch.id,
        address: `${branch.address} - Raw Materials Section`,
        type: 'RAW_MATERIAL',
      },
      {
        code: `${branch.code}-FG`,
        name: 'Finished Goods Warehouse',
        branchId: branch.id,
        address: `${branch.address} - Finished Goods Section`,
        type: 'FINISHED_GOODS',
      },
    ];

    for (const warehouseData of warehouses) {
      const warehouse = await prisma.warehouse.upsert({
        where: { code: warehouseData.code },
        update: warehouseData,
        create: warehouseData,
      });

      // Create racks for each warehouse
      for (let i = 1; i <= 5; i++) {
        const rack = await prisma.rack.upsert({
          where: {
            code_warehouseId: {
              code: `R${i.toString().padStart(2, '0')}`,
              warehouseId: warehouse.id,
            },
          },
          update: {},
          create: {
            code: `R${i.toString().padStart(2, '0')}`,
            warehouseId: warehouse.id,
            description: `Rack ${i}`,
          },
        });

        // Create bins for each rack
        for (let j = 1; j <= 10; j++) {
          await prisma.bin.upsert({
            where: {
              code_rackId: {
                code: `B${j.toString().padStart(2, '0')}`,
                rackId: rack.id,
              },
            },
            update: {},
            create: {
              code: `B${j.toString().padStart(2, '0')}`,
              rackId: rack.id,
              capacity: 1000, // 1000 units capacity
            },
          });
        }
      }
    }
  }

  // Create default admin user
  console.log('Creating default admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@steel-erp.com' },
    update: {},
    create: {
      email: 'admin@steel-erp.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '9999999999',
    },
  });

  // Assign Super Admin role to admin user
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });

  if (superAdminRole) {
    // Check if user role already exists
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
        branchId: null,
      },
    });

    if (!existingUserRole) {
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
          branchId: null,
        },
      });
    }
  }

  // Create sample products
  console.log('Creating sample products...');
  const products = [
    {
      code: 'DOOR-001',
      name: 'Standard Steel Door',
      description: 'Standard steel door with frame',
      category: 'DOOR',
      type: 'STANDARD',
    },
    {
      code: 'WINDOW-001',
      name: 'Standard Steel Window',
      description: 'Standard steel window with frame',
      category: 'WINDOW',
      type: 'STANDARD',
    },
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: { code: productData.code },
      update: productData,
      create: productData,
    });
  }

  // Create work centers
  console.log('Creating work centers...');
  const workCenters = [
    { code: 'CUT001', name: 'Cutting Station 1', type: 'CUTTING', capacity: 10 },
    { code: 'CNC001', name: 'CNC Machine 1', type: 'CNC', capacity: 5 },
    { code: 'BEND001', name: 'Bending Station 1', type: 'BENDING', capacity: 8 },
    { code: 'WELD001', name: 'Welding Station 1', type: 'WELDING', capacity: 6 },
    { code: 'COAT001', name: 'Coating Station 1', type: 'COATING', capacity: 12 },
    { code: 'ASM001', name: 'Assembly Station 1', type: 'ASSEMBLY', capacity: 4 },
  ];

  for (const wcData of workCenters) {
    await prisma.workCenter.upsert({
      where: { code: wcData.code },
      update: wcData,
      create: wcData,
    });
  }

  // Create operations
  console.log('Creating operations...');
  const operations = [
    { code: 'OP001', name: 'Material Cutting', workCenterCode: 'CUT001', setupTime: 30, runTime: 5, sequence: 1 },
    { code: 'OP002', name: 'CNC Machining', workCenterCode: 'CNC001', setupTime: 60, runTime: 15, sequence: 2 },
    { code: 'OP003', name: 'Bending', workCenterCode: 'BEND001', setupTime: 20, runTime: 8, sequence: 3 },
    { code: 'OP004', name: 'Welding', workCenterCode: 'WELD001', setupTime: 15, runTime: 12, sequence: 4 },
    { code: 'OP005', name: 'Coating', workCenterCode: 'COAT001', setupTime: 45, runTime: 3, sequence: 5 },
    { code: 'OP006', name: 'Final Assembly', workCenterCode: 'ASM001', setupTime: 10, runTime: 20, sequence: 6 },
  ];

  for (const opData of operations) {
    const workCenter = await prisma.workCenter.findUnique({
      where: { code: opData.workCenterCode },
    });

    if (workCenter) {
      await prisma.operation.upsert({
        where: { code: opData.code },
        update: {
          name: opData.name,
          setupTime: opData.setupTime,
          runTime: opData.runTime,
          sequence: opData.sequence,
        },
        create: {
          code: opData.code,
          name: opData.name,
          workCenterId: workCenter.id,
          setupTime: opData.setupTime,
          runTime: opData.runTime,
          sequence: opData.sequence,
        },
      });
    }
  }

  // Create SLA configurations
  console.log('Creating SLA configurations...');
  const slaConfigs = [
    {
      module: 'SALES',
      process: 'LEAD_FOLLOWUP',
      slaHours: 24,
      escalationLevels: JSON.stringify(['SALES_EXECUTIVE', 'SALES_MANAGER', 'BRANCH_MANAGER']),
    },
    {
      module: 'PRODUCTION',
      process: 'ORDER_DELIVERY',
      slaHours: 168, // 7 days
      escalationLevels: JSON.stringify(['PRODUCTION_SUPERVISOR', 'PRODUCTION_MANAGER', 'BRANCH_MANAGER']),
    },
    {
      module: 'QC',
      process: 'QC_INSPECTION',
      slaHours: 4,
      escalationLevels: JSON.stringify(['QC_INSPECTOR', 'QC_SUPERVISOR', 'PRODUCTION_MANAGER']),
    },
    {
      module: 'SERVICE',
      process: 'SERVICE_REQUEST',
      slaHours: 48,
      escalationLevels: JSON.stringify(['TECHNICIAN', 'SERVICE_SUPERVISOR', 'SERVICE_MANAGER']),
    },
  ];

  for (const slaData of slaConfigs) {
    await prisma.sLAConfiguration.upsert({
      where: {
        module_process: {
          module: slaData.module,
          process: slaData.process,
        },
      },
      update: slaData,
      create: slaData,
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log('📊 Created:');
  console.log(`   - ${permissions.length} permissions`);
  console.log(`   - ${roles.length} roles`);
  console.log(`   - ${branches.length} branches`);
  console.log(`   - ${branches.length * 2} warehouses`);
  console.log(`   - ${branches.length * 2 * 5} racks`);
  console.log(`   - ${branches.length * 2 * 5 * 10} bins`);
  console.log(`   - 1 admin user (admin@steel-erp.com / admin123)`);
  console.log(`   - ${products.length} sample products`);
  console.log(`   - ${workCenters.length} work centers`);
  console.log(`   - ${operations.length} operations`);
  console.log(`   - ${slaConfigs.length} SLA configurations`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
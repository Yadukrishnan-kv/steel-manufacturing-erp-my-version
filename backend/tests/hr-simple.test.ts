// Simple HR Service Test
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('HR Service Basic Tests', () => {
  beforeAll(async () => {
    // Ensure database connection
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to database', async () => {
    const branches = await prisma.branch.findMany({ take: 1 });
    expect(Array.isArray(branches)).toBe(true);
  });

  it('should have employee table structure', async () => {
    const employees = await prisma.employee.findMany({ take: 1 });
    expect(Array.isArray(employees)).toBe(true);
  });

  it('should have attendance table structure', async () => {
    const attendance = await prisma.attendance.findMany({ take: 1 });
    expect(Array.isArray(attendance)).toBe(true);
  });

  it('should have payroll table structure', async () => {
    const payroll = await prisma.payrollRecord.findMany({ take: 1 });
    expect(Array.isArray(payroll)).toBe(true);
  });

  it('should have KPI metrics table structure', async () => {
    const kpi = await prisma.kPIMetric.findMany({ take: 1 });
    expect(Array.isArray(kpi)).toBe(true);
  });

  it('should have leave request table structure', async () => {
    const leaves = await prisma.leaveRequest.findMany({ take: 1 });
    expect(Array.isArray(leaves)).toBe(true);
  });
});
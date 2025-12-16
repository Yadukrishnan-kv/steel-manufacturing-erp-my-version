// Work Center and Operation Management Service
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface CreateWorkCenterRequest {
  code: string;
  name: string;
  type: 'CUTTING' | 'CNC' | 'BENDING' | 'WELDING' | 'COATING' | 'ASSEMBLY';
  capacity: number; // Units per hour
}

export interface CreateOperationRequest {
  code: string;
  name: string;
  workCenterId: string;
  setupTime: number; // Minutes
  runTime: number; // Minutes per unit
  sequence: number;
}

export interface WorkCenterWithOperations {
  id: string;
  code: string;
  name: string;
  type: string;
  capacity: number;
  isActive: boolean;
  operations: OperationDetails[];
  schedules: CapacityScheduleDetails[];
}

export interface OperationDetails {
  id: string;
  code: string;
  name: string;
  setupTime: number;
  runTime: number;
  sequence: number;
  isActive: boolean;
}

export interface CapacityScheduleDetails {
  id: string;
  date: Date;
  shift: string;
  availableHours: number;
  bookedHours: number;
  efficiency: number;
  utilization: number;
}

export interface ScheduleCapacityRequest {
  workCenterId: string;
  date: Date;
  shift: 'MORNING' | 'EVENING' | 'NIGHT';
  availableHours: number;
  efficiency?: number;
}

export interface MachineSchedule {
  workCenterCode: string;
  workCenterName: string;
  date: Date;
  shift: string;
  totalCapacity: number;
  bookedCapacity: number;
  availableCapacity: number;
  utilization: number;
  scheduledOperations: ScheduledOperation[];
}

export interface ScheduledOperation {
  productionOrderNumber: string;
  operationCode: string;
  operationName: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  requiredHours: number;
  assignedOperator?: string | null;
  status: string;
}

export class WorkCenterService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create new work center
   * Validates: Requirements 1.3 - Work center management
   */
  async createWorkCenter(request: CreateWorkCenterRequest): Promise<WorkCenterWithOperations> {
    try {
      // Check if work center code already exists
      const existingWorkCenter = await this.prisma.workCenter.findUnique({
        where: { code: request.code },
      });

      if (existingWorkCenter) {
        throw new Error(`Work center with code ${request.code} already exists`);
      }

      const workCenter = await this.prisma.workCenter.create({
        data: {
          code: request.code,
          name: request.name,
          type: request.type,
          capacity: request.capacity,
        },
      });

      logger.info(`Work center created successfully`, {
        workCenterId: workCenter.id,
        code: request.code,
        type: request.type,
      });

      return this.getWorkCenterWithOperations(workCenter.id);
    } catch (error) {
      logger.error('Error creating work center:', error);
      throw error;
    }
  }

  /**
   * Create new operation for work center
   * Validates: Requirements 1.3 - Operation management
   */
  async createOperation(request: CreateOperationRequest): Promise<OperationDetails> {
    try {
      // Validate work center exists
      const workCenter = await this.prisma.workCenter.findUnique({
        where: { id: request.workCenterId },
      });

      if (!workCenter) {
        throw new Error('Work center not found');
      }

      // Check if operation code already exists
      const existingOperation = await this.prisma.operation.findUnique({
        where: { code: request.code },
      });

      if (existingOperation) {
        throw new Error(`Operation with code ${request.code} already exists`);
      }

      const operation = await this.prisma.operation.create({
        data: {
          code: request.code,
          name: request.name,
          workCenterId: request.workCenterId,
          setupTime: request.setupTime,
          runTime: request.runTime,
          sequence: request.sequence,
        },
      });

      logger.info(`Operation created successfully`, {
        operationId: operation.id,
        code: request.code,
        workCenterId: request.workCenterId,
      });

      return operation as OperationDetails;
    } catch (error) {
      logger.error('Error creating operation:', error);
      throw error;
    }
  }

  /**
   * Schedule capacity for work center
   * Validates: Requirements 1.3 - Machine and operator scheduling
   */
  async scheduleCapacity(request: ScheduleCapacityRequest): Promise<CapacityScheduleDetails> {
    try {
      // Check if schedule already exists for this date and shift
      const existingSchedule = await this.prisma.capacitySchedule.findUnique({
        where: {
          workCenterId_date_shift: {
            workCenterId: request.workCenterId,
            date: request.date,
            shift: request.shift,
          },
        },
      });

      if (existingSchedule) {
        // Update existing schedule
        const updatedSchedule = await this.prisma.capacitySchedule.update({
          where: { id: existingSchedule.id },
          data: {
            availableHours: request.availableHours,
            efficiency: request.efficiency || 100,
          },
        });

        return this.mapToCapacityScheduleDetails(updatedSchedule);
      } else {
        // Create new schedule
        const schedule = await this.prisma.capacitySchedule.create({
          data: {
            workCenterId: request.workCenterId,
            date: request.date,
            shift: request.shift,
            availableHours: request.availableHours,
            efficiency: request.efficiency || 100,
          },
        });

        return this.mapToCapacityScheduleDetails(schedule);
      }
    } catch (error) {
      logger.error('Error scheduling capacity:', error);
      throw error;
    }
  }

  /**
   * Get work center with operations and schedules
   */
  async getWorkCenterWithOperations(workCenterId: string): Promise<WorkCenterWithOperations> {
    const workCenter = await this.prisma.workCenter.findUnique({
      where: { id: workCenterId },
      include: {
        operations: {
          orderBy: { sequence: 'asc' },
        },
        schedules: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          orderBy: { date: 'asc' },
          take: 30, // Next 30 days
        },
      },
    });

    if (!workCenter) {
      throw new Error('Work center not found');
    }

    return {
      ...workCenter,
      operations: workCenter.operations as OperationDetails[],
      schedules: workCenter.schedules.map(schedule => this.mapToCapacityScheduleDetails(schedule)),
    };
  }

  /**
   * Get all work centers with current utilization
   */
  async getAllWorkCenters(): Promise<WorkCenterWithOperations[]> {
    const workCenters = await this.prisma.workCenter.findMany({
      where: { isActive: true },
      include: {
        operations: {
          where: { isActive: true },
          orderBy: { sequence: 'asc' },
        },
        schedules: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          orderBy: { date: 'asc' },
          take: 7, // Next 7 days for overview
        },
      },
      orderBy: { code: 'asc' },
    });

    return workCenters.map(workCenter => ({
      ...workCenter,
      operations: workCenter.operations as OperationDetails[],
      schedules: workCenter.schedules.map(schedule => this.mapToCapacityScheduleDetails(schedule)),
    }));
  }

  /**
   * Get machine schedule for specific date range
   * Validates: Requirements 1.2 - Gantt chart and calendar visualization
   */
  async getMachineSchedule(
    startDate: Date,
    endDate: Date,
    workCenterIds?: string[]
  ): Promise<MachineSchedule[]> {
    try {
      const whereClause: any = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (workCenterIds && workCenterIds.length > 0) {
        whereClause.workCenterId = {
          in: workCenterIds,
        };
      }

      const schedules = await this.prisma.capacitySchedule.findMany({
        where: whereClause,
        include: {
          workCenter: true,
        },
        orderBy: [
          { workCenter: { code: 'asc' } },
          { date: 'asc' },
          { shift: 'asc' },
        ],
      });

      // Get scheduled operations for the date range
      const scheduledOperations = await this.prisma.productionOrderOperation.findMany({
        where: {
          scheduledStart: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          operation: {
            include: {
              workCenter: true,
            },
          },
          productionOrder: {
            select: {
              orderNumber: true,
            },
          },
        },
        orderBy: {
          scheduledStart: 'asc',
        },
      });

      // Group operations by work center and date
      const operationsByWorkCenterDate = new Map<string, ScheduledOperation[]>();
      
      scheduledOperations.forEach(op => {
        const key = `${op.operation.workCenterId}-${op.scheduledStart.toDateString()}`;
        if (!operationsByWorkCenterDate.has(key)) {
          operationsByWorkCenterDate.set(key, []);
        }
        
        const scheduledHours = (op.scheduledEnd.getTime() - op.scheduledStart.getTime()) / (1000 * 60 * 60);
        
        operationsByWorkCenterDate.get(key)!.push({
          productionOrderNumber: op.productionOrder.orderNumber,
          operationCode: op.operation.code,
          operationName: op.operation.name,
          scheduledStart: op.scheduledStart,
          scheduledEnd: op.scheduledEnd,
          requiredHours: scheduledHours,
          assignedOperator: op.assignedOperator,
          status: op.status,
        });
      });

      // Build machine schedule
      const machineSchedules: MachineSchedule[] = schedules.map(schedule => {
        const key = `${schedule.workCenterId}-${schedule.date.toDateString()}`;
        const operations = operationsByWorkCenterDate.get(key) || [];
        
        const utilization = schedule.availableHours > 0 
          ? (schedule.bookedHours / schedule.availableHours) * 100 
          : 0;

        return {
          workCenterCode: schedule.workCenter.code,
          workCenterName: schedule.workCenter.name,
          date: schedule.date,
          shift: schedule.shift,
          totalCapacity: schedule.availableHours,
          bookedCapacity: schedule.bookedHours,
          availableCapacity: schedule.availableHours - schedule.bookedHours,
          utilization,
          scheduledOperations: operations,
        };
      });

      return machineSchedules;
    } catch (error) {
      logger.error('Error getting machine schedule:', error);
      throw error;
    }
  }

  /**
   * Update work center capacity
   */
  async updateWorkCenterCapacity(workCenterId: string, capacity: number): Promise<void> {
    try {
      await this.prisma.workCenter.update({
        where: { id: workCenterId },
        data: { capacity },
      });

      logger.info(`Work center capacity updated`, {
        workCenterId,
        capacity,
      });
    } catch (error) {
      logger.error('Error updating work center capacity:', error);
      throw error;
    }
  }

  /**
   * Get work center utilization report
   */
  async getWorkCenterUtilization(
    startDate: Date,
    endDate: Date,
    workCenterId?: string
  ): Promise<{
    workCenterCode: string;
    workCenterName: string;
    totalAvailableHours: number;
    totalBookedHours: number;
    averageUtilization: number;
    peakUtilization: number;
    dailyUtilization: Array<{
      date: Date;
      availableHours: number;
      bookedHours: number;
      utilization: number;
    }>;
  }[]> {
    try {
      const whereClause: any = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (workCenterId) {
        whereClause.workCenterId = workCenterId;
      }

      const schedules = await this.prisma.capacitySchedule.findMany({
        where: whereClause,
        include: {
          workCenter: {
            select: {
              code: true,
              name: true,
            },
          },
        },
        orderBy: [
          { workCenter: { code: 'asc' } },
          { date: 'asc' },
        ],
      });

      // Group by work center
      const utilizationByWorkCenter = new Map<string, any>();

      schedules.forEach(schedule => {
        const key = schedule.workCenterId;
        
        if (!utilizationByWorkCenter.has(key)) {
          utilizationByWorkCenter.set(key, {
            workCenterCode: schedule.workCenter.code,
            workCenterName: schedule.workCenter.name,
            totalAvailableHours: 0,
            totalBookedHours: 0,
            dailyUtilization: [],
            utilizationValues: [],
          });
        }

        const data = utilizationByWorkCenter.get(key);
        data.totalAvailableHours += schedule.availableHours;
        data.totalBookedHours += schedule.bookedHours;
        
        const dailyUtilization = schedule.availableHours > 0 
          ? (schedule.bookedHours / schedule.availableHours) * 100 
          : 0;
        
        data.dailyUtilization.push({
          date: schedule.date,
          availableHours: schedule.availableHours,
          bookedHours: schedule.bookedHours,
          utilization: dailyUtilization,
        });
        
        data.utilizationValues.push(dailyUtilization);
      });

      // Calculate averages and peaks
      return Array.from(utilizationByWorkCenter.values()).map(data => {
        const averageUtilization = data.totalAvailableHours > 0 
          ? (data.totalBookedHours / data.totalAvailableHours) * 100 
          : 0;
        
        const peakUtilization = data.utilizationValues.length > 0 
          ? Math.max(...data.utilizationValues) 
          : 0;

        return {
          workCenterCode: data.workCenterCode,
          workCenterName: data.workCenterName,
          totalAvailableHours: data.totalAvailableHours,
          totalBookedHours: data.totalBookedHours,
          averageUtilization,
          peakUtilization,
          dailyUtilization: data.dailyUtilization,
        };
      });
    } catch (error) {
      logger.error('Error getting work center utilization:', error);
      throw error;
    }
  }

  /**
   * Map capacity schedule to details object
   */
  private mapToCapacityScheduleDetails(schedule: any): CapacityScheduleDetails {
    const utilization = schedule.availableHours > 0 
      ? (schedule.bookedHours / schedule.availableHours) * 100 
      : 0;

    return {
      id: schedule.id,
      date: schedule.date,
      shift: schedule.shift,
      availableHours: schedule.availableHours,
      bookedHours: schedule.bookedHours,
      efficiency: schedule.efficiency,
      utilization,
    };
  }

  /**
   * Bulk schedule capacity for multiple work centers
   */
  async bulkScheduleCapacity(
    schedules: ScheduleCapacityRequest[]
  ): Promise<CapacityScheduleDetails[]> {
    try {
      const results: CapacityScheduleDetails[] = [];

      for (const schedule of schedules) {
        const result = await this.scheduleCapacity(schedule);
        results.push(result);
      }

      logger.info(`Bulk capacity scheduling completed`, {
        schedulesCreated: results.length,
      });

      return results;
    } catch (error) {
      logger.error('Error in bulk capacity scheduling:', error);
      throw error;
    }
  }

  /**
   * Get available capacity for date range
   */
  async getAvailableCapacity(
    workCenterId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    date: Date;
    shift: string;
    availableHours: number;
    bookedHours: number;
    remainingCapacity: number;
  }[]> {
    const schedules = await this.prisma.capacitySchedule.findMany({
      where: {
        workCenterId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [
        { date: 'asc' },
        { shift: 'asc' },
      ],
    });

    return schedules.map(schedule => ({
      date: schedule.date,
      shift: schedule.shift,
      availableHours: schedule.availableHours,
      bookedHours: schedule.bookedHours,
      remainingCapacity: schedule.availableHours - schedule.bookedHours,
    }));
  }
}
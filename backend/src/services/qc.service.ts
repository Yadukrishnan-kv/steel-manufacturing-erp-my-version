// Quality Control Service - Multi-stage QC management with photo documentation
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface CreateQCInspectionRequest {
  productionOrderId: string;
  stage: QCStage;
  inspectorId?: string;
  customerRequirements?: string[];
  checklistItems: QCChecklistItemRequest[];
}

export interface QCChecklistItemRequest {
  checkpointId: string;
  description: string;
  expectedValue: string;
  actualValue?: string;
  status?: QCItemStatus;
  photos?: string[];
  comments?: string;
}

export interface QCInspectionWithDetails {
  id: string;
  inspectionNumber: string;
  productionOrderId: string;
  stage: string;
  inspectorId: string;
  inspectionDate: Date;
  overallScore: number;
  status: string;
  customerRequirements?: string[];
  photos?: string[];
  remarks: string;
  reworkOrderId: string;
  checklistItems: QCChecklistItemWithDetails[];
  productionOrder: {
    orderNumber: string;
    quantity: number;
    salesOrder?: {
      customer: {
        name: string;
      };
    } | null;
  };
}

export interface QCChecklistItemWithDetails {
  id: string;
  checkpointId: string;
  description: string;
  expectedValue: string;
  actualValue: string;
  status: string;
  photos?: string[];
  comments?: string | null;
}

export interface QCAnalyticsData {
  totalInspections: number;
  passRate: number;
  failRate: number;
  reworkRate: number;
  averageScore: number;
  stageWiseMetrics: QCStageMetrics[];
  inspectorPerformance: QCInspectorMetrics[];
  trendData: QCTrendData[];
}

export interface QCStageMetrics {
  stage: string;
  totalInspections: number;
  passCount: number;
  failCount: number;
  reworkCount: number;
  passRate: number;
  averageScore: number;
}

export interface QCInspectorMetrics {
  inspectorId: string;
  inspectorName?: string;
  totalInspections: number;
  averageScore: number;
  passRate: number;
  efficiency: number; // Inspections per day
}

export interface QCTrendData {
  date: Date;
  totalInspections: number;
  passRate: number;
  averageScore: number;
}

export interface ReworkJobCard {
  id: string;
  reworkNumber: string;
  originalInspectionId: string;
  productionOrderId: string;
  stage: string;
  failureReasons: string[];
  reworkInstructions: string;
  assignedTo?: string;
  estimatedHours: number;
  status: string;
  createdDate: Date;
  completedDate?: Date;
}

export interface QCReportData {
  inspectionId: string;
  productionOrder: {
    orderNumber: string;
    quantity: number;
    customer?: string | null;
  };
  stage: string;
  inspectionDate: Date;
  inspector: string;
  overallScore: number;
  status: string;
  checklistItems: QCChecklistItemWithDetails[];
  photos: string[];
  customerRequirements: string[];
  deliveryDocuments?: string[];
}

export interface QCCertificate {
  id: string;
  certificateNumber: string;
  productionOrderId: string;
  inspectionIds: string[];
  certificateType: 'QUALITY_CERTIFICATE' | 'COMPLIANCE_CERTIFICATE' | 'TEST_CERTIFICATE';
  issuedDate: Date;
  validUntil: Date;
  issuedBy: string;
  approvedBy?: string;
  customerApprovalRequired: boolean;
  customerApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  customerApprovedBy?: string;
  customerApprovedDate?: Date;
  certificateData: QCCertificateData;
  status: 'DRAFT' | 'ISSUED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
}

export interface QCCertificateData {
  productDetails: {
    productCode: string;
    description: string;
    quantity: number;
    specifications: Record<string, string>;
  };
  qualityResults: {
    overallScore: number;
    passedStages: string[];
    failedStages: string[];
    reworkedStages: string[];
  };
  inspectionSummary: {
    totalInspections: number;
    passedInspections: number;
    inspectionDates: Date[];
    inspectors: string[];
  };
  complianceInfo: {
    standards: string[];
    certifications: string[];
    testResults: Record<string, string>;
  };
  customerRequirements: string[];
}

export interface QCDashboardData {
  realTimeMetrics: {
    activeInspections: number;
    pendingInspections: number;
    completedToday: number;
    currentPassRate: number;
    alertCount: number;
  };
  productionIntegration: {
    ordersAwaitingQC: number;
    ordersInQC: number;
    ordersPassedQC: number;
    ordersFailedQC: number;
    averageQCTime: number;
  };
  inspectorStatus: {
    totalInspectors: number;
    activeInspectors: number;
    inspectorWorkload: QCInspectorWorkload[];
  };
  qualityTrends: {
    dailyPassRate: number[];
    weeklyTrends: QCTrendData[];
    stagePerformance: QCStageMetrics[];
  };
  alerts: QCAlert[];
}

export interface QCInspectorWorkload {
  inspectorId: string;
  inspectorName: string;
  pendingCount: number;
  inProgressCount: number;
  completedToday: number;
  efficiency: number;
  currentLocation?: string;
}

export interface QCAlert {
  id: string;
  type: 'SLA_BREACH' | 'QUALITY_ISSUE' | 'INSPECTOR_OVERLOAD' | 'EQUIPMENT_ISSUE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  productionOrderId?: string;
  inspectionId?: string;
  inspectorId?: string;
  createdAt: Date;
  acknowledged: boolean;
}

export type QCStage = 'CUTTING' | 'FABRICATION' | 'COATING' | 'ASSEMBLY' | 'DISPATCH' | 'INSTALLATION';
export type QCItemStatus = 'PENDING' | 'PASS' | 'FAIL' | 'NA';
export type QCInspectionStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'REWORK_REQUIRED';

export class QCService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create QC inspection with stage-specific checklist
   * Validates: Requirements 5.1 - Stage-specific QC checklist presentation
   */
  async createQCInspection(request: CreateQCInspectionRequest): Promise<QCInspectionWithDetails> {
    try {
      // Generate unique inspection number
      const inspectionNumber = await this.generateInspectionNumber();

      // Validate production order exists
      const productionOrder = await this.prisma.productionOrder.findUnique({
        where: { id: request.productionOrderId },
        include: {
          salesOrder: {
            include: {
              customer: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (!productionOrder) {
        throw new Error('Production order not found');
      }

      // Get stage-specific checklist template
      const stageChecklist = await this.getStageSpecificChecklist(request.stage);

      // Merge template with provided checklist items
      const checklistItems = this.mergeChecklistItems(stageChecklist, request.checklistItems);

      // Embed customer-specific requirements if provided
      const customerRequirements = request.customerRequirements || 
        await this.getCustomerSpecificRequirements(productionOrder.salesOrder?.customer?.name);

      // Create QC inspection
      const inspection = await this.prisma.qCInspection.create({
        data: {
          inspectionNumber,
          productionOrderId: request.productionOrderId,
          stage: request.stage,
          inspectorId: request.inspectorId || null,
          customerRequirements: customerRequirements ? JSON.stringify(customerRequirements) : null,
          status: 'PENDING',
        },
      });

      // Create checklist items
      for (const item of checklistItems) {
        await this.prisma.qCChecklistItem.create({
          data: {
            inspectionId: inspection.id,
            checkpointId: item.checkpointId,
            description: item.description,
            expectedValue: item.expectedValue,
            actualValue: item.actualValue || null,
            status: item.status || 'PENDING',
            photos: item.photos ? JSON.stringify(item.photos) : null,
            comments: item.comments || null,
          },
        });
      }

      logger.info(`QC inspection ${inspectionNumber} created for stage ${request.stage}`, {
        inspectionId: inspection.id,
        productionOrderId: request.productionOrderId,
        stage: request.stage,
      });

      return this.getQCInspectionWithDetails(inspection.id);
    } catch (error) {
      logger.error('Error creating QC inspection:', error);
      throw error;
    }
  }

  /**
   * Record QC inspection with photos and scoring
   * Validates: Requirements 5.2 - QC inspection data completeness
   */
  async recordQCInspection(
    inspectionId: string,
    checklistResults: QCChecklistItemRequest[],
    photos: string[],
    remarks?: string
  ): Promise<QCInspectionWithDetails> {
    try {
      // Update checklist items with results
      for (const result of checklistResults) {
        await this.prisma.qCChecklistItem.updateMany({
          where: {
            inspectionId,
            checkpointId: result.checkpointId,
          },
          data: {
            actualValue: result.actualValue || null,
            status: result.status || 'PENDING',
            photos: result.photos ? JSON.stringify(result.photos) : null,
            comments: result.comments || null,
          },
        });
      }

      // Calculate overall score
      const overallScore = await this.calculateOverallScore(inspectionId);
      
      // Determine inspection status based on score and failed items
      const inspectionStatus = await this.determineInspectionStatus(inspectionId, overallScore);

      // Update inspection with results
      const updatedInspection = await this.prisma.qCInspection.update({
        where: { id: inspectionId },
        data: {
          overallScore,
          status: inspectionStatus,
          photos: photos.length > 0 ? JSON.stringify(photos) : null,
          remarks: remarks || null,
          inspectionDate: new Date(),
        },
      });

      // Generate rework job card if inspection failed
      if (inspectionStatus === 'FAILED' || inspectionStatus === 'REWORK_REQUIRED') {
        const reworkJobCard = await this.generateReworkJobCard(inspectionId);
        
        await this.prisma.qCInspection.update({
          where: { id: inspectionId },
          data: {
            reworkOrderId: reworkJobCard.id,
          },
        });
      }

      logger.info(`QC inspection ${updatedInspection.inspectionNumber} recorded`, {
        inspectionId,
        overallScore,
        status: inspectionStatus,
        photosCount: photos.length,
      });

      return this.getQCInspectionWithDetails(inspectionId);
    } catch (error) {
      logger.error('Error recording QC inspection:', error);
      throw error;
    }
  }

  /**
   * Generate rework job card for failed QC inspections
   * Validates: Requirements 5.3 - QC failure rework generation
   */
  async generateReworkJobCard(inspectionId: string): Promise<ReworkJobCard> {
    try {
      const inspection = await this.prisma.qCInspection.findUnique({
        where: { id: inspectionId },
        include: {
          checklistItems: {
            where: {
              status: 'FAIL',
            },
          },
          productionOrder: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
        },
      });

      if (!inspection) {
        throw new Error('QC inspection not found');
      }

      // Generate rework number
      const reworkNumber = await this.generateReworkNumber();

      // Extract failure reasons from failed checklist items
      const failureReasons = inspection.checklistItems.map(item => 
        `${item.description}: Expected ${item.expectedValue}, Got ${item.actualValue || 'N/A'}`
      );

      // Generate rework instructions based on stage and failures
      const reworkInstructions = this.generateReworkInstructions(
        inspection.stage as QCStage,
        failureReasons
      );

      // Estimate rework hours based on stage and number of failures
      const estimatedHours = this.estimateReworkHours(
        inspection.stage as QCStage,
        inspection.checklistItems.length
      );

      // Create rework job card (using a simple string ID for now)
      const reworkJobCard: ReworkJobCard = {
        id: `rework_${Date.now()}`,
        reworkNumber,
        originalInspectionId: inspectionId,
        productionOrderId: inspection.productionOrderId,
        stage: inspection.stage,
        failureReasons,
        reworkInstructions,
        estimatedHours,
        status: 'PENDING',
        createdDate: new Date(),
      };

      // Update production order status to indicate rework required
      await this.prisma.productionOrder.update({
        where: { id: inspection.productionOrderId },
        data: {
          status: 'REWORK_REQUIRED',
        },
      });

      logger.info(`Rework job card ${reworkNumber} generated for inspection ${inspection.inspectionNumber}`, {
        reworkJobCardId: reworkJobCard.id,
        inspectionId,
        failureCount: failureReasons.length,
        estimatedHours,
      });

      return reworkJobCard;
    } catch (error) {
      logger.error('Error generating rework job card:', error);
      throw error;
    }
  }

  /**
   * Get QC inspection with complete details
   */
  async getQCInspectionWithDetails(inspectionId: string): Promise<QCInspectionWithDetails> {
    const inspection = await this.prisma.qCInspection.findUnique({
      where: { id: inspectionId },
      include: {
        checklistItems: true,
        productionOrder: {
          include: {
            salesOrder: {
              include: {
                customer: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!inspection) {
      throw new Error('QC inspection not found');
    }

    return {
      id: inspection.id,
      inspectionNumber: inspection.inspectionNumber,
      productionOrderId: inspection.productionOrderId,
      stage: inspection.stage,
      inspectorId: inspection.inspectorId || '',
      inspectionDate: inspection.inspectionDate,
      overallScore: inspection.overallScore || 0,
      status: inspection.status,
      customerRequirements: inspection.customerRequirements ? 
        JSON.parse(inspection.customerRequirements) : undefined,
      photos: inspection.photos ? JSON.parse(inspection.photos) : undefined,
      remarks: inspection.remarks || '',
      reworkOrderId: inspection.reworkOrderId || '',
      checklistItems: inspection.checklistItems.map(item => ({
        id: item.id,
        checkpointId: item.checkpointId,
        description: item.description,
        expectedValue: item.expectedValue,
        actualValue: item.actualValue || '',
        status: item.status,
        photos: item.photos ? JSON.parse(item.photos) : undefined,
        comments: item.comments || null,
      })),
      productionOrder: {
        orderNumber: inspection.productionOrder.orderNumber,
        quantity: inspection.productionOrder.quantity,
        salesOrder: inspection.productionOrder.salesOrder ? {
          customer: {
            name: inspection.productionOrder.salesOrder.customer.name,
          },
        } : null,
      },
    };
  }

  /**
   * Assign QC inspector to inspection
   * Validates: Requirements 5.1 - QC inspector assignment and scheduling
   */
  async assignQCInspector(inspectionId: string, inspectorId: string): Promise<void> {
    try {
      // Validate inspector exists (assuming we have employee records)
      const inspector = await this.prisma.employee.findUnique({
        where: { id: inspectorId },
      });

      if (!inspector) {
        throw new Error('Inspector not found');
      }

      // Check inspector availability and workload
      const currentWorkload = await this.getInspectorWorkload(inspectorId);
      
      if (currentWorkload > 10) { // Max 10 pending inspections per inspector
        throw new Error('Inspector has too many pending inspections');
      }

      await this.prisma.qCInspection.update({
        where: { id: inspectionId },
        data: {
          inspectorId,
        },
      });

      logger.info(`QC inspector ${inspectorId} assigned to inspection ${inspectionId}`, {
        inspectionId,
        inspectorId,
        currentWorkload,
      });
    } catch (error) {
      logger.error('Error assigning QC inspector:', error);
      throw error;
    }
  }

  /**
   * Get QC analytics and quality trend reporting
   * Validates: Requirements 5.1 - QC analytics and quality trend reporting
   */
  async getQCAnalytics(
    startDate: Date,
    endDate: Date,
    branchId?: string,
    stage?: QCStage
  ): Promise<QCAnalyticsData> {
    try {
      const whereClause: any = {
        inspectionDate: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (branchId) {
        whereClause.productionOrder = {
          branchId,
        };
      }

      if (stage) {
        whereClause.stage = stage;
      }

      // Get all inspections in the date range
      const inspections = await this.prisma.qCInspection.findMany({
        where: whereClause,
        include: {
          productionOrder: {
            select: {
              branchId: true,
            },
          },
        },
      });

      const totalInspections = inspections.length;
      const passedInspections = inspections.filter(i => i.status === 'PASSED').length;
      const failedInspections = inspections.filter(i => i.status === 'FAILED').length;
      const reworkInspections = inspections.filter(i => i.status === 'REWORK_REQUIRED').length;

      const passRate = totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0;
      const failRate = totalInspections > 0 ? (failedInspections / totalInspections) * 100 : 0;
      const reworkRate = totalInspections > 0 ? (reworkInspections / totalInspections) * 100 : 0;

      const averageScore = inspections.reduce((sum, i) => sum + (i.overallScore || 0), 0) / 
        (inspections.filter(i => i.overallScore !== null).length || 1);

      // Calculate stage-wise metrics
      const stageWiseMetrics = await this.calculateStageWiseMetrics(inspections);

      // Calculate inspector performance
      const inspectorPerformance = await this.calculateInspectorPerformance(inspections, startDate, endDate);

      // Calculate trend data
      const trendData = await this.calculateTrendData(inspections, startDate, endDate);

      return {
        totalInspections,
        passRate,
        failRate,
        reworkRate,
        averageScore,
        stageWiseMetrics,
        inspectorPerformance,
        trendData,
      };
    } catch (error) {
      logger.error('Error getting QC analytics:', error);
      throw error;
    }
  }

  /**
   * Generate QC report linked to delivery documentation
   * Validates: Requirements 5.5 - QC report delivery linking
   */
  async generateQCReport(inspectionId: string): Promise<QCReportData> {
    try {
      const inspection = await this.getQCInspectionWithDetails(inspectionId);

      const reportData: QCReportData = {
        inspectionId: inspection.id,
        productionOrder: {
          orderNumber: inspection.productionOrder.orderNumber,
          quantity: inspection.productionOrder.quantity,
          customer: inspection.productionOrder.salesOrder?.customer.name || null,
        },
        stage: inspection.stage,
        inspectionDate: inspection.inspectionDate,
        inspector: inspection.inspectorId || '',
        overallScore: inspection.overallScore || 0,
        status: inspection.status,
        checklistItems: inspection.checklistItems,
        photos: inspection.photos || [],
        customerRequirements: inspection.customerRequirements || [],
        deliveryDocuments: [], // Will be populated when linked to delivery
      };

      logger.info(`QC report generated for inspection ${inspection.inspectionNumber}`, {
        inspectionId,
        stage: inspection.stage,
        overallScore: inspection.overallScore,
      });

      return reportData;
    } catch (error) {
      logger.error('Error generating QC report:', error);
      throw error;
    }
  }

  /**
   * Link QC reports to delivery documentation
   * Validates: Requirements 5.5 - QC report delivery linking
   */
  async linkQCReportToDelivery(
    productionOrderId: string,
    deliveryDocumentIds: string[]
  ): Promise<void> {
    try {
      // Get all QC inspections for the production order
      const inspections = await this.prisma.qCInspection.findMany({
        where: {
          productionOrderId,
          status: 'PASSED',
        },
      });

      if (inspections.length === 0) {
        throw new Error('No passed QC inspections found for production order');
      }

      // Update each inspection with delivery document links
      for (const inspection of inspections) {
        // Store delivery document IDs in remarks or a dedicated field
        const deliveryInfo = {
          deliveryDocuments: deliveryDocumentIds,
          linkedAt: new Date().toISOString(),
        };

        await this.prisma.qCInspection.update({
          where: { id: inspection.id },
          data: {
            remarks: inspection.remarks ? 
              `${inspection.remarks}\nDelivery Documents: ${JSON.stringify(deliveryInfo)}` :
              `Delivery Documents: ${JSON.stringify(deliveryInfo)}`,
          },
        });
      }

      logger.info(`QC reports linked to delivery for production order ${productionOrderId}`, {
        productionOrderId,
        inspectionCount: inspections.length,
        deliveryDocumentCount: deliveryDocumentIds.length,
      });
    } catch (error) {
      logger.error('Error linking QC reports to delivery:', error);
      throw error;
    }
  }

  /**
   * Get stage-specific QC checklist template
   * Validates: Requirements 5.1 - Stage-specific QC checklist presentation
   */
  private async getStageSpecificChecklist(stage: QCStage): Promise<QCChecklistItemRequest[]> {
    const checklists: Record<QCStage, QCChecklistItemRequest[]> = {
      CUTTING: [
        {
          checkpointId: 'CUT_001',
          description: 'Material dimensions accuracy',
          expectedValue: 'Within ±2mm tolerance',
        },
        {
          checkpointId: 'CUT_002',
          description: 'Edge quality and finish',
          expectedValue: 'Smooth edges, no burrs',
        },
        {
          checkpointId: 'CUT_003',
          description: 'Material identification marking',
          expectedValue: 'Clear marking as per drawing',
        },
      ],
      FABRICATION: [
        {
          checkpointId: 'FAB_001',
          description: 'Welding joint quality',
          expectedValue: 'Full penetration, no defects',
        },
        {
          checkpointId: 'FAB_002',
          description: 'Assembly alignment',
          expectedValue: 'Square and true within tolerance',
        },
        {
          checkpointId: 'FAB_003',
          description: 'Hardware fitting',
          expectedValue: 'Proper fit and function',
        },
      ],
      COATING: [
        {
          checkpointId: 'COT_001',
          description: 'Surface preparation',
          expectedValue: 'Clean, dry, and properly prepared',
        },
        {
          checkpointId: 'COT_002',
          description: 'Coating thickness',
          expectedValue: 'As per specification (μm)',
        },
        {
          checkpointId: 'COT_003',
          description: 'Color match and finish',
          expectedValue: 'Matches approved sample',
        },
      ],
      ASSEMBLY: [
        {
          checkpointId: 'ASM_001',
          description: 'Component fit and alignment',
          expectedValue: 'Proper fit, no gaps',
        },
        {
          checkpointId: 'ASM_002',
          description: 'Hardware operation',
          expectedValue: 'Smooth operation, proper function',
        },
        {
          checkpointId: 'ASM_003',
          description: 'Final dimensions',
          expectedValue: 'As per approved drawings',
        },
      ],
      DISPATCH: [
        {
          checkpointId: 'DIS_001',
          description: 'Packaging quality',
          expectedValue: 'Proper protection, labeling',
        },
        {
          checkpointId: 'DIS_002',
          description: 'Documentation completeness',
          expectedValue: 'All required documents included',
        },
        {
          checkpointId: 'DIS_003',
          description: 'Loading and handling',
          expectedValue: 'Proper loading, no damage',
        },
      ],
      INSTALLATION: [
        {
          checkpointId: 'INS_001',
          description: 'Site preparation',
          expectedValue: 'Site ready for installation',
        },
        {
          checkpointId: 'INS_002',
          description: 'Installation alignment',
          expectedValue: 'Level, plumb, and square',
        },
        {
          checkpointId: 'INS_003',
          description: 'Final operation test',
          expectedValue: 'All functions working properly',
        },
      ],
    };

    return checklists[stage] || [];
  }

  /**
   * Merge template checklist with provided items
   */
  private mergeChecklistItems(
    template: QCChecklistItemRequest[],
    provided: QCChecklistItemRequest[]
  ): QCChecklistItemRequest[] {
    const merged = [...template];
    
    // Add any additional items provided
    for (const item of provided) {
      const existingIndex = merged.findIndex(t => t.checkpointId === item.checkpointId);
      if (existingIndex >= 0) {
        // Update existing item
        merged[existingIndex] = { ...merged[existingIndex], ...item };
      } else {
        // Add new item
        merged.push(item);
      }
    }

    return merged;
  }

  /**
   * Get customer-specific requirements
   * Validates: Requirements 5.4 - Customer requirement embedding
   */
  private async getCustomerSpecificRequirements(customerName?: string): Promise<string[] | null> {
    if (!customerName) return null;

    // This would typically come from a customer requirements database
    // For now, return some sample requirements based on customer
    const customerRequirements: Record<string, string[]> = {
      'Premium Customer': [
        'Extra quality checks for visible surfaces',
        'Special packaging requirements',
        'Installation supervision required',
      ],
      'Government Project': [
        'Compliance with government standards',
        'Additional documentation required',
        'Security clearance for installation team',
      ],
    };

    return customerRequirements[customerName] || null;
  }

  /**
   * Calculate overall QC score
   */
  private async calculateOverallScore(inspectionId: string): Promise<number> {
    const checklistItems = await this.prisma.qCChecklistItem.findMany({
      where: { inspectionId },
    });

    if (checklistItems.length === 0) return 0;

    const totalItems = checklistItems.length;
    const passedItems = checklistItems.filter(item => item.status === 'PASS').length;
    const naItems = checklistItems.filter(item => item.status === 'NA').length;

    // Calculate score excluding N/A items
    const applicableItems = totalItems - naItems;
    if (applicableItems === 0) return 100;

    return Math.round((passedItems / applicableItems) * 100);
  }

  /**
   * Determine inspection status based on score and failed items
   */
  private async determineInspectionStatus(inspectionId: string, overallScore: number): Promise<QCInspectionStatus> {
    const failedItems = await this.prisma.qCChecklistItem.findMany({
      where: {
        inspectionId,
        status: 'FAIL',
      },
    });

    if (failedItems.length === 0 && overallScore >= 95) {
      return 'PASSED';
    } else if (overallScore >= 80 && failedItems.length <= 2) {
      return 'REWORK_REQUIRED';
    } else {
      return 'FAILED';
    }
  }

  /**
   * Generate rework instructions based on stage and failures
   */
  private generateReworkInstructions(stage: QCStage, failureReasons: string[]): string {
    const stageInstructions: Record<QCStage, string> = {
      CUTTING: 'Re-cut material to correct dimensions. Verify measurements before cutting.',
      FABRICATION: 'Rework welding joints and assembly. Check alignment and fit.',
      COATING: 'Strip and re-apply coating. Ensure proper surface preparation.',
      ASSEMBLY: 'Disassemble and reassemble with proper alignment. Test all functions.',
      DISPATCH: 'Repackage with proper protection. Update documentation.',
      INSTALLATION: 'Reinstall with proper alignment and testing.',
    };

    const baseInstruction = stageInstructions[stage];
    const specificInstructions = failureReasons.join('; ');

    return `${baseInstruction}\n\nSpecific Issues to Address:\n${specificInstructions}`;
  }

  /**
   * Estimate rework hours based on stage and failure count
   */
  private estimateReworkHours(stage: QCStage, failureCount: number): number {
    const baseHours: Record<QCStage, number> = {
      CUTTING: 2,
      FABRICATION: 4,
      COATING: 6,
      ASSEMBLY: 3,
      DISPATCH: 1,
      INSTALLATION: 4,
    };

    return baseHours[stage] + (failureCount * 0.5);
  }

  /**
   * Get inspector current workload
   */
  private async getInspectorWorkload(inspectorId: string): Promise<number> {
    const pendingInspections = await this.prisma.qCInspection.count({
      where: {
        inspectorId,
        status: 'PENDING',
      },
    });

    return pendingInspections;
  }

  /**
   * Calculate stage-wise metrics
   */
  private async calculateStageWiseMetrics(inspections: any[]): Promise<QCStageMetrics[]> {
    const stageGroups = inspections.reduce((groups, inspection) => {
      const stage = inspection.stage;
      if (!groups[stage]) {
        groups[stage] = [];
      }
      groups[stage].push(inspection);
      return groups;
    }, {} as Record<string, any[]>);

    return Object.entries(stageGroups).map(([stage, stageInspections]) => {
      const inspections = stageInspections as any[];
      const totalInspections = inspections.length;
      const passCount = inspections.filter(i => i.status === 'PASSED').length;
      const failCount = inspections.filter(i => i.status === 'FAILED').length;
      const reworkCount = inspections.filter(i => i.status === 'REWORK_REQUIRED').length;
      const passRate = totalInspections > 0 ? (passCount / totalInspections) * 100 : 0;
      const averageScore = inspections.reduce((sum, i) => sum + (i.overallScore || 0), 0) / 
        (inspections.filter(i => i.overallScore !== null).length || 1);

      return {
        stage,
        totalInspections,
        passCount,
        failCount,
        reworkCount,
        passRate,
        averageScore,
      };
    });
  }

  /**
   * Calculate inspector performance metrics
   */
  private async calculateInspectorPerformance(
    inspections: any[],
    startDate: Date,
    endDate: Date
  ): Promise<QCInspectorMetrics[]> {
    const inspectorGroups = inspections.reduce((groups, inspection) => {
      const inspectorId = inspection.inspectorId;
      if (inspectorId) {
        if (!groups[inspectorId]) {
          groups[inspectorId] = [];
        }
        groups[inspectorId].push(inspection);
      }
      return groups;
    }, {} as Record<string, any[]>);

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return Object.entries(inspectorGroups).map(([inspectorId, inspectorInspections]) => {
      const inspections = inspectorInspections as any[];
      const totalInspections = inspections.length;
      const passCount = inspections.filter(i => i.status === 'PASSED').length;
      const passRate = totalInspections > 0 ? (passCount / totalInspections) * 100 : 0;
      const averageScore = inspections.reduce((sum, i) => sum + (i.overallScore || 0), 0) / 
        (inspections.filter(i => i.overallScore !== null).length || 1);
      const efficiency = daysDiff > 0 ? totalInspections / daysDiff : 0;

      return {
        inspectorId,
        totalInspections,
        averageScore,
        passRate,
        efficiency,
      };
    });
  }

  /**
   * Calculate trend data for analytics
   */
  private async calculateTrendData(
    inspections: any[],
    startDate: Date,
    endDate: Date
  ): Promise<QCTrendData[]> {
    const trendData: QCTrendData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayInspections = inspections.filter(i => 
        i.inspectionDate >= dayStart && i.inspectionDate <= dayEnd
      );

      const totalInspections = dayInspections.length;
      const passCount = dayInspections.filter(i => i.status === 'PASSED').length;
      const passRate = totalInspections > 0 ? (passCount / totalInspections) * 100 : 0;
      const averageScore = dayInspections.reduce((sum, i) => sum + (i.overallScore || 0), 0) / 
        (dayInspections.filter(i => i.overallScore !== null).length || 1);

      trendData.push({
        date: new Date(currentDate),
        totalInspections,
        passRate,
        averageScore: isNaN(averageScore) ? 0 : averageScore,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trendData;
  }

  /**
   * Generate unique inspection number
   */
  private async generateInspectionNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    const prefix = `QC${year}${month}`;
    
    // Get the last inspection number for this month
    const lastInspection = await this.prisma.qCInspection.findFirst({
      where: {
        inspectionNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        inspectionNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastInspection) {
      const lastSequence = parseInt(lastInspection.inspectionNumber.substring(prefix.length));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Generate unique rework number
   */
  private async generateReworkNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    const prefix = `RW${year}${month}`;
    
    // For simplicity, using timestamp-based sequence
    const timestamp = Date.now().toString().slice(-4);
    
    return `${prefix}${timestamp}`;
  }

  /**
   * Generate QC certificate for production order
   * Validates: Requirements 5.5 - QC certificate generation
   */
  async generateQCCertificate(
    productionOrderId: string,
    certificateType: 'QUALITY_CERTIFICATE' | 'COMPLIANCE_CERTIFICATE' | 'TEST_CERTIFICATE',
    issuedBy: string,
    customerApprovalRequired: boolean = false
  ): Promise<QCCertificate> {
    try {
      // Get all passed QC inspections for the production order
      const inspections = await this.prisma.qCInspection.findMany({
        where: {
          productionOrderId,
          status: 'PASSED',
        },
        include: {
          checklistItems: true,
          productionOrder: {
            include: {
              bom: {
                include: {
                  product: true,
                },
              },
              salesOrder: {
                include: {
                  customer: true,
                },
              },
            },
          },
        },
      });

      if (inspections.length === 0) {
        throw new Error('No passed QC inspections found for production order');
      }

      // Generate certificate number
      const certificateNumber = await this.generateCertificateNumber(certificateType);

      // Prepare certificate data
      const productionOrder = inspections[0]?.productionOrder;
      if (!productionOrder) {
        throw new Error('Production order not found in inspection data');
      }
      const product = productionOrder.bom.product;

      const certificateData: QCCertificateData = {
        productDetails: {
          productCode: product.code,
          description: product.name,
          quantity: productionOrder.quantity,
          specifications: {
            category: product.category,
            type: product.type,
            // Add more specifications as needed
          },
        },
        qualityResults: {
          overallScore: inspections.reduce((sum, i) => sum + (i.overallScore || 0), 0) / inspections.length,
          passedStages: Array.from(new Set(inspections.map(i => i.stage))),
          failedStages: [],
          reworkedStages: [],
        },
        inspectionSummary: {
          totalInspections: inspections.length,
          passedInspections: inspections.length,
          inspectionDates: inspections.map(i => i.inspectionDate),
          inspectors: Array.from(new Set(inspections.map(i => i.inspectorId).filter((id): id is string => Boolean(id)))),
        },
        complianceInfo: {
          standards: ['ISO 9001:2015', 'IS 4351', 'BIS Standards'],
          certifications: ['Quality Management System', 'Product Certification'],
          testResults: {
            'Dimensional Accuracy': 'Within Tolerance',
            'Surface Finish': 'As Per Specification',
            'Material Quality': 'Approved Grade',
          },
        },
        customerRequirements: inspections
          .map(i => i.customerRequirements ? JSON.parse(i.customerRequirements) : [])
          .flat()
          .filter((req, index, arr) => arr.indexOf(req) === index), // Remove duplicates
      };

      // Create certificate
      const certificate: QCCertificate = {
        id: `cert_${Date.now()}`,
        certificateNumber,
        productionOrderId,
        inspectionIds: inspections.map(i => i.id),
        certificateType,
        issuedDate: new Date(),
        validUntil: certificateType === 'QUALITY_CERTIFICATE' ? 
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 year validity for quality, 30 days for others
        issuedBy,
        customerApprovalRequired,
        customerApprovalStatus: customerApprovalRequired ? 'PENDING' : 'APPROVED',
        certificateData,
        status: customerApprovalRequired ? 'ISSUED' : 'APPROVED',
      };

      logger.info(`QC certificate ${certificateNumber} generated for production order ${productionOrderId}`, {
        certificateId: certificate.id,
        certificateType,
        inspectionCount: inspections.length,
        customerApprovalRequired,
      });

      return certificate;
    } catch (error) {
      logger.error('Error generating QC certificate:', error);
      throw error;
    }
  }

  /**
   * Submit QC certificate for customer approval
   * Validates: Requirements 5.5 - Customer approval workflows
   */
  async submitCertificateForCustomerApproval(
    certificateId: string,
    submissionNotes?: string
  ): Promise<void> {
    try {
      // In a real implementation, this would update the certificate status
      // and send notification to customer
      
      logger.info(`QC certificate ${certificateId} submitted for customer approval`, {
        certificateId,
        submissionNotes,
        submittedAt: new Date(),
      });

      // Here you would typically:
      // 1. Update certificate status to 'PENDING_CUSTOMER_APPROVAL'
      // 2. Send email/notification to customer
      // 3. Create approval workflow task
      // 4. Set SLA timer for approval response
    } catch (error) {
      logger.error('Error submitting certificate for customer approval:', error);
      throw error;
    }
  }

  /**
   * Process customer approval for QC certificate
   * Validates: Requirements 5.5 - Customer approval workflows
   */
  async processCustomerApproval(
    certificateId: string,
    approved: boolean,
    approvedBy: string,
    comments?: string
  ): Promise<void> {
    try {
      const approvalStatus = approved ? 'APPROVED' : 'REJECTED';
      const certificateStatus = approved ? 'APPROVED' : 'REJECTED';

      // In a real implementation, this would update the certificate
      logger.info(`QC certificate ${certificateId} ${approvalStatus.toLowerCase()} by customer`, {
        certificateId,
        approved,
        approvedBy,
        comments,
        approvedAt: new Date(),
      });

      // If approved, trigger delivery process
      if (approved) {
        await this.triggerDeliveryProcess(certificateId);
      }
    } catch (error) {
      logger.error('Error processing customer approval:', error);
      throw error;
    }
  }

  /**
   * Get QC dashboard data with real-time monitoring
   * Validates: Requirements 5.1 - QC dashboard and real-time monitoring
   */
  async getQCDashboardData(branchId?: string): Promise<QCDashboardData> {
    try {
      const whereClause: any = {};
      if (branchId) {
        whereClause.productionOrder = { branchId };
      }

      // Get real-time metrics
      const [
        activeInspections,
        pendingInspections,
        completedToday,
        ordersAwaitingQC,
        ordersInQC,
        ordersPassedQC,
        ordersFailedQC,
        totalInspectors,
        activeInspectors,
      ] = await Promise.all([
        // Active inspections (in progress)
        this.prisma.qCInspection.count({
          where: {
            ...whereClause,
            status: 'PENDING',
            inspectorId: { not: null },
          },
        }),
        
        // Pending inspections (not assigned)
        this.prisma.qCInspection.count({
          where: {
            ...whereClause,
            status: 'PENDING',
            inspectorId: null,
          },
        }),
        
        // Completed today
        this.prisma.qCInspection.count({
          where: {
            ...whereClause,
            inspectionDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(new Date().setHours(23, 59, 59, 999)),
            },
            status: { in: ['PASSED', 'FAILED', 'REWORK_REQUIRED'] },
          },
        }),
        
        // Orders awaiting QC
        this.prisma.productionOrder.count({
          where: {
            ...(branchId ? { branchId } : {}),
            status: 'COMPLETED',
            qcInspections: { none: {} },
          },
        }),
        
        // Orders in QC
        this.prisma.productionOrder.count({
          where: {
            ...(branchId ? { branchId } : {}),
            qcInspections: {
              some: {
                status: 'PENDING',
              },
            },
          },
        }),
        
        // Orders passed QC
        this.prisma.productionOrder.count({
          where: {
            ...(branchId ? { branchId } : {}),
            qcInspections: {
              every: {
                status: 'PASSED',
              },
            },
          },
        }),
        
        // Orders failed QC
        this.prisma.productionOrder.count({
          where: {
            ...(branchId ? { branchId } : {}),
            qcInspections: {
              some: {
                status: { in: ['FAILED', 'REWORK_REQUIRED'] },
              },
            },
          },
        }),
        
        // Total inspectors
        this.prisma.employee.count({
          where: {
            department: 'Quality Control',
            ...(branchId ? { branchId } : {}),
          },
        }),
        
        // Active inspectors (worked today) - simplified count
        this.prisma.employee.count({
          where: {
            department: 'Quality Control',
            ...(branchId ? { branchId } : {}),
          },
        }),
      ]);

      // Calculate current pass rate
      const todayInspections = await this.prisma.qCInspection.findMany({
        where: {
          ...whereClause,
          inspectionDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: { in: ['PASSED', 'FAILED', 'REWORK_REQUIRED'] },
        },
      });

      const currentPassRate = todayInspections.length > 0 ?
        (todayInspections.filter(i => i.status === 'PASSED').length / todayInspections.length) * 100 : 0;

      // Get inspector workload
      const inspectorWorkload = await this.getInspectorWorkloadData(branchId);

      // Get quality trends
      const weeklyTrends = await this.calculateTrendData(
        todayInspections,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        new Date()
      );

      // Get stage performance
      const stagePerformance = await this.calculateStageWiseMetrics(todayInspections);

      // Generate alerts
      const alerts = await this.generateQCAlerts(branchId);

      // Calculate average QC time
      const avgQCTime = await this.calculateAverageQCTime(branchId);

      return {
        realTimeMetrics: {
          activeInspections,
          pendingInspections,
          completedToday,
          currentPassRate,
          alertCount: alerts.length,
        },
        productionIntegration: {
          ordersAwaitingQC,
          ordersInQC,
          ordersPassedQC,
          ordersFailedQC,
          averageQCTime: avgQCTime,
        },
        inspectorStatus: {
          totalInspectors,
          activeInspectors,
          inspectorWorkload,
        },
        qualityTrends: {
          dailyPassRate: [currentPassRate], // Would be expanded for multiple days
          weeklyTrends,
          stagePerformance,
        },
        alerts,
      };
    } catch (error) {
      logger.error('Error getting QC dashboard data:', error);
      throw error;
    }
  }

  /**
   * Integrate QC with production process
   * Validates: Requirements 5.1, 5.3 - QC integration with production
   */
  async integrateWithProduction(
    productionOrderId: string,
    stage: QCStage,
    triggerType: 'STAGE_COMPLETION' | 'MANUAL_TRIGGER'
  ): Promise<string> {
    try {
      // Check if production order exists and is at the right stage
      const productionOrder = await this.prisma.productionOrder.findUnique({
        where: { id: productionOrderId },
        include: {
          salesOrder: {
            include: {
              customer: true,
            },
          },
        },
      });

      if (!productionOrder) {
        throw new Error('Production order not found');
      }

      // Auto-create QC inspection when production stage completes
      const inspection = await this.createQCInspection({
        productionOrderId,
        stage,
        checklistItems: [], // Will be populated with stage-specific template
      });

      // Update production order status to indicate QC required
      await this.prisma.productionOrder.update({
        where: { id: productionOrderId },
        data: {
          status: 'QC_REQUIRED',
        },
      });

      logger.info(`QC inspection auto-created for production order ${productionOrder.orderNumber}`, {
        inspectionId: inspection.id,
        stage,
        triggerType,
      });

      return inspection.id;
    } catch (error) {
      logger.error('Error integrating QC with production:', error);
      throw error;
    }
  }

  /**
   * Update production order status based on QC results
   * Validates: Requirements 5.3 - QC integration with production
   */
  async updateProductionOrderFromQC(
    inspectionId: string,
    qcStatus: QCInspectionStatus
  ): Promise<void> {
    try {
      const inspection = await this.prisma.qCInspection.findUnique({
        where: { id: inspectionId },
      });

      if (!inspection) {
        throw new Error('QC inspection not found');
      }

      let productionStatus: string;
      
      switch (qcStatus) {
        case 'PASSED':
          // Check if all required QC stages are complete
          const allInspections = await this.prisma.qCInspection.findMany({
            where: { productionOrderId: inspection.productionOrderId },
          });
          
          const requiredStages = ['CUTTING', 'FABRICATION', 'COATING', 'ASSEMBLY'];
          const completedStages = allInspections
            .filter(i => i.status === 'PASSED')
            .map(i => i.stage);
          
          const allStagesComplete = requiredStages.every(stage => 
            completedStages.includes(stage)
          );
          
          productionStatus = allStagesComplete ? 'QC_APPROVED' : 'IN_PROGRESS';
          break;
          
        case 'FAILED':
        case 'REWORK_REQUIRED':
          productionStatus = 'REWORK_REQUIRED';
          break;
          
        default:
          productionStatus = 'QC_REQUIRED';
      }

      await this.prisma.productionOrder.update({
        where: { id: inspection.productionOrderId },
        data: { status: productionStatus },
      });

      logger.info(`Production order status updated based on QC result`, {
        productionOrderId: inspection.productionOrderId,
        qcStatus,
        newProductionStatus: productionStatus,
      });
    } catch (error) {
      logger.error('Error updating production order from QC:', error);
      throw error;
    }
  }

  /**
   * Generate certificate number
   */
  private async generateCertificateNumber(
    certificateType: 'QUALITY_CERTIFICATE' | 'COMPLIANCE_CERTIFICATE' | 'TEST_CERTIFICATE'
  ): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    const typePrefix = {
      'QUALITY_CERTIFICATE': 'QC',
      'COMPLIANCE_CERTIFICATE': 'CC',
      'TEST_CERTIFICATE': 'TC',
    };
    
    const prefix = `${typePrefix[certificateType]}${year}${month}`;
    const timestamp = Date.now().toString().slice(-4);
    
    return `${prefix}${timestamp}`;
  }

  /**
   * Trigger delivery process after certificate approval
   */
  private async triggerDeliveryProcess(certificateId: string): Promise<void> {
    try {
      // In a real implementation, this would:
      // 1. Update production order status to 'READY_FOR_DELIVERY'
      // 2. Create delivery order
      // 3. Notify logistics team
      // 4. Generate delivery documents
      
      logger.info(`Delivery process triggered for certificate ${certificateId}`, {
        certificateId,
        triggeredAt: new Date(),
      });
    } catch (error) {
      logger.error('Error triggering delivery process:', error);
      throw error;
    }
  }

  /**
   * Get inspector workload data
   */
  private async getInspectorWorkloadData(branchId?: string): Promise<QCInspectorWorkload[]> {
    const whereClause: any = {
      department: 'Quality Control',
    };
    
    if (branchId) {
      whereClause.branchId = branchId;
    }

    const inspectors = await this.prisma.employee.findMany({
      where: whereClause,
    });

    // Get inspection counts separately for each inspector
    const inspectorWorkloads = await Promise.all(
      inspectors.map(async (inspector) => {
        const [pendingCount, inProgressCount, completedToday] = await Promise.all([
          this.prisma.qCInspection.count({
            where: {
              inspectorId: inspector.id,
              status: 'PENDING',
            },
          }),
          this.prisma.qCInspection.count({
            where: {
              inspectorId: inspector.id,
              status: 'PENDING',
            },
          }),
          this.prisma.qCInspection.count({
            where: {
              inspectorId: inspector.id,
              inspectionDate: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lte: new Date(new Date().setHours(23, 59, 59, 999)),
              },
              status: { in: ['PASSED', 'FAILED', 'REWORK_REQUIRED'] },
            },
          }),
        ]);

        return {
          inspectorId: inspector.id,
          inspectorName: `${inspector.firstName} ${inspector.lastName}`,
          pendingCount,
          inProgressCount,
          completedToday,
          efficiency: completedToday, // Simplified efficiency calculation
        };
      })
    );

    return inspectorWorkloads;
  }

  /**
   * Generate QC alerts
   */
  private async generateQCAlerts(branchId?: string): Promise<QCAlert[]> {
    const alerts: QCAlert[] = [];
    
    // SLA breach alerts
    const overdueInspections = await this.prisma.qCInspection.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours old
        },
        ...(branchId ? { productionOrder: { branchId } } : {}),
      },
    });

    overdueInspections.forEach(inspection => {
      alerts.push({
        id: `alert_${inspection.id}`,
        type: 'SLA_BREACH',
        severity: 'HIGH',
        message: `QC inspection ${inspection.inspectionNumber} is overdue`,
        inspectionId: inspection.id,
        productionOrderId: inspection.productionOrderId,
        createdAt: new Date(),
        acknowledged: false,
      });
    });

    // Inspector overload alerts
    const overloadedInspectors = await this.getInspectorWorkloadData(branchId);
    overloadedInspectors
      .filter(inspector => inspector.pendingCount > 10)
      .forEach(inspector => {
        alerts.push({
          id: `alert_inspector_${inspector.inspectorId}`,
          type: 'INSPECTOR_OVERLOAD',
          severity: 'MEDIUM',
          message: `Inspector ${inspector.inspectorName} has ${inspector.pendingCount} pending inspections`,
          inspectorId: inspector.inspectorId,
          createdAt: new Date(),
          acknowledged: false,
        });
      });

    return alerts;
  }

  /**
   * Calculate average QC time
   */
  private async calculateAverageQCTime(branchId?: string): Promise<number> {
    const completedInspections = await this.prisma.qCInspection.findMany({
      where: {
        status: { in: ['PASSED', 'FAILED', 'REWORK_REQUIRED'] },
        inspectionDate: { not: null },
        ...(branchId ? { productionOrder: { branchId } } : {}),
      },
      orderBy: { inspectionDate: 'desc' },
      take: 100, // Last 100 inspections
    });

    if (completedInspections.length === 0) return 0;

    const totalTime = completedInspections.reduce((sum, inspection) => {
      const startTime = inspection.createdAt.getTime();
      const endTime = inspection.inspectionDate.getTime();
      return sum + (endTime - startTime);
    }, 0);

    // Return average time in hours
    return totalTime / completedInspections.length / (1000 * 60 * 60);
  }
}
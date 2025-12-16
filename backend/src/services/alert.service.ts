import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { emailService } from './email.service';
import { smsService } from './sms.service';
import { whatsappService } from './whatsapp.service';

const prisma = new PrismaClient();

// Types and Interfaces
export interface SLAConfigurationRequest {
  module: string;
  process: string;
  slaHours: number;
  escalationLevels: EscalationLevel[];
  isActive?: boolean;
}

export interface EscalationLevel {
  level: number;
  roleOrUserId: string;
  type: 'ROLE' | 'USER';
  hoursAfter: number;
}

export interface AlertRequest {
  type: string;
  module: string;
  referenceId: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedTo?: string;
  dueDate?: Date;
}

export interface AlertNotificationRequest {
  alertId: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'APP';
  recipient: string;
  message: string;
}

export interface AlertDashboardData {
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  overdueAlerts: number;
  alertsByModule: Record<string, number>;
  alertsByPriority: Record<string, number>;
  recentAlerts: any[];
  escalationMetrics: {
    totalEscalations: number;
    escalationsByLevel: Record<string, number>;
    averageResolutionTime: number;
  };
}

export interface SLAPerformanceMetrics {
  totalSLAs: number;
  metSLAs: number;
  breachedSLAs: number;
  slaComplianceRate: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  performanceByModule: Record<string, {
    total: number;
    met: number;
    breached: number;
    complianceRate: number;
  }>;
}

class AlertService {
  /**
   * Create SLA configuration for a module and process
   * Validates: Requirements 9.1 - SLA-based alert system
   */
  async createSLAConfiguration(request: SLAConfigurationRequest) {
    try {
      const slaConfig = await prisma.sLAConfiguration.create({
        data: {
          module: request.module,
          process: request.process,
          slaHours: request.slaHours,
          escalationLevels: JSON.stringify(request.escalationLevels),
        },
      });

      logger.info(`SLA configuration created for ${request.module}:${request.process}`, {
        slaId: slaConfig.id,
        slaHours: request.slaHours,
      });

      return slaConfig;
    } catch (error) {
      logger.error('Error creating SLA configuration:', error);
      throw new Error('Failed to create SLA configuration');
    }
  }

  /**
   * Update SLA configuration
   */
  async updateSLAConfiguration(id: string, request: Partial<SLAConfigurationRequest>) {
    try {
      const updateData: any = {};
      
      if (request.slaHours !== undefined) updateData.slaHours = request.slaHours;
      if (request.escalationLevels) updateData.escalationLevels = JSON.stringify(request.escalationLevels);
      if (request.isActive !== undefined) updateData.isActive = request.isActive;

      const slaConfig = await prisma.sLAConfiguration.update({
        where: { id },
        data: updateData,
      });

      logger.info(`SLA configuration updated: ${id}`);
      return slaConfig;
    } catch (error) {
      logger.error('Error updating SLA configuration:', error);
      throw new Error('Failed to update SLA configuration');
    }
  }

  /**
   * Get SLA configurations with filtering
   */
  async getSLAConfigurations(filters: {
    module?: string;
    process?: string;
    isActive?: boolean;
  } = {}) {
    try {
      const where: any = {};
      
      if (filters.module) where.module = filters.module;
      if (filters.process) where.process = filters.process;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;

      const slaConfigs = await prisma.sLAConfiguration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return slaConfigs.map(config => ({
        ...config,
        escalationLevels: JSON.parse(config.escalationLevels),
      }));
    } catch (error) {
      logger.error('Error fetching SLA configurations:', error);
      throw new Error('Failed to fetch SLA configurations');
    }
  }

  /**
   * Create alert with automatic SLA monitoring
   * Validates: Requirements 9.1, 9.2 - SLA-based alerts with escalation
   */
  async createAlert(request: AlertRequest) {
    try {
      // Calculate due date based on SLA configuration
      let dueDate = request.dueDate;
      if (!dueDate) {
        const slaConfig = await this.getSLAForModuleProcess(request.module, request.type);
        if (slaConfig) {
          dueDate = new Date();
          dueDate.setHours(dueDate.getHours() + slaConfig.slaHours);
        }
      }

      const alert = await prisma.alert.create({
        data: {
          type: request.type,
          module: request.module,
          referenceId: request.referenceId,
          message: request.message,
          priority: request.priority,
          assignedTo: request.assignedTo,
          dueDate,
        },
      });

      // Schedule escalation if SLA configuration exists
      if (dueDate) {
        await this.scheduleEscalation(alert.id, request.module, request.type);
      }

      // Send initial notification
      if (request.assignedTo) {
        await this.sendAlertNotification({
          alertId: alert.id,
          channel: 'EMAIL',
          recipient: request.assignedTo,
          message: request.message,
        });
      }

      logger.info(`Alert created: ${alert.id}`, {
        type: request.type,
        module: request.module,
        priority: request.priority,
      });

      return alert;
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw new Error('Failed to create alert');
    }
  }

  /**
   * Update alert status and handle escalation
   */
  async updateAlert(id: string, updates: {
    status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
    assignedTo?: string;
    resolvedAt?: Date;
  }) {
    try {
      const alert = await prisma.alert.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      // Log status change
      logger.info(`Alert updated: ${id}`, {
        status: updates.status,
        assignedTo: updates.assignedTo,
      });

      return alert;
    } catch (error) {
      logger.error('Error updating alert:', error);
      throw new Error('Failed to update alert');
    }
  }

  /**
   * Get alerts with filtering and pagination
   */
  async getAlerts(filters: {
    module?: string;
    type?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  } = {}) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (filters.module) where.module = filters.module;
      if (filters.type) where.type = filters.type;
      if (filters.status) where.status = filters.status;
      if (filters.priority) where.priority = filters.priority;
      if (filters.assignedTo) where.assignedTo = filters.assignedTo;

      const [alerts, total] = await Promise.all([
        prisma.alert.findMany({
          where,
          include: {
            notifications: true,
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        prisma.alert.count({ where }),
      ]);

      return {
        alerts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching alerts:', error);
      throw new Error('Failed to fetch alerts');
    }
  }

  /**
   * Send multi-channel alert notification
   * Validates: Requirements 9.3 - Multi-channel alert delivery
   */
  async sendAlertNotification(request: AlertNotificationRequest) {
    try {
      const notification = await prisma.alertNotification.create({
        data: {
          alertId: request.alertId,
          channel: request.channel,
          recipient: request.recipient,
          message: request.message,
        },
      });

      let success = false;
      let errorMessage = '';

      try {
        switch (request.channel) {
          case 'EMAIL':
            const emailResult = await emailService.sendAlertNotificationEmail(
              request.recipient,
              'System Alert',
              request.message,
              'MEDIUM'
            );
            success = emailResult?.success || false;
            break;

          case 'SMS':
            const smsResult = await smsService.sendAlertNotificationSMS(
              request.recipient,
              'SYSTEM_ALERT',
              request.message,
              'MEDIUM'
            );
            success = smsResult?.success || false;
            break;

          case 'WHATSAPP':
            const whatsappResult = await whatsappService.sendAlertNotification(
              request.recipient,
              request.message,
              'MEDIUM'
            );
            success = whatsappResult?.success || false;
            break;

          case 'APP':
            // For app notifications, we'll mark as sent immediately
            // In a real implementation, this would integrate with push notification service
            success = true;
            break;

          default:
            throw new Error(`Unsupported notification channel: ${request.channel}`);
        }
      } catch (channelError) {
        logger.error(`Error sending ${request.channel} notification:`, channelError);
        errorMessage = channelError instanceof Error ? channelError.message : 'Unknown error';
      }

      // Update notification status
      await prisma.alertNotification.update({
        where: { id: notification.id },
        data: {
          status: success ? 'SENT' : 'FAILED',
          sentAt: success ? new Date() : null,
        },
      });

      logger.info(`Alert notification ${success ? 'sent' : 'failed'}`, {
        notificationId: notification.id,
        channel: request.channel,
        recipient: request.recipient,
        error: errorMessage,
      });

      return { success, notification, error: errorMessage };
    } catch (error) {
      logger.error('Error sending alert notification:', error);
      throw new Error('Failed to send alert notification');
    }
  }

  /**
   * Process escalation for overdue alerts
   * Validates: Requirements 9.2 - Escalation hierarchy (Employee → TL → Manager → GM)
   */
  async processEscalations() {
    try {
      const overdueAlerts = await prisma.alert.findMany({
        where: {
          status: { in: ['ACTIVE', 'ACKNOWLEDGED'] },
          dueDate: { lt: new Date() },
        },
        include: {
          notifications: true,
        },
      });

      const escalationResults = [];

      for (const alert of overdueAlerts) {
        try {
          const slaConfig = await this.getSLAForModuleProcess(alert.module, alert.type);
          if (!slaConfig) continue;

          const escalationLevels: EscalationLevel[] = JSON.parse(slaConfig.escalationLevels);
          const currentTime = new Date();
          const alertAge = (currentTime.getTime() - alert.createdAt.getTime()) / (1000 * 60 * 60); // hours

          // Find appropriate escalation level
          const applicableLevel = escalationLevels
            .filter(level => alertAge >= level.hoursAfter)
            .sort((a, b) => b.hoursAfter - a.hoursAfter)[0];

          if (applicableLevel) {
            // Check if already escalated to this level
            const existingEscalation = alert.notifications.find(
              n => n.recipient === applicableLevel.roleOrUserId && n.status === 'SENT'
            );

            if (!existingEscalation) {
              // Escalate to next level
              await this.sendAlertNotification({
                alertId: alert.id,
                channel: 'EMAIL',
                recipient: applicableLevel.roleOrUserId,
                message: `ESCALATED: ${alert.message}`,
              });

              // Update alert with escalation timestamp
              await prisma.alert.update({
                where: { id: alert.id },
                data: { escalatedAt: currentTime },
              });

              escalationResults.push({
                alertId: alert.id,
                escalatedTo: applicableLevel.roleOrUserId,
                level: applicableLevel.level,
              });
            }
          }
        } catch (escalationError) {
          logger.error(`Error escalating alert ${alert.id}:`, escalationError);
        }
      }

      logger.info(`Processed ${escalationResults.length} escalations`);
      return escalationResults;
    } catch (error) {
      logger.error('Error processing escalations:', error);
      throw new Error('Failed to process escalations');
    }
  }

  /**
   * Generate automatic reminders and follow-up loops
   * Validates: Requirements 9.4 - Automatic reminder and follow-up loop systems
   */
  async generateReminders() {
    try {
      const activeAlerts = await prisma.alert.findMany({
        where: {
          status: { in: ['ACTIVE', 'ACKNOWLEDGED'] },
          dueDate: { gte: new Date() },
        },
        include: {
          notifications: true,
        },
      });

      const reminderResults = [];

      for (const alert of activeAlerts) {
        const dueDate = alert.dueDate;
        if (!dueDate) continue;

        const currentTime = new Date();
        const hoursUntilDue = (dueDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

        // Send reminder 24 hours before due date
        if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
          const existingReminder = alert.notifications.find(
            n => n.message.includes('REMINDER') && n.status === 'SENT'
          );

          if (!existingReminder && alert.assignedTo) {
            await this.sendAlertNotification({
              alertId: alert.id,
              channel: 'EMAIL',
              recipient: alert.assignedTo,
              message: `REMINDER: ${alert.message} - Due in ${Math.round(hoursUntilDue)} hours`,
            });

            reminderResults.push({
              alertId: alert.id,
              reminderType: '24_HOUR',
              recipient: alert.assignedTo,
            });
          }
        }
      }

      logger.info(`Generated ${reminderResults.length} reminders`);
      return reminderResults;
    } catch (error) {
      logger.error('Error generating reminders:', error);
      throw new Error('Failed to generate reminders');
    }
  }

  /**
   * Get alert dashboard data
   * Validates: Requirements 9.1, 9.5 - Alert dashboard and monitoring system
   */
  async getAlertDashboard(filters: { branchId?: string; module?: string } = {}): Promise<AlertDashboardData> {
    try {
      const where: any = {};
      if (filters.module) where.module = filters.module;

      const [
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        overdueAlerts,
        alertsByModule,
        alertsByPriority,
        recentAlerts,
        escalationMetrics,
      ] = await Promise.all([
        prisma.alert.count({ where }),
        prisma.alert.count({ where: { ...where, status: 'ACTIVE' } }),
        prisma.alert.count({ where: { ...where, priority: 'CRITICAL' } }),
        prisma.alert.count({
          where: {
            ...where,
            status: { in: ['ACTIVE', 'ACKNOWLEDGED'] },
            dueDate: { lt: new Date() },
          },
        }),
        this.getAlertsByModule(where),
        this.getAlertsByPriority(where),
        prisma.alert.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            notifications: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        }),
        this.getEscalationMetrics(where),
      ]);

      return {
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        overdueAlerts,
        alertsByModule,
        alertsByPriority,
        recentAlerts,
        escalationMetrics,
      };
    } catch (error) {
      logger.error('Error fetching alert dashboard:', error);
      throw new Error('Failed to fetch alert dashboard');
    }
  }

  /**
   * Get SLA performance metrics
   * Validates: Requirements 9.5 - Alert analytics and performance metrics
   */
  async getSLAPerformanceMetrics(filters: {
    module?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<SLAPerformanceMetrics> {
    try {
      const where: any = {};
      if (filters.module) where.module = filters.module;
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      const alerts = await prisma.alert.findMany({
        where,
        include: {
          notifications: true,
        },
      });

      let totalSLAs = 0;
      let metSLAs = 0;
      let breachedSLAs = 0;
      let totalResponseTime = 0;
      let totalResolutionTime = 0;
      const performanceByModule: Record<string, any> = {};

      for (const alert of alerts) {
        if (!alert.dueDate) continue;

        totalSLAs++;
        const module = alert.module;

        if (!performanceByModule[module]) {
          performanceByModule[module] = { total: 0, met: 0, breached: 0, complianceRate: 0 };
        }
        performanceByModule[module].total++;

        const isResolved = alert.status === 'RESOLVED';
        const resolvedAt = alert.resolvedAt || new Date();
        const responseTime = (resolvedAt.getTime() - alert.createdAt.getTime()) / (1000 * 60 * 60); // hours
        const slaBreached = resolvedAt > alert.dueDate;

        if (slaBreached) {
          breachedSLAs++;
          performanceByModule[module].breached++;
        } else {
          metSLAs++;
          performanceByModule[module].met++;
        }

        totalResponseTime += responseTime;
        if (isResolved) {
          totalResolutionTime += responseTime;
        }
      }

      // Calculate compliance rates
      Object.keys(performanceByModule).forEach(module => {
        const moduleData = performanceByModule[module];
        moduleData.complianceRate = moduleData.total > 0 
          ? (moduleData.met / moduleData.total) * 100 
          : 0;
      });

      return {
        totalSLAs,
        metSLAs,
        breachedSLAs,
        slaComplianceRate: totalSLAs > 0 ? (metSLAs / totalSLAs) * 100 : 0,
        averageResponseTime: totalSLAs > 0 ? totalResponseTime / totalSLAs : 0,
        averageResolutionTime: totalSLAs > 0 ? totalResolutionTime / totalSLAs : 0,
        performanceByModule,
      };
    } catch (error) {
      logger.error('Error calculating SLA performance metrics:', error);
      throw new Error('Failed to calculate SLA performance metrics');
    }
  }

  // Helper methods
  private async getSLAForModuleProcess(module: string, process: string) {
    return prisma.sLAConfiguration.findFirst({
      where: {
        module,
        process,
        isActive: true,
      },
    });
  }

  private async scheduleEscalation(alertId: string, module: string, process: string) {
    // In a production system, this would integrate with a job scheduler
    // For now, we'll rely on periodic processing
    logger.info(`Escalation scheduled for alert: ${alertId}`);
  }

  private async getAlertsByModule(where: any) {
    const results = await prisma.alert.groupBy({
      by: ['module'],
      where,
      _count: { id: true },
    });

    return results.reduce((acc, item) => {
      acc[item.module] = item._count.id;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getAlertsByPriority(where: any) {
    const results = await prisma.alert.groupBy({
      by: ['priority'],
      where,
      _count: { id: true },
    });

    return results.reduce((acc, item) => {
      acc[item.priority] = item._count.id;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getEscalationMetrics(where: any) {
    const escalatedAlerts = await prisma.alert.findMany({
      where: {
        ...where,
        escalatedAt: { not: null },
      },
      include: {
        notifications: true,
      },
    });

    const totalEscalations = escalatedAlerts.length;
    const escalationsByLevel: Record<string, number> = {};
    let totalResolutionTime = 0;

    escalatedAlerts.forEach(alert => {
      const escalationCount = alert.notifications.length;
      const level = `Level_${escalationCount}`;
      escalationsByLevel[level] = (escalationsByLevel[level] || 0) + 1;

      if (alert.resolvedAt) {
        const resolutionTime = (alert.resolvedAt.getTime() - alert.createdAt.getTime()) / (1000 * 60 * 60);
        totalResolutionTime += resolutionTime;
      }
    });

    return {
      totalEscalations,
      escalationsByLevel,
      averageResolutionTime: totalEscalations > 0 ? totalResolutionTime / totalEscalations : 0,
    };
  }
}

export const alertService = new AlertService();
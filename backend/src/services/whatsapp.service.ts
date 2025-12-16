// WhatsApp Cloud API Service - Customer communication and notifications
import axios from 'axios';
import { logger } from '../utils/logger';

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'image' | 'document';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
  image?: {
    link: string;
    caption?: string;
  };
  document?: {
    link: string;
    filename: string;
    caption?: string;
  };
}

export interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface WhatsAppWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
}

export interface WhatsAppWebhookStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
  }>;
}

export class WhatsAppService {
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

    if (!this.accessToken || !this.phoneNumberId) {
      logger.warn('WhatsApp credentials not configured');
    }
  }

  /**
   * Send text message to customer
   * Validates: Requirements 11.4 - WhatsApp integration for automated updates
   */
  async sendTextMessage(to: string, message: string): Promise<string | null> {
    try {
      const payload: WhatsAppMessage = {
        to: this.formatPhoneNumber(to),
        type: 'text',
        text: {
          body: message,
        },
      };

      const response = await this.sendMessage(payload);
      
      if (response?.messages?.[0]?.id) {
        logger.info('WhatsApp text message sent successfully', {
          to,
          messageId: response.messages[0].id,
        });
        return response.messages[0].id;
      }

      return null;
    } catch (error) {
      logger.error('Error sending WhatsApp text message:', error);
      throw error;
    }
  }

  /**
   * Send template message for order updates
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    components?: any[]
  ): Promise<string | null> {
    try {
      const payload: WhatsAppMessage = {
        to: this.formatPhoneNumber(to),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components: components || [],
        },
      };

      const response = await this.sendMessage(payload);
      
      if (response?.messages?.[0]?.id) {
        logger.info('WhatsApp template message sent successfully', {
          to,
          templateName,
          messageId: response.messages[0].id,
        });
        return response.messages[0].id;
      }

      return null;
    } catch (error) {
      logger.error('Error sending WhatsApp template message:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation message
   */
  async sendOrderConfirmation(
    customerPhone: string,
    orderNumber: string,
    orderAmount: number,
    deliveryDate: string
  ): Promise<string | null> {
    const message = `🎉 Order Confirmed!\n\nOrder #: ${orderNumber}\nAmount: ₹${orderAmount.toLocaleString()}\nExpected Delivery: ${deliveryDate}\n\nThank you for choosing us! We'll keep you updated on your order progress.`;
    
    return this.sendTextMessage(customerPhone, message);
  }

  /**
   * Send production update message
   */
  async sendProductionUpdate(
    customerPhone: string,
    orderNumber: string,
    stage: string,
    completionPercentage: number
  ): Promise<string | null> {
    const message = `📋 Production Update\n\nOrder #: ${orderNumber}\nCurrent Stage: ${stage}\nProgress: ${completionPercentage}%\n\nYour order is progressing well. We'll notify you when it moves to the next stage.`;
    
    return this.sendTextMessage(customerPhone, message);
  }

  /**
   * Send delivery notification
   */
  async sendDeliveryNotification(
    customerPhone: string,
    orderNumber: string,
    deliveryDate: string,
    trackingInfo?: string
  ): Promise<string | null> {
    let message = `🚚 Ready for Delivery!\n\nOrder #: ${orderNumber}\nDelivery Date: ${deliveryDate}`;
    
    if (trackingInfo) {
      message += `\nTracking: ${trackingInfo}`;
    }
    
    message += '\n\nOur team will contact you to schedule the delivery. Please ensure someone is available to receive the order.';
    
    return this.sendTextMessage(customerPhone, message);
  }

  /**
   * Send service appointment reminder
   */
  async sendServiceReminder(
    customerPhone: string,
    serviceNumber: string,
    appointmentDate: string,
    technicianName: string
  ): Promise<string | null> {
    const message = `🔧 Service Appointment Reminder\n\nService #: ${serviceNumber}\nDate: ${appointmentDate}\nTechnician: ${technicianName}\n\nOur technician will arrive at the scheduled time. Please ensure access to the service location.`;
    
    return this.sendTextMessage(customerPhone, message);
  }

  /**
   * Send alert notification via WhatsApp
   */
  async sendAlertNotification(
    recipientPhone: string,
    message: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const priorityEmojis = {
        LOW: '🔵',
        MEDIUM: '🟡',
        HIGH: '🟠',
        CRITICAL: '🔴',
      };

      const alertMessage = `${priorityEmojis[priority]} SYSTEM ALERT [${priority}]\n\n${message}\n\nPlease check the system for more details.`;
      
      const messageId = await this.sendTextMessage(recipientPhone, alertMessage);
      
      return {
        success: !!messageId,
        messageId: messageId || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send image with caption
   */
  async sendImage(
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<string | null> {
    try {
      const payload: WhatsAppMessage = {
        to: this.formatPhoneNumber(to),
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption,
        },
      };

      const response = await this.sendMessage(payload);
      
      if (response?.messages?.[0]?.id) {
        logger.info('WhatsApp image sent successfully', {
          to,
          imageUrl,
          messageId: response.messages[0].id,
        });
        return response.messages[0].id;
      }

      return null;
    } catch (error) {
      logger.error('Error sending WhatsApp image:', error);
      throw error;
    }
  }

  /**
   * Send document
   */
  async sendDocument(
    to: string,
    documentUrl: string,
    filename: string,
    caption?: string
  ): Promise<string | null> {
    try {
      const payload: WhatsAppMessage = {
        to: this.formatPhoneNumber(to),
        type: 'document',
        document: {
          link: documentUrl,
          filename: filename,
          caption: caption,
        },
      };

      const response = await this.sendMessage(payload);
      
      if (response?.messages?.[0]?.id) {
        logger.info('WhatsApp document sent successfully', {
          to,
          filename,
          messageId: response.messages[0].id,
        });
        return response.messages[0].id;
      }

      return null;
    } catch (error) {
      logger.error('Error sending WhatsApp document:', error);
      throw error;
    }
  }

  /**
   * Process incoming webhook message
   */
  processIncomingMessage(webhookData: any): WhatsAppWebhookMessage[] {
    const messages: WhatsAppWebhookMessage[] = [];

    try {
      if (webhookData.entry) {
        for (const entry of webhookData.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.value?.messages) {
                for (const message of change.value.messages) {
                  messages.push({
                    from: message.from,
                    id: message.id,
                    timestamp: message.timestamp,
                    type: message.type,
                    text: message.text,
                    image: message.image,
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error processing WhatsApp webhook message:', error);
    }

    return messages;
  }

  /**
   * Process message status updates
   */
  processStatusUpdate(webhookData: any): WhatsAppWebhookStatus[] {
    const statuses: WhatsAppWebhookStatus[] = [];

    try {
      if (webhookData.entry) {
        for (const entry of webhookData.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.value?.statuses) {
                for (const status of change.value.statuses) {
                  statuses.push({
                    id: status.id,
                    status: status.status,
                    timestamp: status.timestamp,
                    recipient_id: status.recipient_id,
                    errors: status.errors,
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error processing WhatsApp status update:', error);
    }

    return statuses;
  }

  /**
   * Send message via WhatsApp Cloud API
   */
  private async sendMessage(payload: WhatsAppMessage): Promise<WhatsAppResponse | null> {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error('WhatsApp credentials not configured');
      }

      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      logger.error('WhatsApp API request failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        payload,
      });
      throw error;
    }
  }

  /**
   * Format phone number for WhatsApp API
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Verify webhook signature (for security)
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.META_APP_SECRET || '')
        .update(payload)
        .digest('hex');
      
      return signature === `sha256=${expectedSignature}`;
    } catch (error) {
      logger.error('Error verifying WhatsApp webhook signature:', error);
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();
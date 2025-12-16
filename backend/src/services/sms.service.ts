// SMS Service - Twilio integration for notifications
import { Twilio } from 'twilio';
import { logger } from '../utils/logger';

export interface SMSMessage {
  to: string;
  message: string;
  from?: string;
}

export interface SMSResult {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  dateCreated: Date;
  dateSent?: Date;
  errorCode?: number;
  errorMessage?: string;
}

export class SMSService {
  private client: Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!accountSid || !authToken || !this.fromNumber) {
      logger.warn('Twilio SMS credentials not configured');
      // Create a mock client to prevent errors
      this.client = {} as Twilio;
      return;
    }

    this.client = new Twilio(accountSid, authToken);
  }

  /**
   * Send SMS message
   * Validates: Requirements 11.4, 20.2 - SMS integration for notifications
   */
  async sendSMS(message: SMSMessage): Promise<SMSResult | null> {
    try {
      if (!this.client.messages) {
        throw new Error('Twilio client not properly configured');
      }

      const result = await this.client.messages.create({
        body: message.message,
        from: message.from || this.fromNumber,
        to: this.formatPhoneNumber(message.to),
      });

      logger.info('SMS sent successfully', {
        sid: result.sid,
        to: message.to,
        status: result.status,
      });

      return {
        sid: result.sid,
        status: result.status,
        to: result.to,
        from: result.from,
        body: result.body,
        dateCreated: result.dateCreated,
        dateSent: result.dateSent || undefined,
        errorCode: result.errorCode || undefined,
        errorMessage: result.errorMessage || undefined,
      };
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmationSMS(
    customerPhone: string,
    customerName: string,
    orderNumber: string,
    orderAmount: number
  ): Promise<SMSResult | null> {
    const message = `Hi ${customerName}, your order ${orderNumber} for ₹${orderAmount.toLocaleString()} has been confirmed. We'll keep you updated on the progress. Thank you for choosing us!`;
    
    return this.sendSMS({
      to: customerPhone,
      message: message,
    });
  }

  /**
   * Send production update SMS
   */
  async sendProductionUpdateSMS(
    customerPhone: string,
    orderNumber: string,
    stage: string,
    completionPercentage: number
  ): Promise<SMSResult | null> {
    const message = `Production Update: Order ${orderNumber} is now at ${stage} stage (${completionPercentage}% complete). We'll notify you when it moves to the next stage.`;
    
    return this.sendSMS({
      to: customerPhone,
      message: message,
    });
  }

  /**
   * Send delivery notification SMS
   */
  async sendDeliveryNotificationSMS(
    customerPhone: string,
    orderNumber: string,
    deliveryDate: string
  ): Promise<SMSResult | null> {
    const message = `Great news! Your order ${orderNumber} is ready for delivery on ${deliveryDate}. Our team will contact you to schedule the delivery. Please ensure someone is available to receive it.`;
    
    return this.sendSMS({
      to: customerPhone,
      message: message,
    });
  }

  /**
   * Send service appointment reminder SMS
   */
  async sendServiceReminderSMS(
    customerPhone: string,
    serviceNumber: string,
    appointmentDate: string,
    technicianName: string
  ): Promise<SMSResult | null> {
    const message = `Service Reminder: Your appointment ${serviceNumber} is scheduled for ${appointmentDate}. Technician: ${technicianName}. Please ensure access to the service location.`;
    
    return this.sendSMS({
      to: customerPhone,
      message: message,
    });
  }

  /**
   * Send lead follow-up SMS
   */
  async sendLeadFollowUpSMS(
    leadPhone: string,
    leadName: string,
    salesPersonName: string
  ): Promise<SMSResult | null> {
    const message = `Hi ${leadName}, thank you for your interest in our steel products. ${salesPersonName} will contact you within 24 hours to discuss your requirements. We look forward to serving you!`;
    
    return this.sendSMS({
      to: leadPhone,
      message: message,
    });
  }

  /**
   * Send OTP SMS
   */
  async sendOTP(
    phoneNumber: string,
    otp: string,
    purpose: string = 'verification'
  ): Promise<SMSResult | null> {
    const message = `Your OTP for ${purpose} is: ${otp}. This code is valid for 10 minutes. Please do not share this code with anyone.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message: message,
    });
  }

  /**
   * Send alert notification SMS
   */
  async sendAlertNotificationSMS(
    recipientPhone: string,
    alertType: string,
    message: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): Promise<SMSResult | null> {
    const priorityPrefix = priority === 'CRITICAL' ? '[URGENT] ' : priority === 'HIGH' ? '[HIGH] ' : '';
    const smsMessage = `${priorityPrefix}${alertType}: ${message}. Please check the system for details.`;
    
    return this.sendSMS({
      to: recipientPhone,
      message: smsMessage,
    });
  }

  /**
   * Send bulk SMS to multiple recipients
   */
  async sendBulkSMS(
    recipients: string[],
    message: string
  ): Promise<SMSResult[]> {
    const results: SMSResult[] = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendSMS({
          to: recipient,
          message: message,
        });
        
        if (result) {
          results.push(result);
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`Error sending SMS to ${recipient}:`, error);
        // Continue with other recipients
      }
    }
    
    logger.info(`Bulk SMS sent to ${results.length}/${recipients.length} recipients`);
    return results;
  }

  /**
   * Get SMS delivery status
   */
  async getSMSStatus(messageSid: string): Promise<SMSResult | null> {
    try {
      if (!this.client.messages) {
        throw new Error('Twilio client not properly configured');
      }

      const message = await this.client.messages(messageSid).fetch();

      return {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent || undefined,
        errorCode: message.errorCode || undefined,
        errorMessage: message.errorMessage || undefined,
      };
    } catch (error) {
      logger.error('Error fetching SMS status:', error);
      throw error;
    }
  }

  /**
   * Format phone number for Twilio
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid Indian mobile number
    if (cleaned.length === 10) {
      return /^[6-9]\d{9}$/.test(cleaned);
    }
    
    // Check if it's a valid international format
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return /^91[6-9]\d{9}$/.test(cleaned);
    }
    
    return false;
  }

  /**
   * Send template-based SMS
   */
  async sendTemplateSMS(
    to: string,
    templateName: string,
    variables: Record<string, string>
  ): Promise<SMSResult | null> {
    try {
      // Simple template system for SMS
      const templates: Record<string, string> = {
        'order_confirmation': 'Hi {{customerName}}, your order {{orderNumber}} for ₹{{amount}} is confirmed. Thank you!',
        'delivery_update': 'Order {{orderNumber}} will be delivered on {{date}}. Please be available.',
        'service_reminder': 'Service appointment {{serviceNumber}} on {{date}} with {{technician}}.',
        'payment_reminder': 'Payment of ₹{{amount}} for order {{orderNumber}} is due on {{dueDate}}.',
      };

      const template = templates[templateName];
      if (!template) {
        throw new Error(`SMS template '${templateName}' not found`);
      }

      let message = template;

      // Replace variables in template
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        message = message.replace(new RegExp(placeholder, 'g'), value);
      }

      return this.sendSMS({
        to,
        message,
      });
    } catch (error) {
      logger.error('Error sending template SMS:', error);
      throw error;
    }
  }
}
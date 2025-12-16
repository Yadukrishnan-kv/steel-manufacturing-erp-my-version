// Meta Business API Service - Facebook/Instagram lead capture
import axios from 'axios';
import { logger } from '../utils/logger';

export interface MetaLead {
  id: string;
  created_time: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  form_name?: string;
  is_organic?: boolean;
  platform?: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  created_time: string;
  updated_time: string;
  insights?: {
    impressions?: number;
    clicks?: number;
    spend?: number;
    cpm?: number;
    cpc?: number;
    ctr?: number;
  };
}

export interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  created_time: string;
  targeting?: any;
  budget_remaining?: number;
  daily_budget?: number;
}

export interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  status: string;
  created_time: string;
  creative?: {
    id: string;
    title?: string;
    body?: string;
    image_url?: string;
  };
}

export interface ProcessedMetaLead {
  externalId: string;
  source: 'META';
  platform: 'FACEBOOK' | 'INSTAGRAM';
  campaignId?: string;
  campaignName?: string;
  adSetId?: string;
  adSetName?: string;
  adId?: string;
  adName?: string;
  formId?: string;
  formName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  requirements?: string;
  estimatedValue?: number;
  capturedAt: Date;
  isOrganic: boolean;
  rawData: MetaLead;
}

export class MetaService {
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';
  private readonly accessToken: string;
  private readonly appId: string;

  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN || '';
    this.appId = process.env.META_APP_ID || '';

    if (!this.accessToken || !this.appId) {
      logger.warn('Meta API credentials not configured');
    }
  }

  /**
   * Fetch leads from Meta Business API
   * Validates: Requirements 4.1 - External lead source attribution
   */
  async fetchLeads(
    formId?: string,
    since?: Date,
    until?: Date,
    limit: number = 100
  ): Promise<ProcessedMetaLead[]> {
    try {
      if (!this.accessToken) {
        throw new Error('Meta access token not configured');
      }

      const leads: ProcessedMetaLead[] = [];
      let url = `${this.baseUrl}/${formId || this.appId}/leadgen_forms`;
      
      if (formId) {
        url = `${this.baseUrl}/${formId}/leads`;
      }

      const params: any = {
        access_token: this.accessToken,
        limit: limit,
        fields: 'id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,form_name,is_organic,platform,field_data',
      };

      if (since) {
        params.since = Math.floor(since.getTime() / 1000);
      }

      if (until) {
        params.until = Math.floor(until.getTime() / 1000);
      }

      const response = await axios.get(url, {
        params,
        timeout: 30000,
      });

      if (response.data?.data) {
        for (const lead of response.data.data) {
          const processedLead = this.processMetaLead(lead);
          if (processedLead) {
            leads.push(processedLead);
          }
        }
      }

      logger.info(`Fetched ${leads.length} leads from Meta API`, {
        formId,
        since,
        until,
        limit,
      });

      return leads;
    } catch (error) {
      logger.error('Error fetching Meta leads:', error);
      throw error;
    }
  }

  /**
   * Get specific lead details by ID
   */
  async getLeadById(leadId: string): Promise<ProcessedMetaLead | null> {
    try {
      if (!this.accessToken) {
        throw new Error('Meta access token not configured');
      }

      const url = `${this.baseUrl}/${leadId}`;
      const params = {
        access_token: this.accessToken,
        fields: 'id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,form_name,is_organic,platform,field_data',
      };

      const response = await axios.get(url, {
        params,
        timeout: 30000,
      });

      if (response.data) {
        return this.processMetaLead(response.data);
      }

      return null;
    } catch (error) {
      logger.error('Error fetching Meta lead by ID:', error);
      throw error;
    }
  }

  /**
   * Get campaign performance data
   */
  async getCampaignInsights(
    campaignId: string,
    since?: Date,
    until?: Date
  ): Promise<MetaCampaign | null> {
    try {
      if (!this.accessToken) {
        throw new Error('Meta access token not configured');
      }

      const url = `${this.baseUrl}/${campaignId}`;
      const params: any = {
        access_token: this.accessToken,
        fields: 'id,name,status,objective,created_time,updated_time,insights{impressions,clicks,spend,cpm,cpc,ctr}',
      };

      if (since && until) {
        params['insights.time_range'] = JSON.stringify({
          since: since.toISOString().split('T')[0],
          until: until.toISOString().split('T')[0],
        });
      }

      const response = await axios.get(url, {
        params,
        timeout: 30000,
      });

      if (response.data) {
        const campaign = response.data;
        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          created_time: campaign.created_time,
          updated_time: campaign.updated_time,
          insights: campaign.insights?.data?.[0] || {},
        };
      }

      return null;
    } catch (error) {
      logger.error('Error fetching campaign insights:', error);
      throw error;
    }
  }

  /**
   * Get all campaigns for the account
   */
  async getCampaigns(limit: number = 50): Promise<MetaCampaign[]> {
    try {
      if (!this.accessToken) {
        throw new Error('Meta access token not configured');
      }

      const url = `${this.baseUrl}/act_${this.appId}/campaigns`;
      const params = {
        access_token: this.accessToken,
        fields: 'id,name,status,objective,created_time,updated_time',
        limit: limit,
      };

      const response = await axios.get(url, {
        params,
        timeout: 30000,
      });

      return response.data?.data || [];
    } catch (error) {
      logger.error('Error fetching campaigns:', error);
      throw error;
    }
  }

  /**
   * Get ad sets for a campaign
   */
  async getAdSets(campaignId: string, limit: number = 50): Promise<MetaAdSet[]> {
    try {
      if (!this.accessToken) {
        throw new Error('Meta access token not configured');
      }

      const url = `${this.baseUrl}/${campaignId}/adsets`;
      const params = {
        access_token: this.accessToken,
        fields: 'id,name,campaign_id,status,created_time,targeting,budget_remaining,daily_budget',
        limit: limit,
      };

      const response = await axios.get(url, {
        params,
        timeout: 30000,
      });

      return response.data?.data || [];
    } catch (error) {
      logger.error('Error fetching ad sets:', error);
      throw error;
    }
  }

  /**
   * Get ads for an ad set
   */
  async getAds(adSetId: string, limit: number = 50): Promise<MetaAd[]> {
    try {
      if (!this.accessToken) {
        throw new Error('Meta access token not configured');
      }

      const url = `${this.baseUrl}/${adSetId}/ads`;
      const params = {
        access_token: this.accessToken,
        fields: 'id,name,adset_id,status,created_time,creative{id,title,body,image_url}',
        limit: limit,
      };

      const response = await axios.get(url, {
        params,
        timeout: 30000,
      });

      return response.data?.data || [];
    } catch (error) {
      logger.error('Error fetching ads:', error);
      throw error;
    }
  }

  /**
   * Process raw Meta lead data into standardized format
   */
  private processMetaLead(lead: MetaLead): ProcessedMetaLead | null {
    try {
      const fieldData = lead.field_data || [];
      const processedLead: ProcessedMetaLead = {
        externalId: lead.id,
        source: 'META',
        platform: this.determinePlatform(lead.platform),
        campaignId: lead.campaign_id,
        campaignName: lead.campaign_name,
        adSetId: lead.adset_id,
        adSetName: lead.adset_name,
        adId: lead.ad_id,
        adName: lead.ad_name,
        formId: lead.form_id,
        formName: lead.form_name,
        capturedAt: new Date(lead.created_time),
        isOrganic: lead.is_organic || false,
        rawData: lead,
      };

      // Extract contact information from field data
      for (const field of fieldData) {
        const fieldName = field.name.toLowerCase();
        const value = field.values?.[0] || '';

        switch (fieldName) {
          case 'full_name':
          case 'name':
          case 'first_name':
            processedLead.contactName = value;
            break;
          case 'phone_number':
          case 'phone':
          case 'mobile':
            processedLead.phone = this.cleanPhoneNumber(value);
            break;
          case 'email':
          case 'email_address':
            processedLead.email = value;
            break;
          case 'address':
          case 'location':
          case 'city':
            processedLead.address = value;
            break;
          case 'requirements':
          case 'message':
          case 'comments':
          case 'description':
            processedLead.requirements = value;
            break;
          case 'budget':
          case 'estimated_value':
            const numValue = parseFloat(value.replace(/[^\d.]/g, ''));
            if (!isNaN(numValue)) {
              processedLead.estimatedValue = numValue;
            }
            break;
        }
      }

      // Validate required fields
      if (!processedLead.contactName && !processedLead.phone && !processedLead.email) {
        logger.warn('Meta lead missing required contact information', { leadId: lead.id });
        return null;
      }

      return processedLead;
    } catch (error) {
      logger.error('Error processing Meta lead:', error);
      return null;
    }
  }

  /**
   * Determine platform from Meta lead data
   */
  private determinePlatform(platform?: string): 'FACEBOOK' | 'INSTAGRAM' {
    if (platform?.toLowerCase().includes('instagram')) {
      return 'INSTAGRAM';
    }
    return 'FACEBOOK';
  }

  /**
   * Clean and format phone number
   */
  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Remove leading + if present
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    // Add country code if not present (assuming India +91)
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Verify webhook signature for security
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
      logger.error('Error verifying Meta webhook signature:', error);
      return false;
    }
  }

  /**
   * Process webhook lead data
   */
  processWebhookLead(webhookData: any): ProcessedMetaLead[] {
    const leads: ProcessedMetaLead[] = [];

    try {
      if (webhookData.entry) {
        for (const entry of webhookData.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.value?.leadgen_id) {
                // This is a lead generation event
                // We would need to fetch the full lead data using the leadgen_id
                logger.info('New Meta lead webhook received', {
                  leadgenId: change.value.leadgen_id,
                  formId: change.value.form_id,
                  adId: change.value.ad_id,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error processing Meta webhook lead:', error);
    }

    return leads;
  }
}
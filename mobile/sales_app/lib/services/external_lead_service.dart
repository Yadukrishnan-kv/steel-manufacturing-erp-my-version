import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared/shared.dart';
import '../models/lead.dart';
import 'sales_api_service.dart';
import 'offline_storage_service.dart';

class ExternalLeadService {
  static final ExternalLeadService _instance = ExternalLeadService._internal();
  factory ExternalLeadService() => _instance;
  ExternalLeadService._internal();

  final SalesApiService _apiService = SalesApiService(getIt<ApiClient>());
  final OfflineStorageService _offlineStorage = OfflineStorageService();

  /// Capture lead from Meta (Facebook/Instagram) advertising
  Future<Lead> captureMetaLead(Map<String, dynamic> metaLeadData) async {
    try {
      // Extract lead information from Meta lead data
      final leadData = _parseMetaLeadData(metaLeadData);
      
      // Try to send to server first
      try {
        final serverLead = await _apiService.captureExternalLead(leadData);
        // Save to offline storage with server ID
        await _offlineStorage.saveLead(serverLead.copyWith(id: 'server_${serverLead.id}'));
        return serverLead;
      } catch (e) {
        // If server fails, save locally
        final localLead = Lead.fromJson(leadData);
        await _offlineStorage.saveLead(localLead);
        return localLead;
      }
    } catch (e) {
      if (kDebugMode) {
        print('Failed to capture Meta lead: $e');
      }
      rethrow;
    }
  }

  /// Capture lead from Google Ads
  Future<Lead> captureGoogleLead(Map<String, dynamic> googleLeadData) async {
    try {
      // Extract lead information from Google lead data
      final leadData = _parseGoogleLeadData(googleLeadData);
      
      // Try to send to server first
      try {
        final serverLead = await _apiService.captureExternalLead(leadData);
        // Save to offline storage with server ID
        await _offlineStorage.saveLead(serverLead.copyWith(id: 'server_${serverLead.id}'));
        return serverLead;
      } catch (e) {
        // If server fails, save locally
        final localLead = Lead.fromJson(leadData);
        await _offlineStorage.saveLead(localLead);
        return localLead;
      }
    } catch (e) {
      if (kDebugMode) {
        print('Failed to capture Google lead: $e');
      }
      rethrow;
    }
  }

  /// Parse Meta lead data into standardized format
  Map<String, dynamic> _parseMetaLeadData(Map<String, dynamic> metaData) {
    // Extract common fields from Meta lead form
    final fieldData = metaData['field_data'] as List<dynamic>? ?? [];
    
    String? name;
    String? phone;
    String? email;
    
    for (final field in fieldData) {
      final fieldMap = field as Map<String, dynamic>;
      final fieldName = fieldMap['name'] as String?;
      final values = fieldMap['values'] as List<dynamic>? ?? [];
      
      if (values.isNotEmpty) {
        final value = values.first as String;
        
        switch (fieldName?.toLowerCase()) {
          case 'full_name':
          case 'name':
            name = value;
            break;
          case 'phone_number':
          case 'phone':
            phone = value;
            break;
          case 'email':
            email = value;
            break;
        }
      }
    }

    return {
      'id': 'meta_${DateTime.now().millisecondsSinceEpoch}',
      'customerName': name ?? 'Unknown Customer',
      'customerPhone': phone,
      'customerEmail': email,
      'source': 'META',
      'sourceId': metaData['leadgen_id'] as String?,
      'status': 'NEW',
      'assignedTo': 'auto_assigned', // TODO: Implement auto-assignment logic
      'createdAt': DateTime.now().toIso8601String(),
      'metadata': {
        'campaign_id': metaData['campaign_id'],
        'campaign_name': metaData['campaign_name'],
        'ad_id': metaData['ad_id'],
        'ad_name': metaData['ad_name'],
        'form_id': metaData['form_id'],
        'form_name': metaData['form_name'],
        'platform': metaData['platform'],
        'created_time': metaData['created_time'],
      },
    };
  }

  /// Parse Google Ads lead data into standardized format
  Map<String, dynamic> _parseGoogleLeadData(Map<String, dynamic> googleData) {
    // Extract lead information from Google Ads lead extension
    final leadForm = googleData['lead_form_data'] as Map<String, dynamic>? ?? {};
    final userColumnData = leadForm['user_column_data'] as List<dynamic>? ?? [];
    
    String? name;
    String? phone;
    String? email;
    
    for (final column in userColumnData) {
      final columnMap = column as Map<String, dynamic>;
      final columnId = columnMap['column_id'] as String?;
      final stringValue = columnMap['string_value'] as String?;
      
      if (stringValue != null) {
        switch (columnId?.toLowerCase()) {
          case 'full_name':
          case 'first_name':
            name = stringValue;
            break;
          case 'phone_number':
          case 'phone':
            phone = stringValue;
            break;
          case 'email':
            email = stringValue;
            break;
        }
      }
    }

    return {
      'id': 'google_${DateTime.now().millisecondsSinceEpoch}',
      'customerName': name ?? 'Unknown Customer',
      'customerPhone': phone,
      'customerEmail': email,
      'source': 'GOOGLE',
      'sourceId': googleData['lead_id'] as String?,
      'status': 'NEW',
      'assignedTo': 'auto_assigned', // TODO: Implement auto-assignment logic
      'createdAt': DateTime.now().toIso8601String(),
      'metadata': {
        'campaign_id': googleData['campaign_id'],
        'campaign_name': googleData['campaign_name'],
        'ad_group_id': googleData['ad_group_id'],
        'ad_group_name': googleData['ad_group_name'],
        'keyword': googleData['keyword'],
        'gclid': googleData['gclid'],
        'created_time': googleData['created_time'],
      },
    };
  }

  /// Process webhook data from external sources
  Future<Lead?> processWebhookData(Map<String, dynamic> webhookData) async {
    try {
      final source = webhookData['source'] as String?;
      
      switch (source?.toUpperCase()) {
        case 'META':
        case 'FACEBOOK':
        case 'INSTAGRAM':
          return await captureMetaLead(webhookData['data'] as Map<String, dynamic>);
        case 'GOOGLE':
        case 'GOOGLE_ADS':
          return await captureGoogleLead(webhookData['data'] as Map<String, dynamic>);
        default:
          if (kDebugMode) {
            print('Unknown webhook source: $source');
          }
          return null;
      }
    } catch (e) {
      if (kDebugMode) {
        print('Failed to process webhook data: $e');
      }
      return null;
    }
  }

  /// Simulate receiving external lead data (for testing)
  Future<Lead> simulateExternalLead(String source) async {
    Map<String, dynamic> simulatedData;
    
    switch (source.toUpperCase()) {
      case 'META':
        simulatedData = {
          'leadgen_id': 'meta_${DateTime.now().millisecondsSinceEpoch}',
          'campaign_id': '123456789',
          'campaign_name': 'Steel Door Campaign',
          'ad_id': '987654321',
          'ad_name': 'Premium Steel Doors Ad',
          'form_id': '456789123',
          'form_name': 'Contact Form',
          'platform': 'facebook',
          'created_time': DateTime.now().toIso8601String(),
          'field_data': [
            {
              'name': 'full_name',
              'values': ['John Doe']
            },
            {
              'name': 'phone_number',
              'values': ['+91 9876543210']
            },
            {
              'name': 'email',
              'values': ['john.doe@example.com']
            }
          ]
        };
        return await captureMetaLead(simulatedData);
        
      case 'GOOGLE':
        simulatedData = {
          'lead_id': 'google_${DateTime.now().millisecondsSinceEpoch}',
          'campaign_id': '987654321',
          'campaign_name': 'Steel Windows Campaign',
          'ad_group_id': '123456789',
          'ad_group_name': 'Premium Windows',
          'keyword': 'steel windows kerala',
          'gclid': 'CjwKCAjw...',
          'created_time': DateTime.now().toIso8601String(),
          'lead_form_data': {
            'user_column_data': [
              {
                'column_id': 'full_name',
                'string_value': 'Jane Smith'
              },
              {
                'column_id': 'phone_number',
                'string_value': '+91 8765432109'
              },
              {
                'column_id': 'email',
                'string_value': 'jane.smith@example.com'
              }
            ]
          }
        };
        return await captureGoogleLead(simulatedData);
        
      default:
        throw ArgumentError('Unsupported source: $source');
    }
  }
}
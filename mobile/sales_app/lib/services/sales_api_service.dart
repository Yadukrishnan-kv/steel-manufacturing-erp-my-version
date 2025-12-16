import 'package:dio/dio.dart';
import 'package:shared/shared.dart';
import '../models/lead.dart';
import '../models/measurement.dart';
import '../models/estimate.dart';
import '../models/customer_interaction.dart';

class SalesApiService {
  final ApiClient _apiClient;

  SalesApiService(this._apiClient);

  // Lead API operations
  Future<List<Lead>> getLeads({
    String? status,
    String? source,
    int? limit,
    int? offset,
  }) async {
    final queryParams = <String, dynamic>{};
    if (status != null) queryParams['status'] = status;
    if (source != null) queryParams['source'] = source;
    if (limit != null) queryParams['limit'] = limit;
    if (offset != null) queryParams['offset'] = offset;

    final response = await _apiClient.get('/api/sales/leads');
    final data = response.data?['data'] as List<dynamic>? ?? [];
    return data.map((json) => Lead.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<Lead> createLead(Lead lead) async {
    final response = await _apiClient.post('/api/sales/leads', lead.toJson());
    return Lead.fromJson(response.data?['data'] as Map<String, dynamic>);
  }

  Future<Lead> updateLead(String id, Lead lead) async {
    final response = await _apiClient.put('/api/sales/leads/$id', lead.toJson());
    return Lead.fromJson(response.data?['data'] as Map<String, dynamic>);
  }

  Future<void> deleteLead(String id) async {
    await _apiClient.delete('/api/sales/leads/$id');
  }

  // External lead capture
  Future<Lead> captureExternalLead(Map<String, dynamic> leadData) async {
    final response = await _apiClient.post('/api/sales/leads/external', leadData);
    return Lead.fromJson(response.data?['data'] as Map<String, dynamic>);
  }

  // Measurement API operations
  Future<List<SiteMeasurement>> getMeasurements({String? leadId}) async {
    final path = leadId != null 
        ? '/api/sales/measurements?leadId=$leadId'
        : '/api/sales/measurements';
    
    final response = await _apiClient.get(path);
    final data = response.data?['data'] as List<dynamic>? ?? [];
    return data.map((json) => SiteMeasurement.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<SiteMeasurement> createMeasurement(SiteMeasurement measurement) async {
    final response = await _apiClient.post('/api/sales/measurements', measurement.toJson());
    return SiteMeasurement.fromJson(response.data?['data'] as Map<String, dynamic>);
  }

  Future<SiteMeasurement> updateMeasurement(String id, SiteMeasurement measurement) async {
    final response = await _apiClient.put('/api/sales/measurements/$id', measurement.toJson());
    return SiteMeasurement.fromJson(response.data?['data'] as Map<String, dynamic>);
  }

  // Estimate API operations
  Future<List<Estimate>> getEstimates({String? leadId, String? status}) async {
    final queryParams = <String, String>{};
    if (leadId != null) queryParams['leadId'] = leadId;
    if (status != null) queryParams['status'] = status;
    
    final queryString = queryParams.entries
        .map((e) => '${e.key}=${e.value}')
        .join('&');
    
    final path = queryString.isNotEmpty 
        ? '/api/sales/estimates?$queryString'
        : '/api/sales/estimates';
    
    final response = await _apiClient.get(path);
    final data = response.data?['data'] as List<dynamic>? ?? [];
    return data.map((json) => Estimate.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<Estimate> createEstimate(Estimate estimate) async {
    final response = await _apiClient.post('/api/sales/estimates', estimate.toJson());
    return Estimate.fromJson(response.data?['data'] as Map<String, dynamic>);
  }

  Future<Estimate> updateEstimate(String id, Estimate estimate) async {
    final response = await _apiClient.put('/api/sales/estimates/$id', estimate.toJson());
    return Estimate.fromJson(response.data?['data'] as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> calculateEstimate(Map<String, dynamic> specifications) async {
    final response = await _apiClient.post('/api/sales/estimates/calculate', specifications);
    return response.data?['data'] as Map<String, dynamic> ?? {};
  }

  Future<Estimate> requestDiscountApproval(String estimateId, double discountPercentage) async {
    final response = await _apiClient.post('/api/sales/estimates/$estimateId/discount-approval', {
      'discountPercentage': discountPercentage,
    });
    return Estimate.fromJson(response.data?['data'] as Map<String, dynamic>);
  }

  // Customer Interaction API operations
  Future<List<CustomerInteraction>> getInteractions({String? leadId}) async {
    final path = leadId != null 
        ? '/api/sales/interactions?leadId=$leadId'
        : '/api/sales/interactions';
    
    final response = await _apiClient.get(path);
    final data = response.data?['data'] as List<dynamic>? ?? [];
    return data.map((json) => CustomerInteraction.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<CustomerInteraction> createInteraction(CustomerInteraction interaction) async {
    final response = await _apiClient.post('/api/sales/interactions', interaction.toJson());
    return CustomerInteraction.fromJson(response.data?['data'] as Map<String, dynamic>);
  }

  Future<CustomerInteraction> updateInteraction(String id, CustomerInteraction interaction) async {
    final response = await _apiClient.put('/api/sales/interactions/$id', interaction.toJson());
    return CustomerInteraction.fromJson(response.data?['data'] as Map<String, dynamic>);
  }

  // File upload for photos
  Future<String> uploadPhoto(String filePath) async {
    // For now, return a placeholder URL
    // In a real implementation, this would upload the file to the server
    return 'https://example.com/photos/${DateTime.now().millisecondsSinceEpoch}.jpg';
  }

  // Sync operations
  Future<void> syncOfflineData(Map<String, dynamic> offlineData) async {
    await _apiClient.post('/api/sales/sync', offlineData);
  }

  // Dashboard data
  Future<Map<String, dynamic>> getDashboardData() async {
    final response = await _apiClient.get('/api/sales/dashboard');
    return response.data?['data'] as Map<String, dynamic> ?? {};
  }
}
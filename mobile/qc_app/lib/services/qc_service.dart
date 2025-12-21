import 'package:dio/dio.dart';
import 'dart:developer' as developer;

class QCService {
  final Dio _dio;

  QCService(this._dio);

  Future<List<Map<String, dynamic>>> getQCChecklists() async {
    try {
      final response = await _dio.get('/qc/inspections');
      if (response.statusCode == 200) {
        final responseData = response.data;
        if (responseData != null) {
          final data = responseData['data'];
          if (data is List) {
            return List<Map<String, dynamic>>.from(data);
          }
        }
        return [];
      }
    } on DioException catch (e) {
      developer.log('QC checklists DioException: ${e.message}', name: 'QCService');
      developer.log('Response data: ${e.response?.data}', name: 'QCService');
      throw Exception('Failed to load QC checklists: ${e.response?.data ?? e.message}');
    } catch (e) {
      developer.log('QC checklists general exception: $e', name: 'QCService');
      throw Exception('Failed to load QC checklists: $e');
    }
    return [];
  }

  Future<List<Map<String, dynamic>>> getQCHistory() async {
    try {
      final response = await _dio.get('/qc/inspections');
      if (response.statusCode == 200) {
        final responseData = response.data;
        if (responseData != null) {
          final data = responseData['data'];
          if (data is List) {
            return List<Map<String, dynamic>>.from(data);
          }
        }
        return [];
      }
    } on DioException catch (e) {
      developer.log('QC history DioException: ${e.message}', name: 'QCService');
      developer.log('Response data: ${e.response?.data}', name: 'QCService');
      throw Exception('Failed to load QC history: ${e.response?.data ?? e.message}');
    } catch (e) {
      developer.log('QC history general exception: $e', name: 'QCService');
      throw Exception('Failed to load QC history: $e');
    }
    return [];
  }

  Future<Map<String, dynamic>> submitQCChecklist(Map<String, dynamic> checklistData) async {
    try {
      final response = await _dio.post('/qc/inspections', data: checklistData);
      if (response.statusCode == 200 || response.statusCode == 201) {
        final responseData = response.data;
        if (responseData != null) {
          return (responseData['data'] as Map<String, dynamic>?) ?? responseData as Map<String, dynamic>;
        }
        return {};
      }
    } on DioException catch (e) {
      developer.log('Submit QC checklist DioException: ${e.message}', name: 'QCService');
      developer.log('Response data: ${e.response?.data}', name: 'QCService');
      throw Exception('Failed to submit QC checklist: ${e.response?.data ?? e.message}');
    } catch (e) {
      developer.log('Submit QC checklist general exception: $e', name: 'QCService');
      throw Exception('Failed to submit QC checklist: $e');
    }
    throw Exception('Failed to submit QC checklist');
  }

  Future<Map<String, dynamic>> getDashboardStats() async {
    try {
      final response = await _dio.get('/qc/dashboard');
      if (response.statusCode == 200) {
        final data = response.data;
        if (data != null) {
          return (data['data'] as Map<String, dynamic>?) ?? data as Map<String, dynamic>;
        }
      }
    } on DioException catch (e) {
      developer.log('Dashboard stats DioException: ${e.message}', name: 'QCService');
      developer.log('Response data: ${e.response?.data}', name: 'QCService');
      developer.log('Status code: ${e.response?.statusCode}', name: 'QCService');
      throw Exception('Failed to load dashboard stats: ${e.response?.data ?? e.message}');
    } catch (e) {
      developer.log('Dashboard stats general exception: $e', name: 'QCService');
      throw Exception('Failed to load dashboard stats: $e');
    }
    return {};
  }
}
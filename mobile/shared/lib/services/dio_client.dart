import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../utils/storage_service.dart';

class DioClient {
  static const String _baseUrl = 'http://localhost:3000';
  late final Dio _dio;
  final StorageService _storageService;

  DioClient(this._storageService) {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _setupInterceptors();
  }

  Dio get dio => _dio;

  void _setupInterceptors() {
    // Request interceptor to add auth token
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storageService.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          // Handle 401 unauthorized errors
          if (error.response?.statusCode == 401) {
            await _storageService.clearToken();
            // Navigate to login screen
          }
          handler.next(error);
        },
      ),
    );

    // Logging interceptor for debug mode
    if (kDebugMode) {
      _dio.interceptors.add(
        LogInterceptor(
          requestBody: true,
          responseBody: true,
          requestHeader: true,
          responseHeader: false,
          error: true,
        ),
      );
    }
  }

  void updateBaseUrl(String newBaseUrl) {
    _dio.options.baseUrl = newBaseUrl;
  }
}
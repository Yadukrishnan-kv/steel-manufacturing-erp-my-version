import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:developer' as developer;

class AuthService {
  final Dio _dio;
  final SharedPreferences _prefs;
  
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';

  AuthService(this._dio, this._prefs);

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final responseData = response.data;
        if (responseData != null && responseData['data'] != null) {
          final data = responseData['data'];
          final tokens = data['tokens'];
          final user = data['user'];
          
          if (tokens != null && tokens['accessToken'] != null) {
            final token = tokens['accessToken'] as String;
            
            // Store token and user data
            await _prefs.setString(_tokenKey, token);
            if (user != null) {
              await _prefs.setString(_userKey, user.toString());
            }

            // Set authorization header for future requests
            _dio.options.headers['Authorization'] = 'Bearer $token';

            return {
              'success': true,
              'token': token,
              'user': user,
            };
          }
        }
        
        return {
          'success': false,
          'message': 'Invalid response format from server',
        };
      }
    } on DioException catch (e) {
      developer.log('Login DioException: ${e.message}', name: 'AuthService');
      developer.log('Response data: ${e.response?.data}', name: 'AuthService');
      developer.log('Status code: ${e.response?.statusCode}', name: 'AuthService');
      
      if (e.response?.statusCode == 401) {
        return {
          'success': false,
          'message': 'Invalid username or password',
        };
      }
      return {
        'success': false,
        'message': 'Login failed: ${e.message}',
      };
    } catch (e) {
      developer.log('Login general exception: $e', name: 'AuthService');
      return {
        'success': false,
        'message': 'An error occurred: $e',
      };
    }

    return {
      'success': false,
      'message': 'Login failed',
    };
  }

  Future<bool> isLoggedIn() async {
    final token = _prefs.getString(_tokenKey);
    if (token != null) {
      _dio.options.headers['Authorization'] = 'Bearer $token';
      return true;
    }
    return false;
  }

  Future<void> logout() async {
    await _prefs.remove(_tokenKey);
    await _prefs.remove(_userKey);
    _dio.options.headers.remove('Authorization');
  }

  String? getToken() {
    return _prefs.getString(_tokenKey);
  }

  String? getUserData() {
    return _prefs.getString(_userKey);
  }
}
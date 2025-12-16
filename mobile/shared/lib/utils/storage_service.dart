import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';

class StorageService {
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';
  static const String _offlineDataKey = 'offline_data';

  late final SharedPreferences _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // Token management
  Future<void> saveToken(String token) async {
    await _prefs.setString(_tokenKey, token);
  }

  Future<String?> getToken() async {
    return _prefs.getString(_tokenKey);
  }

  Future<void> clearToken() async {
    await _prefs.remove(_tokenKey);
  }

  // User data management
  Future<void> saveUser(User user) async {
    final userJson = jsonEncode(user.toJson());
    await _prefs.setString(_userKey, userJson);
  }

  Future<User?> getUser() async {
    final userJson = _prefs.getString(_userKey);
    if (userJson != null) {
      final userMap = jsonDecode(userJson) as Map<String, dynamic>;
      return User.fromJson(userMap);
    }
    return null;
  }

  Future<void> clearUser() async {
    await _prefs.remove(_userKey);
  }

  // Offline data management
  Future<void> saveOfflineData(String key, Map<String, dynamic> data) async {
    final offlineData = await getOfflineData();
    offlineData[key] = data;
    final dataJson = jsonEncode(offlineData);
    await _prefs.setString(_offlineDataKey, dataJson);
  }

  Future<Map<String, dynamic>> getOfflineData() async {
    final dataJson = _prefs.getString(_offlineDataKey);
    if (dataJson != null) {
      return Map<String, dynamic>.from(jsonDecode(dataJson));
    }
    return {};
  }

  Future<void> clearOfflineData() async {
    await _prefs.remove(_offlineDataKey);
  }

  // Clear all data
  Future<void> clearAll() async {
    await _prefs.clear();
  }
}
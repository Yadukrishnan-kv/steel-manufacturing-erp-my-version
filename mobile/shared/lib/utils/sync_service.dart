import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'storage_service.dart';
import 'connectivity_service.dart';
import '../services/api_client.dart';

class SyncService {
  static final SyncService _instance = SyncService._internal();
  factory SyncService() => _instance;
  SyncService._internal();

  final StorageService _storageService = StorageService();
  final ConnectivityService _connectivityService = ConnectivityService();
  late ApiClient _apiClient;

  Timer? _syncTimer;
  bool _isSyncing = false;

  void init(ApiClient apiClient) {
    _apiClient = apiClient;
    
    // Listen for connectivity changes
    _connectivityService.connectionStatus.listen((isConnected) {
      if (isConnected && !_isSyncing) {
        _startSync();
      }
    });

    // Start periodic sync when connected
    if (_connectivityService.isConnected) {
      _startPeriodicSync();
    }
  }

  void _startPeriodicSync() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(const Duration(minutes: 5), (_) {
      if (_connectivityService.isConnected && !_isSyncing) {
        _startSync();
      }
    });
  }

  Future<void> _startSync() async {
    if (_isSyncing) return;
    
    _isSyncing = true;
    try {
      await _syncOfflineData();
    } catch (e) {
      if (kDebugMode) {
        print('Sync error: $e');
      }
    } finally {
      _isSyncing = false;
    }
  }

  Future<void> _syncOfflineData() async {
    final offlineData = await _storageService.getOfflineData();
    
    for (final entry in offlineData.entries) {
      try {
        final data = entry.value as Map<String, dynamic>;
        final method = data['method'] as String;
        final path = data['path'] as String;
        final body = data['body'] as Map<String, dynamic>?;

        switch (method.toUpperCase()) {
          case 'POST':
            await _apiClient.post(path, body ?? {});
            break;
          case 'PUT':
            await _apiClient.put(path, body ?? {});
            break;
          case 'DELETE':
            await _apiClient.delete(path);
            break;
        }

        // Remove synced data
        await _removeOfflineEntry(entry.key);
      } catch (e) {
        if (kDebugMode) {
          print('Failed to sync ${entry.key}: $e');
        }
      }
    }
  }

  Future<void> _removeOfflineEntry(String key) async {
    final offlineData = await _storageService.getOfflineData();
    offlineData.remove(key);
    final dataJson = jsonEncode(offlineData);
    await _storageService._prefs.setString('offline_data', dataJson);
  }

  Future<void> addOfflineOperation({
    required String method,
    required String path,
    Map<String, dynamic>? body,
  }) async {
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final key = '${method}_${path}_$timestamp';
    
    await _storageService.saveOfflineData(key, {
      'method': method,
      'path': path,
      'body': body,
      'timestamp': timestamp,
    });
  }

  void dispose() {
    _syncTimer?.cancel();
  }
}
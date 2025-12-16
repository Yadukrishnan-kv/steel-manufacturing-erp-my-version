import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared/shared.dart';
import 'offline_storage_service.dart';
import 'sales_api_service.dart';
import '../models/lead.dart';
import '../models/measurement.dart';
import '../models/estimate.dart';
import '../models/customer_interaction.dart';

class SalesSyncService {
  static final SalesSyncService _instance = SalesSyncService._internal();
  factory SalesSyncService() => _instance;
  SalesSyncService._internal();

  final OfflineStorageService _offlineStorage = OfflineStorageService();
  final ConnectivityService _connectivityService = ConnectivityService();
  late SalesApiService _apiService;

  Timer? _syncTimer;
  bool _isSyncing = false;
  final StreamController<SyncStatus> _syncStatusController = StreamController<SyncStatus>.broadcast();

  Stream<SyncStatus> get syncStatus => _syncStatusController.stream;

  void init(SalesApiService apiService) {
    _apiService = apiService;
    
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
    _syncTimer = Timer.periodic(const Duration(minutes: 2), (_) {
      if (_connectivityService.isConnected && !_isSyncing) {
        _startSync();
      }
    });
  }

  Future<void> _startSync() async {
    if (_isSyncing) return;
    
    _isSyncing = true;
    _syncStatusController.add(SyncStatus.syncing);
    
    try {
      await _syncAllData();
      _syncStatusController.add(SyncStatus.success);
    } catch (e) {
      if (kDebugMode) {
        print('Sync error: $e');
      }
      _syncStatusController.add(SyncStatus.error);
    } finally {
      _isSyncing = false;
    }
  }

  Future<void> _syncAllData() async {
    // Sync leads
    await _syncLeads();
    
    // Sync measurements
    await _syncMeasurements();
    
    // Sync estimates
    await _syncEstimates();
    
    // Sync interactions
    await _syncInteractions();
    
    // Process sync queue
    await _processSyncQueue();
  }

  Future<void> _syncLeads() async {
    try {
      // Upload unsynced leads
      final unsyncedLeads = await _offlineStorage.getUnsyncedLeads();
      for (final lead in unsyncedLeads) {
        try {
          final serverLead = await _apiService.createLead(lead);
          // Update local storage with server ID
          await _offlineStorage.deleteLead(lead.id);
          await _offlineStorage.saveLead(serverLead.copyWith(id: 'server_${serverLead.id}'));
        } catch (e) {
          if (kDebugMode) {
            print('Failed to sync lead ${lead.id}: $e');
          }
        }
      }

      // Download latest leads from server
      final serverLeads = await _apiService.getLeads(limit: 50);
      for (final lead in serverLeads) {
        await _offlineStorage.saveLead(lead.copyWith(id: 'server_${lead.id}'));
      }
    } catch (e) {
      if (kDebugMode) {
        print('Failed to sync leads: $e');
      }
    }
  }

  Future<void> _syncMeasurements() async {
    try {
      final unsyncedMeasurements = await _offlineStorage.getUnsyncedMeasurements();
      for (final measurement in unsyncedMeasurements) {
        try {
          final serverMeasurement = await _apiService.createMeasurement(measurement);
          await _offlineStorage.saveMeasurement(
            serverMeasurement.copyWith(isSynced: true)
          );
        } catch (e) {
          if (kDebugMode) {
            print('Failed to sync measurement ${measurement.id}: $e');
          }
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('Failed to sync measurements: $e');
      }
    }
  }

  Future<void> _syncEstimates() async {
    try {
      final unsyncedEstimates = await _offlineStorage.getUnsyncedEstimates();
      for (final estimate in unsyncedEstimates) {
        try {
          final serverEstimate = await _apiService.createEstimate(estimate);
          await _offlineStorage.saveEstimate(
            serverEstimate.copyWith(isSynced: true)
          );
        } catch (e) {
          if (kDebugMode) {
            print('Failed to sync estimate ${estimate.id}: $e');
          }
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('Failed to sync estimates: $e');
      }
    }
  }

  Future<void> _syncInteractions() async {
    try {
      final unsyncedInteractions = await _offlineStorage.getUnsyncedInteractions();
      for (final interaction in unsyncedInteractions) {
        try {
          final serverInteraction = await _apiService.createInteraction(interaction);
          await _offlineStorage.saveInteraction(
            serverInteraction.copyWith(isSynced: true)
          );
        } catch (e) {
          if (kDebugMode) {
            print('Failed to sync interaction ${interaction.id}: $e');
          }
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('Failed to sync interactions: $e');
      }
    }
  }

  Future<void> _processSyncQueue() async {
    try {
      final syncQueue = await _offlineStorage.getSyncQueue();
      
      for (final entry in syncQueue.entries) {
        try {
          final operation = entry.value['operation'] as String;
          final data = entry.value['data'] as Map<String, dynamic>;

          switch (operation) {
            case 'update_lead':
              await _apiService.updateLead(data['id'], Lead.fromJson(data));
              break;
            case 'update_measurement':
              await _apiService.updateMeasurement(data['id'], SiteMeasurement.fromJson(data));
              break;
            case 'update_estimate':
              await _apiService.updateEstimate(data['id'], Estimate.fromJson(data));
              break;
            case 'update_interaction':
              await _apiService.updateInteraction(data['id'], CustomerInteraction.fromJson(data));
              break;
          }

          // Remove processed item from queue
          await _offlineStorage.removeFromSyncQueue(entry.key);
        } catch (e) {
          if (kDebugMode) {
            print('Failed to process sync queue item ${entry.key}: $e');
          }
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('Failed to process sync queue: $e');
      }
    }
  }

  Future<void> forcSync() async {
    if (_connectivityService.isConnected) {
      await _startSync();
    }
  }

  Future<void> addToSyncQueue(String operation, Map<String, dynamic> data) async {
    await _offlineStorage.addToSyncQueue(operation, data);
  }

  void dispose() {
    _syncTimer?.cancel();
    _syncStatusController.close();
  }
}

enum SyncStatus {
  idle,
  syncing,
  success,
  error,
}
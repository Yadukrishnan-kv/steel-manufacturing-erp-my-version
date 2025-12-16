import 'dart:convert';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/lead.dart';
import '../models/measurement.dart';
import '../models/estimate.dart';
import '../models/customer_interaction.dart';

class OfflineStorageService {
  static const String _leadsBoxName = 'leads';
  static const String _measurementsBoxName = 'measurements';
  static const String _estimatesBoxName = 'estimates';
  static const String _interactionsBoxName = 'interactions';
  static const String _syncQueueBoxName = 'sync_queue';

  late Box<String> _leadsBox;
  late Box<String> _measurementsBox;
  late Box<String> _estimatesBox;
  late Box<String> _interactionsBox;
  late Box<String> _syncQueueBox;

  Future<void> init() async {
    _leadsBox = await Hive.openBox<String>(_leadsBoxName);
    _measurementsBox = await Hive.openBox<String>(_measurementsBoxName);
    _estimatesBox = await Hive.openBox<String>(_estimatesBoxName);
    _interactionsBox = await Hive.openBox<String>(_interactionsBoxName);
    _syncQueueBox = await Hive.openBox<String>(_syncQueueBoxName);
  }

  // Lead operations
  Future<void> saveLead(Lead lead) async {
    final leadJson = jsonEncode(lead.toJson());
    await _leadsBox.put(lead.id, leadJson);
  }

  Future<Lead?> getLead(String id) async {
    final leadJson = _leadsBox.get(id);
    if (leadJson != null) {
      final leadMap = jsonDecode(leadJson) as Map<String, dynamic>;
      return Lead.fromJson(leadMap);
    }
    return null;
  }

  Future<List<Lead>> getAllLeads() async {
    final leads = <Lead>[];
    for (final leadJson in _leadsBox.values) {
      final leadMap = jsonDecode(leadJson) as Map<String, dynamic>;
      leads.add(Lead.fromJson(leadMap));
    }
    return leads;
  }

  Future<void> deleteLead(String id) async {
    await _leadsBox.delete(id);
  }

  // Measurement operations
  Future<void> saveMeasurement(SiteMeasurement measurement) async {
    final measurementJson = jsonEncode(measurement.toJson());
    await _measurementsBox.put(measurement.id, measurementJson);
  }

  Future<SiteMeasurement?> getMeasurement(String id) async {
    final measurementJson = _measurementsBox.get(id);
    if (measurementJson != null) {
      final measurementMap = jsonDecode(measurementJson) as Map<String, dynamic>;
      return SiteMeasurement.fromJson(measurementMap);
    }
    return null;
  }

  Future<List<SiteMeasurement>> getMeasurementsByLead(String leadId) async {
    final measurements = <SiteMeasurement>[];
    for (final measurementJson in _measurementsBox.values) {
      final measurementMap = jsonDecode(measurementJson) as Map<String, dynamic>;
      final measurement = SiteMeasurement.fromJson(measurementMap);
      if (measurement.leadId == leadId) {
        measurements.add(measurement);
      }
    }
    return measurements;
  }

  Future<List<SiteMeasurement>> getAllMeasurements() async {
    final measurements = <SiteMeasurement>[];
    for (final measurementJson in _measurementsBox.values) {
      final measurementMap = jsonDecode(measurementJson) as Map<String, dynamic>;
      measurements.add(SiteMeasurement.fromJson(measurementMap));
    }
    return measurements;
  }

  // Estimate operations
  Future<void> saveEstimate(Estimate estimate) async {
    final estimateJson = jsonEncode(estimate.toJson());
    await _estimatesBox.put(estimate.id, estimateJson);
  }

  Future<Estimate?> getEstimate(String id) async {
    final estimateJson = _estimatesBox.get(id);
    if (estimateJson != null) {
      final estimateMap = jsonDecode(estimateJson) as Map<String, dynamic>;
      return Estimate.fromJson(estimateMap);
    }
    return null;
  }

  Future<List<Estimate>> getEstimatesByLead(String leadId) async {
    final estimates = <Estimate>[];
    for (final estimateJson in _estimatesBox.values) {
      final estimateMap = jsonDecode(estimateJson) as Map<String, dynamic>;
      final estimate = Estimate.fromJson(estimateMap);
      if (estimate.leadId == leadId) {
        estimates.add(estimate);
      }
    }
    return estimates;
  }

  Future<List<Estimate>> getAllEstimates() async {
    final estimates = <Estimate>[];
    for (final estimateJson in _estimatesBox.values) {
      final estimateMap = jsonDecode(estimateJson) as Map<String, dynamic>;
      estimates.add(Estimate.fromJson(estimateMap));
    }
    return estimates;
  }

  // Customer Interaction operations
  Future<void> saveInteraction(CustomerInteraction interaction) async {
    final interactionJson = jsonEncode(interaction.toJson());
    await _interactionsBox.put(interaction.id, interactionJson);
  }

  Future<List<CustomerInteraction>> getInteractionsByLead(String leadId) async {
    final interactions = <CustomerInteraction>[];
    for (final interactionJson in _interactionsBox.values) {
      final interactionMap = jsonDecode(interactionJson) as Map<String, dynamic>;
      final interaction = CustomerInteraction.fromJson(interactionMap);
      if (interaction.leadId == leadId) {
        interactions.add(interaction);
      }
    }
    return interactions;
  }

  Future<List<CustomerInteraction>> getAllInteractions() async {
    final interactions = <CustomerInteraction>[];
    for (final interactionJson in _interactionsBox.values) {
      final interactionMap = jsonDecode(interactionJson) as Map<String, dynamic>;
      interactions.add(CustomerInteraction.fromJson(interactionMap));
    }
    return interactions;
  }

  // Sync queue operations
  Future<void> addToSyncQueue(String operation, Map<String, dynamic> data) async {
    final queueItem = {
      'operation': operation,
      'data': data,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };
    final key = '${operation}_${DateTime.now().millisecondsSinceEpoch}';
    await _syncQueueBox.put(key, jsonEncode(queueItem));
  }

  Future<Map<String, Map<String, dynamic>>> getSyncQueue() async {
    final queue = <String, Map<String, dynamic>>{};
    for (final entry in _syncQueueBox.toMap().entries) {
      final queueItem = jsonDecode(entry.value) as Map<String, dynamic>;
      queue[entry.key] = queueItem;
    }
    return queue;
  }

  Future<void> removeFromSyncQueue(String key) async {
    await _syncQueueBox.delete(key);
  }

  Future<void> clearSyncQueue() async {
    await _syncQueueBox.clear();
  }

  // Get unsynced items
  Future<List<Lead>> getUnsyncedLeads() async {
    final leads = await getAllLeads();
    return leads.where((lead) => !lead.id.startsWith('server_')).toList();
  }

  Future<List<SiteMeasurement>> getUnsyncedMeasurements() async {
    final measurements = await getAllMeasurements();
    return measurements.where((measurement) => !measurement.isSynced).toList();
  }

  Future<List<Estimate>> getUnsyncedEstimates() async {
    final estimates = await getAllEstimates();
    return estimates.where((estimate) => !estimate.isSynced).toList();
  }

  Future<List<CustomerInteraction>> getUnsyncedInteractions() async {
    final interactions = await getAllInteractions();
    return interactions.where((interaction) => !interaction.isSynced).toList();
  }

  // Clear all data
  Future<void> clearAllData() async {
    await _leadsBox.clear();
    await _measurementsBox.clear();
    await _estimatesBox.clear();
    await _interactionsBox.clear();
    await _syncQueueBox.clear();
  }
}
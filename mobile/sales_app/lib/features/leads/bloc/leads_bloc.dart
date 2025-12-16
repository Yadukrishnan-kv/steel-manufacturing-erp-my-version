import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../models/lead.dart';
import '../../../services/offline_storage_service.dart';
import '../../../services/sales_api_service.dart';
import '../../../services/sync_service.dart';

// Events
abstract class LeadsEvent extends Equatable {
  const LeadsEvent();

  @override
  List<Object?> get props => [];
}

class LoadLeads extends LeadsEvent {}

class CreateLead extends LeadsEvent {
  final Lead lead;

  const CreateLead(this.lead);

  @override
  List<Object?> get props => [lead];
}

class UpdateLead extends LeadsEvent {
  final Lead lead;

  const UpdateLead(this.lead);

  @override
  List<Object?> get props => [lead];
}

class DeleteLead extends LeadsEvent {
  final String leadId;

  const DeleteLead(this.leadId);

  @override
  List<Object?> get props => [leadId];
}

class FilterLeads extends LeadsEvent {
  final String? status;
  final String? source;

  const FilterLeads({this.status, this.source});

  @override
  List<Object?> get props => [status, source];
}

class SearchLeads extends LeadsEvent {
  final String query;

  const SearchLeads(this.query);

  @override
  List<Object?> get props => [query];
}

class CaptureExternalLead extends LeadsEvent {
  final Map<String, dynamic> leadData;

  const CaptureExternalLead(this.leadData);

  @override
  List<Object?> get props => [leadData];
}

// States
abstract class LeadsState extends Equatable {
  const LeadsState();

  @override
  List<Object?> get props => [];
}

class LeadsInitial extends LeadsState {}

class LeadsLoading extends LeadsState {}

class LeadsLoaded extends LeadsState {
  final List<Lead> leads;
  final List<Lead> filteredLeads;
  final String? currentFilter;
  final String? currentSearch;

  const LeadsLoaded({
    required this.leads,
    required this.filteredLeads,
    this.currentFilter,
    this.currentSearch,
  });

  @override
  List<Object?> get props => [leads, filteredLeads, currentFilter, currentSearch];
}

class LeadsError extends LeadsState {
  final String message;

  const LeadsError(this.message);

  @override
  List<Object?> get props => [message];
}

class LeadCreated extends LeadsState {
  final Lead lead;

  const LeadCreated(this.lead);

  @override
  List<Object?> get props => [lead];
}

class LeadUpdated extends LeadsState {
  final Lead lead;

  const LeadUpdated(this.lead);

  @override
  List<Object?> get props => [lead];
}

// Bloc
class LeadsBloc extends Bloc<LeadsEvent, LeadsState> {
  final OfflineStorageService _offlineStorage;
  final SalesApiService _apiService;
  final SalesSyncService _syncService;

  LeadsBloc({
    required OfflineStorageService offlineStorage,
    required SalesApiService apiService,
    required SalesSyncService syncService,
  })  : _offlineStorage = offlineStorage,
        _apiService = apiService,
        _syncService = syncService,
        super(LeadsInitial()) {
    on<LoadLeads>(_onLoadLeads);
    on<CreateLead>(_onCreateLead);
    on<UpdateLead>(_onUpdateLead);
    on<DeleteLead>(_onDeleteLead);
    on<FilterLeads>(_onFilterLeads);
    on<SearchLeads>(_onSearchLeads);
    on<CaptureExternalLead>(_onCaptureExternalLead);
  }

  Future<void> _onLoadLeads(LoadLeads event, Emitter<LeadsState> emit) async {
    emit(LeadsLoading());
    
    try {
      // Load from offline storage first
      final leads = await _offlineStorage.getAllLeads();
      emit(LeadsLoaded(
        leads: leads,
        filteredLeads: leads,
      ));

      // Try to sync with server if connected
      try {
        await _syncService.forcSync();
        final updatedLeads = await _offlineStorage.getAllLeads();
        emit(LeadsLoaded(
          leads: updatedLeads,
          filteredLeads: updatedLeads,
        ));
      } catch (e) {
        // Ignore sync errors, we have offline data
      }
    } catch (e) {
      emit(LeadsError('Failed to load leads: ${e.toString()}'));
    }
  }

  Future<void> _onCreateLead(CreateLead event, Emitter<LeadsState> emit) async {
    try {
      // Save to offline storage immediately
      await _offlineStorage.saveLead(event.lead);
      emit(LeadCreated(event.lead));

      // Add to sync queue for later upload
      await _syncService.addToSyncQueue('create_lead', event.lead.toJson());

      // Reload leads
      add(LoadLeads());
    } catch (e) {
      emit(LeadsError('Failed to create lead: ${e.toString()}'));
    }
  }

  Future<void> _onUpdateLead(UpdateLead event, Emitter<LeadsState> emit) async {
    try {
      // Update offline storage
      await _offlineStorage.saveLead(event.lead);
      emit(LeadUpdated(event.lead));

      // Add to sync queue
      await _syncService.addToSyncQueue('update_lead', event.lead.toJson());

      // Reload leads
      add(LoadLeads());
    } catch (e) {
      emit(LeadsError('Failed to update lead: ${e.toString()}'));
    }
  }

  Future<void> _onDeleteLead(DeleteLead event, Emitter<LeadsState> emit) async {
    try {
      await _offlineStorage.deleteLead(event.leadId);
      
      // Add to sync queue
      await _syncService.addToSyncQueue('delete_lead', {'id': event.leadId});

      // Reload leads
      add(LoadLeads());
    } catch (e) {
      emit(LeadsError('Failed to delete lead: ${e.toString()}'));
    }
  }

  Future<void> _onFilterLeads(FilterLeads event, Emitter<LeadsState> emit) async {
    if (state is LeadsLoaded) {
      final currentState = state as LeadsLoaded;
      final filteredLeads = _filterLeads(currentState.leads, event.status, event.source);
      
      emit(LeadsLoaded(
        leads: currentState.leads,
        filteredLeads: filteredLeads,
        currentFilter: event.status ?? event.source,
        currentSearch: currentState.currentSearch,
      ));
    }
  }

  Future<void> _onSearchLeads(SearchLeads event, Emitter<LeadsState> emit) async {
    if (state is LeadsLoaded) {
      final currentState = state as LeadsLoaded;
      final searchedLeads = _searchLeads(currentState.leads, event.query);
      
      emit(LeadsLoaded(
        leads: currentState.leads,
        filteredLeads: searchedLeads,
        currentFilter: currentState.currentFilter,
        currentSearch: event.query,
      ));
    }
  }

  Future<void> _onCaptureExternalLead(CaptureExternalLead event, Emitter<LeadsState> emit) async {
    try {
      // Create lead from external data
      final lead = Lead(
        id: 'local_${DateTime.now().millisecondsSinceEpoch}',
        customerName: event.leadData['name'] ?? 'Unknown',
        customerPhone: event.leadData['phone'],
        customerEmail: event.leadData['email'],
        source: event.leadData['source'] ?? 'EXTERNAL',
        sourceId: event.leadData['sourceId'],
        status: 'NEW',
        assignedTo: event.leadData['assignedTo'] ?? '',
        createdAt: DateTime.now(),
        metadata: event.leadData,
      );

      add(CreateLead(lead));
    } catch (e) {
      emit(LeadsError('Failed to capture external lead: ${e.toString()}'));
    }
  }

  List<Lead> _filterLeads(List<Lead> leads, String? status, String? source) {
    var filtered = leads;
    
    if (status != null && status.isNotEmpty) {
      filtered = filtered.where((lead) => lead.status == status).toList();
    }
    
    if (source != null && source.isNotEmpty) {
      filtered = filtered.where((lead) => lead.source == source).toList();
    }
    
    return filtered;
  }

  List<Lead> _searchLeads(List<Lead> leads, String query) {
    if (query.isEmpty) return leads;
    
    final lowercaseQuery = query.toLowerCase();
    return leads.where((lead) {
      return lead.customerName.toLowerCase().contains(lowercaseQuery) ||
             (lead.customerPhone?.toLowerCase().contains(lowercaseQuery) ?? false) ||
             (lead.customerEmail?.toLowerCase().contains(lowercaseQuery) ?? false) ||
             (lead.address?.toLowerCase().contains(lowercaseQuery) ?? false);
    }).toList();
  }
}
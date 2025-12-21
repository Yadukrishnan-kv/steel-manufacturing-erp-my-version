import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../models/customer_interaction.dart';
import '../../../services/offline_storage_service.dart';
import '../../../services/sales_api_service.dart';
import '../../../services/sync_service.dart';

// Events
abstract class InteractionsEvent extends Equatable {
  const InteractionsEvent();

  @override
  List<Object?> get props => [];
}

class LoadInteractions extends InteractionsEvent {
  final String? leadId;

  const LoadInteractions({this.leadId});

  @override
  List<Object?> get props => [leadId];
}

class CreateInteraction extends InteractionsEvent {
  final CustomerInteraction interaction;

  const CreateInteraction(this.interaction);

  @override
  List<Object?> get props => [interaction];
}

class UpdateInteraction extends InteractionsEvent {
  final CustomerInteraction interaction;

  const UpdateInteraction(this.interaction);

  @override
  List<Object?> get props => [interaction];
}

class CompleteInteraction extends InteractionsEvent {
  final String interactionId;
  final String outcome;
  final String? nextAction;
  final DateTime? nextFollowUp;

  const CompleteInteraction({
    required this.interactionId,
    required this.outcome,
    this.nextAction,
    this.nextFollowUp,
  });

  @override
  List<Object?> get props => [interactionId, outcome, nextAction, nextFollowUp];
}

// States
abstract class InteractionsState extends Equatable {
  const InteractionsState();

  @override
  List<Object?> get props => [];
}

class InteractionsInitial extends InteractionsState {}

class InteractionsLoading extends InteractionsState {}

class InteractionsLoaded extends InteractionsState {
  final List<CustomerInteraction> interactions;

  const InteractionsLoaded(this.interactions);

  @override
  List<Object?> get props => [interactions];
}

class InteractionsError extends InteractionsState {
  final String message;

  const InteractionsError(this.message);

  @override
  List<Object?> get props => [message];
}

class InteractionCreated extends InteractionsState {
  final CustomerInteraction interaction;

  const InteractionCreated(this.interaction);

  @override
  List<Object?> get props => [interaction];
}

class InteractionUpdated extends InteractionsState {
  final CustomerInteraction interaction;

  const InteractionUpdated(this.interaction);

  @override
  List<Object?> get props => [interaction];
}

class InteractionCompleted extends InteractionsState {
  final CustomerInteraction interaction;

  const InteractionCompleted(this.interaction);

  @override
  List<Object?> get props => [interaction];
}

// Bloc
class InteractionsBloc extends Bloc<InteractionsEvent, InteractionsState> {
  final OfflineStorageService _offlineStorage;
  final SalesApiService _apiService;
  final SalesSyncService _syncService;

  InteractionsBloc({
    required OfflineStorageService offlineStorage,
    required SalesApiService apiService,
    required SalesSyncService syncService,
  })  : _offlineStorage = offlineStorage,
        _apiService = apiService,
        _syncService = syncService,
        super(InteractionsInitial()) {
    on<LoadInteractions>(_onLoadInteractions);
    on<CreateInteraction>(_onCreateInteraction);
    on<UpdateInteraction>(_onUpdateInteraction);
    on<CompleteInteraction>(_onCompleteInteraction);
  }

  Future<void> _onLoadInteractions(LoadInteractions event, Emitter<InteractionsState> emit) async {
    emit(InteractionsLoading());
    
    try {
      List<CustomerInteraction> interactions;
      
      if (event.leadId != null) {
        interactions = await _offlineStorage.getInteractionsByLead(event.leadId!);
      } else {
        interactions = await _offlineStorage.getAllInteractions();
      }
      
      emit(InteractionsLoaded(interactions));

      // Try to sync with server if connected
      try {
        await _syncService.forcSync();
        
        if (event.leadId != null) {
          interactions = await _offlineStorage.getInteractionsByLead(event.leadId!);
        } else {
          interactions = await _offlineStorage.getAllInteractions();
        }
        
        emit(InteractionsLoaded(interactions));
      } catch (e) {
        // Ignore sync errors, we have offline data
      }
    } catch (e) {
      emit(InteractionsError('Failed to load interactions: ${e.toString()}'));
    }
  }

  Future<void> _onCreateInteraction(CreateInteraction event, Emitter<InteractionsState> emit) async {
    try {
      // Save to offline storage immediately
      await _offlineStorage.saveInteraction(event.interaction);
      emit(InteractionCreated(event.interaction));

      // Add to sync queue for later upload
      await _syncService.addToSyncQueue('create_interaction', event.interaction.toJson());

      // Reload interactions
      add(LoadInteractions(leadId: event.interaction.leadId));
    } catch (e) {
      emit(InteractionsError('Failed to create interaction: ${e.toString()}'));
    }
  }

  Future<void> _onUpdateInteraction(UpdateInteraction event, Emitter<InteractionsState> emit) async {
    try {
      // Update offline storage
      await _offlineStorage.saveInteraction(event.interaction);
      emit(InteractionUpdated(event.interaction));

      // Add to sync queue
      await _syncService.addToSyncQueue('update_interaction', event.interaction.toJson());

      // Reload interactions
      add(LoadInteractions(leadId: event.interaction.leadId));
    } catch (e) {
      emit(InteractionsError('Failed to update interaction: ${e.toString()}'));
    }
  }

  Future<void> _onCompleteInteraction(CompleteInteraction event, Emitter<InteractionsState> emit) async {
    try {
      // Get the existing interaction
      final interactions = await _offlineStorage.getAllInteractions();
      final interaction = interactions.firstWhere((i) => i.id == event.interactionId);
      
      final updatedInteraction = interaction.copyWith(
        status: 'COMPLETED',
        completedAt: DateTime.now(),
        outcome: event.outcome,
        nextAction: event.nextAction,
        nextFollowUp: event.nextFollowUp,
      );

      await _offlineStorage.saveInteraction(updatedInteraction);
      emit(InteractionCompleted(updatedInteraction));

      // Add to sync queue
      await _syncService.addToSyncQueue('update_interaction', updatedInteraction.toJson());

      // Reload interactions
      add(LoadInteractions(leadId: interaction.leadId));
    } catch (e) {
      emit(InteractionsError('Failed to complete interaction: ${e.toString()}'));
    }
  }
}
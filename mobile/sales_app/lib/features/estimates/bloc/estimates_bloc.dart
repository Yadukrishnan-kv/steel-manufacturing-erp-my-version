import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../models/estimate.dart';
import '../../../services/offline_storage_service.dart';
import '../../../services/sales_api_service.dart';
import '../../../services/sync_service.dart';

// Events
abstract class EstimatesEvent extends Equatable {
  const EstimatesEvent();

  @override
  List<Object?> get props => [];
}

class LoadEstimates extends EstimatesEvent {
  final String? leadId;

  const LoadEstimates({this.leadId});

  @override
  List<Object?> get props => [leadId];
}

class CreateEstimate extends EstimatesEvent {
  final Estimate estimate;

  const CreateEstimate(this.estimate);

  @override
  List<Object?> get props => [estimate];
}

class UpdateEstimate extends EstimatesEvent {
  final Estimate estimate;

  const UpdateEstimate(this.estimate);

  @override
  List<Object?> get props => [estimate];
}

class CalculateEstimate extends EstimatesEvent {
  final String productType;
  final double width;
  final double height;
  final String coatingType;
  final String hardwareType;
  final Map<String, dynamic> specifications;

  const CalculateEstimate({
    required this.productType,
    required this.width,
    required this.height,
    required this.coatingType,
    required this.hardwareType,
    required this.specifications,
  });

  @override
  List<Object?> get props => [productType, width, height, coatingType, hardwareType, specifications];
}

class RequestDiscountApproval extends EstimatesEvent {
  final String estimateId;
  final double discountPercentage;

  const RequestDiscountApproval({
    required this.estimateId,
    required this.discountPercentage,
  });

  @override
  List<Object?> get props => [estimateId, discountPercentage];
}

class ApplyDiscount extends EstimatesEvent {
  final String estimateId;
  final double discountPercentage;

  const ApplyDiscount({
    required this.estimateId,
    required this.discountPercentage,
  });

  @override
  List<Object?> get props => [estimateId, discountPercentage];
}

// States
abstract class EstimatesState extends Equatable {
  const EstimatesState();

  @override
  List<Object?> get props => [];
}

class EstimatesInitial extends EstimatesState {}

class EstimatesLoading extends EstimatesState {}

class EstimatesLoaded extends EstimatesState {
  final List<Estimate> estimates;

  const EstimatesLoaded(this.estimates);

  @override
  List<Object?> get props => [estimates];
}

class EstimatesError extends EstimatesState {
  final String message;

  const EstimatesError(this.message);

  @override
  List<Object?> get props => [message];
}

class EstimateCreated extends EstimatesState {
  final Estimate estimate;

  const EstimateCreated(this.estimate);

  @override
  List<Object?> get props => [estimate];
}

class EstimateUpdated extends EstimatesState {
  final Estimate estimate;

  const EstimateUpdated(this.estimate);

  @override
  List<Object?> get props => [estimate];
}

class EstimateCalculated extends EstimatesState {
  final Map<String, dynamic> calculation;

  const EstimateCalculated(this.calculation);

  @override
  List<Object?> get props => [calculation];
}

class DiscountApprovalRequested extends EstimatesState {
  final String estimateId;
  final double discountPercentage;

  const DiscountApprovalRequested({
    required this.estimateId,
    required this.discountPercentage,
  });

  @override
  List<Object?> get props => [estimateId, discountPercentage];
}

class DiscountApplied extends EstimatesState {
  final Estimate estimate;

  const DiscountApplied(this.estimate);

  @override
  List<Object?> get props => [estimate];
}

// Bloc
class EstimatesBloc extends Bloc<EstimatesEvent, EstimatesState> {
  final OfflineStorageService _offlineStorage;
  final SalesApiService _apiService;
  final SalesSyncService _syncService;

  EstimatesBloc({
    required OfflineStorageService offlineStorage,
    required SalesApiService apiService,
    required SalesSyncService syncService,
  })  : _offlineStorage = offlineStorage,
        _apiService = apiService,
        _syncService = syncService,
        super(EstimatesInitial()) {
    on<LoadEstimates>(_onLoadEstimates);
    on<CreateEstimate>(_onCreateEstimate);
    on<UpdateEstimate>(_onUpdateEstimate);
    on<CalculateEstimate>(_onCalculateEstimate);
    on<RequestDiscountApproval>(_onRequestDiscountApproval);
    on<ApplyDiscount>(_onApplyDiscount);
  }

  Future<void> _onLoadEstimates(LoadEstimates event, Emitter<EstimatesState> emit) async {
    emit(EstimatesLoading());
    
    try {
      List<Estimate> estimates;
      
      if (event.leadId != null) {
        estimates = await _offlineStorage.getEstimatesByLead(event.leadId!);
      } else {
        estimates = await _offlineStorage.getAllEstimates();
      }
      
      emit(EstimatesLoaded(estimates));

      // Try to sync with server if connected
      try {
        await _syncService.forcSync();
        
        if (event.leadId != null) {
          estimates = await _offlineStorage.getEstimatesByLead(event.leadId!);
        } else {
          estimates = await _offlineStorage.getAllEstimates();
        }
        
        emit(EstimatesLoaded(estimates));
      } catch (e) {
        // Ignore sync errors, we have offline data
      }
    } catch (e) {
      emit(EstimatesError('Failed to load estimates: ${e.toString()}'));
    }
  }

  Future<void> _onCreateEstimate(CreateEstimate event, Emitter<EstimatesState> emit) async {
    try {
      // Save to offline storage immediately
      await _offlineStorage.saveEstimate(event.estimate);
      emit(EstimateCreated(event.estimate));

      // Add to sync queue for later upload
      await _syncService.addToSyncQueue('create_estimate', event.estimate.toJson());

      // Reload estimates
      add(LoadEstimates(leadId: event.estimate.leadId));
    } catch (e) {
      emit(EstimatesError('Failed to create estimate: ${e.toString()}'));
    }
  }

  Future<void> _onUpdateEstimate(UpdateEstimate event, Emitter<EstimatesState> emit) async {
    try {
      // Update offline storage
      await _offlineStorage.saveEstimate(event.estimate);
      emit(EstimateUpdated(event.estimate));

      // Add to sync queue
      await _syncService.addToSyncQueue('update_estimate', event.estimate.toJson());

      // Reload estimates
      add(LoadEstimates(leadId: event.estimate.leadId));
    } catch (e) {
      emit(EstimatesError('Failed to update estimate: ${e.toString()}'));
    }
  }

  Future<void> _onCalculateEstimate(CalculateEstimate event, Emitter<EstimatesState> emit) async {
    try {
      // Use offline calculation logic
      final calculation = _calculateOfflineEstimate(
        productType: event.productType,
        width: event.width,
        height: event.height,
        coatingType: event.coatingType,
        hardwareType: event.hardwareType,
        specifications: event.specifications,
      );

      emit(EstimateCalculated(calculation));

      // Try to get server calculation if connected
      try {
        final serverCalculation = await _apiService.calculateEstimate({
          'productType': event.productType,
          'width': event.width,
          'height': event.height,
          'coatingType': event.coatingType,
          'hardwareType': event.hardwareType,
          'specifications': event.specifications,
        });
        
        if (serverCalculation.isNotEmpty) {
          emit(EstimateCalculated(serverCalculation));
        }
      } catch (e) {
        // Use offline calculation if server fails
      }
    } catch (e) {
      emit(EstimatesError('Failed to calculate estimate: ${e.toString()}'));
    }
  }

  Future<void> _onRequestDiscountApproval(RequestDiscountApproval event, Emitter<EstimatesState> emit) async {
    try {
      // Add to sync queue for approval request
      await _syncService.addToSyncQueue('request_discount_approval', {
        'estimateId': event.estimateId,
        'discountPercentage': event.discountPercentage,
      });

      emit(DiscountApprovalRequested(
        estimateId: event.estimateId,
        discountPercentage: event.discountPercentage,
      ));

      // Try to send approval request if connected
      try {
        await _apiService.requestDiscountApproval(event.estimateId, event.discountPercentage);
      } catch (e) {
        // Will be synced later
      }
    } catch (e) {
      emit(EstimatesError('Failed to request discount approval: ${e.toString()}'));
    }
  }

  Future<void> _onApplyDiscount(ApplyDiscount event, Emitter<EstimatesState> emit) async {
    try {
      final estimate = await _offlineStorage.getEstimate(event.estimateId);
      if (estimate != null) {
        final discountAmount = estimate.totalCost * (event.discountPercentage / 100);
        final finalAmount = estimate.totalCost - discountAmount;
        
        final updatedEstimate = estimate.copyWith(
          discountPercentage: event.discountPercentage,
          discountAmount: discountAmount,
          finalAmount: finalAmount,
          status: 'PENDING_APPROVAL',
        );

        await _offlineStorage.saveEstimate(updatedEstimate);
        emit(DiscountApplied(updatedEstimate));

        // Add to sync queue
        await _syncService.addToSyncQueue('update_estimate', updatedEstimate.toJson());
      }
    } catch (e) {
      emit(EstimatesError('Failed to apply discount: ${e.toString()}'));
    }
  }

  Map<String, dynamic> _calculateOfflineEstimate({
    required String productType,
    required double width,
    required double height,
    required String coatingType,
    required String hardwareType,
    required Map<String, dynamic> specifications,
  }) {
    // Offline calculation logic based on predefined rates
    final area = width * height / 1000000; // Convert to square meters
    
    // Base material cost per square meter
    double materialRate = 0;
    switch (productType) {
      case 'DOOR':
        materialRate = 2500;
        break;
      case 'WINDOW':
        materialRate = 2000;
        break;
      case 'FRAME':
        materialRate = 1500;
        break;
    }

    // Coating cost multiplier
    double coatingMultiplier = 1.0;
    switch (coatingType) {
      case 'POWDER_COATING':
        coatingMultiplier = 1.3;
        break;
      case 'ANODIZED':
        coatingMultiplier = 1.5;
        break;
      case 'PAINT':
        coatingMultiplier = 1.1;
        break;
    }

    // Hardware cost
    double hardwareCost = 0;
    switch (hardwareType) {
      case 'STANDARD':
        hardwareCost = 500;
        break;
      case 'PREMIUM':
        hardwareCost = 1000;
        break;
      case 'LUXURY':
        hardwareCost = 2000;
        break;
    }

    final materialCost = area * materialRate;
    final coatingCost = materialCost * (coatingMultiplier - 1);
    final laborCost = materialCost * 0.3; // 30% of material cost
    final totalCost = materialCost + coatingCost + hardwareCost + laborCost;

    return {
      'materialCost': materialCost,
      'coatingCost': coatingCost,
      'hardwareCost': hardwareCost,
      'laborCost': laborCost,
      'totalCost': totalCost,
      'finalAmount': totalCost,
      'area': area,
    };
  }
}
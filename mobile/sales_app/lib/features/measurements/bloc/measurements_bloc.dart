import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../models/measurement.dart';
import '../../../services/offline_storage_service.dart';
import '../../../services/sales_api_service.dart';
import '../../../services/sync_service.dart';
import '../../../services/location_service.dart';

// Events
abstract class MeasurementsEvent extends Equatable {
  const MeasurementsEvent();

  @override
  List<Object?> get props => [];
}

class LoadMeasurements extends MeasurementsEvent {
  final String? leadId;

  const LoadMeasurements({this.leadId});

  @override
  List<Object?> get props => [leadId];
}

class CreateMeasurement extends MeasurementsEvent {
  final SiteMeasurement measurement;

  const CreateMeasurement(this.measurement);

  @override
  List<Object?> get props => [measurement];
}

class UpdateMeasurement extends MeasurementsEvent {
  final SiteMeasurement measurement;

  const UpdateMeasurement(this.measurement);

  @override
  List<Object?> get props => [measurement];
}

class DeleteMeasurement extends MeasurementsEvent {
  final String measurementId;

  const DeleteMeasurement(this.measurementId);

  @override
  List<Object?> get props => [measurementId];
}

class StartGeoTaggedMeasurement extends MeasurementsEvent {
  final String leadId;
  final String measurementType;

  const StartGeoTaggedMeasurement({
    required this.leadId,
    required this.measurementType,
  });

  @override
  List<Object?> get props => [leadId, measurementType];
}

class AddPhotoToMeasurement extends MeasurementsEvent {
  final String measurementId;
  final String photoPath;

  const AddPhotoToMeasurement({
    required this.measurementId,
    required this.photoPath,
  });

  @override
  List<Object?> get props => [measurementId, photoPath];
}

// States
abstract class MeasurementsState extends Equatable {
  const MeasurementsState();

  @override
  List<Object?> get props => [];
}

class MeasurementsInitial extends MeasurementsState {}

class MeasurementsLoading extends MeasurementsState {}

class MeasurementsLoaded extends MeasurementsState {
  final List<SiteMeasurement> measurements;

  const MeasurementsLoaded(this.measurements);

  @override
  List<Object?> get props => [measurements];
}

class MeasurementsError extends MeasurementsState {
  final String message;

  const MeasurementsError(this.message);

  @override
  List<Object?> get props => [message];
}

class MeasurementCreated extends MeasurementsState {
  final SiteMeasurement measurement;

  const MeasurementCreated(this.measurement);

  @override
  List<Object?> get props => [measurement];
}

class MeasurementUpdated extends MeasurementsState {
  final SiteMeasurement measurement;

  const MeasurementUpdated(this.measurement);

  @override
  List<Object?> get props => [measurement];
}

class GeoTaggedMeasurementStarted extends MeasurementsState {
  final String leadId;
  final String measurementType;
  final double latitude;
  final double longitude;
  final String address;

  const GeoTaggedMeasurementStarted({
    required this.leadId,
    required this.measurementType,
    required this.latitude,
    required this.longitude,
    required this.address,
  });

  @override
  List<Object?> get props => [leadId, measurementType, latitude, longitude, address];
}

class PhotoAddedToMeasurement extends MeasurementsState {
  final String measurementId;
  final String photoPath;

  const PhotoAddedToMeasurement({
    required this.measurementId,
    required this.photoPath,
  });

  @override
  List<Object?> get props => [measurementId, photoPath];
}

// Bloc
class MeasurementsBloc extends Bloc<MeasurementsEvent, MeasurementsState> {
  final OfflineStorageService _offlineStorage;
  final SalesApiService _apiService;
  final SalesSyncService _syncService;
  final LocationService _locationService;

  MeasurementsBloc({
    required OfflineStorageService offlineStorage,
    required SalesApiService apiService,
    required SalesSyncService syncService,
    required LocationService locationService,
  })  : _offlineStorage = offlineStorage,
        _apiService = apiService,
        _syncService = syncService,
        _locationService = locationService,
        super(MeasurementsInitial()) {
    on<LoadMeasurements>(_onLoadMeasurements);
    on<CreateMeasurement>(_onCreateMeasurement);
    on<UpdateMeasurement>(_onUpdateMeasurement);
    on<DeleteMeasurement>(_onDeleteMeasurement);
    on<StartGeoTaggedMeasurement>(_onStartGeoTaggedMeasurement);
    on<AddPhotoToMeasurement>(_onAddPhotoToMeasurement);
  }

  Future<void> _onLoadMeasurements(LoadMeasurements event, Emitter<MeasurementsState> emit) async {
    emit(MeasurementsLoading());
    
    try {
      List<SiteMeasurement> measurements;
      
      if (event.leadId != null) {
        measurements = await _offlineStorage.getMeasurementsByLead(event.leadId!);
      } else {
        measurements = await _offlineStorage.getAllMeasurements();
      }
      
      emit(MeasurementsLoaded(measurements));

      // Try to sync with server if connected
      try {
        await _syncService.forcSync();
        
        if (event.leadId != null) {
          measurements = await _offlineStorage.getMeasurementsByLead(event.leadId!);
        } else {
          measurements = await _offlineStorage.getAllMeasurements();
        }
        
        emit(MeasurementsLoaded(measurements));
      } catch (e) {
        // Ignore sync errors, we have offline data
      }
    } catch (e) {
      emit(MeasurementsError('Failed to load measurements: ${e.toString()}'));
    }
  }

  Future<void> _onCreateMeasurement(CreateMeasurement event, Emitter<MeasurementsState> emit) async {
    try {
      // Save to offline storage immediately
      await _offlineStorage.saveMeasurement(event.measurement);
      emit(MeasurementCreated(event.measurement));

      // Add to sync queue for later upload
      await _syncService.addToSyncQueue('create_measurement', event.measurement.toJson());

      // Reload measurements
      add(LoadMeasurements(leadId: event.measurement.leadId));
    } catch (e) {
      emit(MeasurementsError('Failed to create measurement: ${e.toString()}'));
    }
  }

  Future<void> _onUpdateMeasurement(UpdateMeasurement event, Emitter<MeasurementsState> emit) async {
    try {
      // Update offline storage
      await _offlineStorage.saveMeasurement(event.measurement);
      emit(MeasurementUpdated(event.measurement));

      // Add to sync queue
      await _syncService.addToSyncQueue('update_measurement', event.measurement.toJson());

      // Reload measurements
      add(LoadMeasurements(leadId: event.measurement.leadId));
    } catch (e) {
      emit(MeasurementsError('Failed to update measurement: ${e.toString()}'));
    }
  }

  Future<void> _onDeleteMeasurement(DeleteMeasurement event, Emitter<MeasurementsState> emit) async {
    try {
      final measurement = await _offlineStorage.getMeasurement(event.measurementId);
      if (measurement != null) {
        // Add to sync queue for deletion
        await _syncService.addToSyncQueue('delete_measurement', {'id': event.measurementId});
        
        // Reload measurements
        add(LoadMeasurements(leadId: measurement.leadId));
      }
    } catch (e) {
      emit(MeasurementsError('Failed to delete measurement: ${e.toString()}'));
    }
  }

  Future<void> _onStartGeoTaggedMeasurement(StartGeoTaggedMeasurement event, Emitter<MeasurementsState> emit) async {
    try {
      // Get current location
      final position = await _locationService.getCurrentLocation();
      if (position == null) {
        emit(const MeasurementsError('Unable to get current location. Please check location permissions.'));
        return;
      }

      // Get address from coordinates
      final address = await _locationService.getAddressFromCoordinates(
        position.latitude,
        position.longitude,
      );

      emit(GeoTaggedMeasurementStarted(
        leadId: event.leadId,
        measurementType: event.measurementType,
        latitude: position.latitude,
        longitude: position.longitude,
        address: address,
      ));
    } catch (e) {
      emit(MeasurementsError('Failed to start geo-tagged measurement: ${e.toString()}'));
    }
  }

  Future<void> _onAddPhotoToMeasurement(AddPhotoToMeasurement event, Emitter<MeasurementsState> emit) async {
    try {
      final measurement = await _offlineStorage.getMeasurement(event.measurementId);
      if (measurement != null) {
        final updatedPhotos = List<String>.from(measurement.photos)..add(event.photoPath);
        final updatedMeasurement = measurement.copyWith(photos: updatedPhotos);
        
        await _offlineStorage.saveMeasurement(updatedMeasurement);
        emit(PhotoAddedToMeasurement(
          measurementId: event.measurementId,
          photoPath: event.photoPath,
        ));

        // Add to sync queue
        await _syncService.addToSyncQueue('update_measurement', updatedMeasurement.toJson());
      }
    } catch (e) {
      emit(MeasurementsError('Failed to add photo to measurement: ${e.toString()}'));
    }
  }
}
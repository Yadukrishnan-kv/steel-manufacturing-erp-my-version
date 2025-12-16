import 'package:get_it/get_it.dart';
import '../services/api_client.dart';
import '../services/dio_client.dart';
import '../utils/storage_service.dart';
import '../utils/connectivity_service.dart';
import '../utils/sync_service.dart';
import '../bloc/auth/auth_bloc.dart';

final GetIt getIt = GetIt.instance;

Future<void> setupDependencyInjection() async {
  // Storage Service
  final storageService = StorageService();
  await storageService.init();
  getIt.registerSingleton<StorageService>(storageService);

  // Connectivity Service
  final connectivityService = ConnectivityService();
  await connectivityService.init();
  getIt.registerSingleton<ConnectivityService>(connectivityService);

  // Dio Client
  final dioClient = DioClient(storageService);
  getIt.registerSingleton<DioClient>(dioClient);

  // API Client
  final apiClient = ApiClient(dioClient.dio);
  getIt.registerSingleton<ApiClient>(apiClient);

  // Sync Service
  final syncService = SyncService();
  syncService.init(apiClient);
  getIt.registerSingleton<SyncService>(syncService);

  // Auth Bloc
  getIt.registerFactory<AuthBloc>(
    () => AuthBloc(
      apiClient: getIt<ApiClient>(),
      storageService: getIt<StorageService>(),
    ),
  );
}

Future<void> resetDependencyInjection() async {
  await getIt.reset();
}
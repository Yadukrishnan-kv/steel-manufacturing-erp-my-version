import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
// import 'package:shared/shared.dart';

final sl = GetIt.instance;

Future<void> init() async {
  // External
  // final sharedPreferences = await SharedPreferences.getInstance();
  // sl.registerLazySingleton(() => sharedPreferences);

  // Core
  // sl.registerLazySingleton(() => StorageService());
  // sl.registerLazySingleton(() => ConnectivityService());
  // sl.registerLazySingleton(() => SyncService());

  // Network
  sl.registerLazySingleton(() => Dio());
  // sl.registerLazySingleton(() => DioClient(sl()));
  // sl.registerLazySingleton(() => ApiClient(sl<DioClient>().dio));

  // Blocs
  // sl.registerFactory(() => AuthBloc(
  //   apiClient: sl(),
  //   storageService: sl(),
  // ));

  // Initialize services
  // await sl<StorageService>().init();
  // await sl<ConnectivityService>().init();
  // sl<SyncService>().init(sl<ApiClient>());
}
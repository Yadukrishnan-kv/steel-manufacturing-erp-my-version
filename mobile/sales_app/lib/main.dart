import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared/shared.dart';
import 'package:go_router/go_router.dart';
import 'services/offline_storage_service.dart';
import 'services/sales_api_service.dart';
import 'services/sync_service.dart';
import 'services/location_service.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/dashboard/presentation/dashboard_screen.dart';
import 'features/leads/bloc/leads_bloc.dart';
import 'features/measurements/bloc/measurements_bloc.dart';
import 'features/estimates/bloc/estimates_bloc.dart';
import 'features/interactions/bloc/interactions_bloc.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Hive for local storage
  await Hive.initFlutter();
  
  // Initialize offline storage
  final offlineStorage = OfflineStorageService();
  await offlineStorage.init();
  
  // Initialize shared dependency injection
  await setupDependencyInjection();
  
  runApp(SalesApp(offlineStorage: offlineStorage));
}

class SalesApp extends StatefulWidget {
  final OfflineStorageService offlineStorage;

  const SalesApp({super.key, required this.offlineStorage});

  @override
  State<SalesApp> createState() => _SalesAppState();
}

class _SalesAppState extends State<SalesApp> {
  late final GoRouter _router;
  late final SalesApiService _apiService;
  late final SalesSyncService _syncService;
  late final LocationService _locationService;

  @override
  void initState() {
    super.initState();
    
    // Initialize services
    _apiService = SalesApiService(getIt<ApiClient>());
    _syncService = SalesSyncService();
    _locationService = LocationService();
    
    // Initialize sync service
    _syncService.init(_apiService);
    
    // Setup router
    _router = GoRouter(
      initialLocation: '/',
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => BlocBuilder<AuthBloc, AuthState>(
            builder: (context, authState) {
              if (authState is AuthAuthenticated) {
                return const DashboardScreen();
              } else if (authState is AuthUnauthenticated) {
                return const LoginScreen();
              } else {
                return const Scaffold(
                  body: Center(child: CircularProgressIndicator()),
                );
              }
            },
          ),
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const DashboardScreen(),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _syncService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (context) => getIt<AuthBloc>()..add(AuthCheckRequested()),
        ),
        BlocProvider<LeadsBloc>(
          create: (context) => LeadsBloc(
            offlineStorage: widget.offlineStorage,
            apiService: _apiService,
            syncService: _syncService,
          ),
        ),
        BlocProvider<MeasurementsBloc>(
          create: (context) => MeasurementsBloc(
            offlineStorage: widget.offlineStorage,
            apiService: _apiService,
            syncService: _syncService,
            locationService: _locationService,
          ),
        ),
        BlocProvider<EstimatesBloc>(
          create: (context) => EstimatesBloc(
            offlineStorage: widget.offlineStorage,
            apiService: _apiService,
            syncService: _syncService,
          ),
        ),
        BlocProvider<InteractionsBloc>(
          create: (context) => InteractionsBloc(
            offlineStorage: widget.offlineStorage,
            apiService: _apiService,
            syncService: _syncService,
          ),
        ),
      ],
      child: MaterialApp.router(
        title: 'Steel ERP - Sales',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        routerConfig: _router,
      ),
    );
  }
}
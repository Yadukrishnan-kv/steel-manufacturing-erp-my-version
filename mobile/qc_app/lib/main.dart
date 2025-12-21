import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:go_router/go_router.dart';

import 'services/auth_service.dart';
import 'services/qc_service.dart';
import 'blocs/auth/auth_bloc.dart';
import 'blocs/auth/auth_event.dart';
import 'blocs/qc/qc_bloc.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/qc_checklist_screen.dart';
import 'screens/qc_history_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final prefs = await SharedPreferences.getInstance();
  final dio = Dio(BaseOptions(
    baseUrl: 'http://localhost:3000/api/v1',
    connectTimeout: const Duration(seconds: 5),
    receiveTimeout: const Duration(seconds: 3),
  ));
  
  final authService = AuthService(dio, prefs);
  final qcService = QCService(dio);
  
  runApp(QCApp(
    authService: authService,
    qcService: qcService,
  ));
}

class QCApp extends StatelessWidget {
  final AuthService authService;
  final QCService qcService;

  QCApp({
    super.key,
    required this.authService,
    required this.qcService,
  });

  final GoRouter _router = GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/qc-checklist',
        builder: (context, state) => const QCChecklistScreen(),
      ),
      GoRoute(
        path: '/qc-history',
        builder: (context, state) => const QCHistoryScreen(),
      ),
    ],
  );

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (context) => AuthBloc(authService)..add(AuthCheckRequested()),
        ),
        BlocProvider<QCBloc>(
          create: (context) => QCBloc(qcService),
        ),
      ],
      child: MaterialApp.router(
        title: 'Steel ERP - QC',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          useMaterial3: true,
          appBarTheme: AppBarTheme(
            backgroundColor: Colors.blue.shade700,
            foregroundColor: Colors.white,
          ),
        ),
        routerConfig: _router,
      ),
    );
  }
}
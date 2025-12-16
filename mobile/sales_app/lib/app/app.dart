import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import '../features/auth/presentation/pages/login_page.dart';
import '../features/dashboard/presentation/pages/dashboard_page.dart';
import '../features/leads/presentation/pages/leads_page.dart';
import '../features/measurements/presentation/pages/measurements_page.dart';
import '../features/estimates/presentation/pages/estimates_page.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardPage(),
      ),
      GoRoute(
        path: '/leads',
        builder: (context, state) => const LeadsPage(),
      ),
      GoRoute(
        path: '/measurements',
        builder: (context, state) => const MeasurementsPage(),
      ),
      GoRoute(
        path: '/estimates',
        builder: (context, state) => const EstimatesPage(),
      ),
    ],
  );
}
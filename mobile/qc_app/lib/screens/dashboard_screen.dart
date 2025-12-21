import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../blocs/auth/auth_bloc.dart';
import '../blocs/auth/auth_event.dart';
import '../blocs/qc/qc_bloc.dart';
import '../blocs/qc/qc_event.dart';
import '../blocs/qc/qc_state.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    context.read<QCBloc>().add(QCLoadDashboard());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('QC Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              context.read<AuthBloc>().add(AuthLogoutRequested());
              context.go('/login');
            },
          ),
        ],
      ),
      body: BlocBuilder<QCBloc, QCState>(
        builder: (context, state) {
          if (state is QCLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is QCError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.red,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Error: ${state.message}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      context.read<QCBloc>().add(QCLoadDashboard());
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          Map<String, dynamic> stats = {};
          if (state is QCDashboardLoaded) {
            stats = state.stats;
          }

          // Provide default values for stats to prevent null errors
          final totalInspections = stats['totalInspections']?.toString() ?? '0';
          final pendingQC = stats['pendingCount']?.toString() ?? '0';
          final passed = stats['passedCount']?.toString() ?? '0';
          final failed = stats['failedCount']?.toString() ?? '0';

          return RefreshIndicator(
            onRefresh: () async {
              context.read<QCBloc>().add(QCLoadDashboard());
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Quality Control Overview',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),
                  
                  // Stats Cards
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    children: [
                      _buildStatCard(
                        'Total Inspections',
                        totalInspections,
                        Icons.assignment_turned_in,
                        Colors.blue,
                      ),
                      _buildStatCard(
                        'Pending QC',
                        pendingQC,
                        Icons.pending_actions,
                        Colors.orange,
                      ),
                      _buildStatCard(
                        'Passed',
                        passed,
                        Icons.check_circle,
                        Colors.green,
                      ),
                      _buildStatCard(
                        'Failed',
                        failed,
                        Icons.cancel,
                        Colors.red,
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 30),
                  
                  // Quick Actions
                  const Text(
                    'Quick Actions',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.5,
                    children: [
                      _buildActionCard(
                        'New QC Checklist',
                        Icons.add_task,
                        Colors.blue,
                        () => context.go('/qc-checklist'),
                      ),
                      _buildActionCard(
                        'QC History',
                        Icons.history,
                        Colors.purple,
                        () => context.go('/qc-history'),
                      ),
                      _buildActionCard(
                        'Rework Orders',
                        Icons.build,
                        Colors.orange,
                        () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Rework Orders - Coming Soon')),
                          );
                        },
                      ),
                      _buildActionCard(
                        'Reports',
                        Icons.analytics,
                        Colors.green,
                        () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Reports - Coming Soon')),
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(String title, IconData icon, Color color, VoidCallback onTap) {
    return Card(
      elevation: 4,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 32, color: color),
              const SizedBox(height: 8),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
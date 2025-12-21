import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared/shared.dart';
import '../../leads/bloc/leads_bloc.dart';
import '../../leads/presentation/leads_screen.dart';
import '../../measurements/presentation/measurements_screen.dart';
import '../../estimates/presentation/estimates_screen.dart';
import '../../interactions/presentation/interactions_screen.dart';
import '../../../services/sync_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;
  
  final List<Widget> _screens = [
    const DashboardHomeScreen(),
    const LeadsScreen(),
    const MeasurementsScreen(),
    const EstimatesScreen(),
    const InteractionsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people),
            label: 'Leads',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.straighten),
            label: 'Measurements',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calculate),
            label: 'Estimates',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history),
            label: 'Interactions',
          ),
        ],
      ),
    );
  }
}

class DashboardHomeScreen extends StatelessWidget {
  const DashboardHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sales Dashboard'),
        actions: [
          StreamBuilder<SyncStatus>(
            stream: SalesSyncService().syncStatus,
            builder: (context, snapshot) {
              final status = snapshot.data ?? SyncStatus.idle;
              return IconButton(
                onPressed: status == SyncStatus.syncing ? null : () {
                  SalesSyncService().forcSync();
                },
                icon: status == SyncStatus.syncing
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(
                        Icons.sync,
                        color: status == SyncStatus.success
                            ? Colors.green
                            : status == SyncStatus.error
                                ? Colors.red
                                : null,
                      ),
              );
            },
          ),
          BlocBuilder<AuthBloc, AuthState>(
            builder: (context, state) {
              return PopupMenuButton(
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'profile',
                    child: Text('Profile'),
                  ),
                  const PopupMenuItem(
                    value: 'settings',
                    child: Text('Settings'),
                  ),
                  const PopupMenuItem(
                    value: 'logout',
                    child: Text('Logout'),
                  ),
                ],
                onSelected: (value) {
                  if (value == 'logout') {
                    context.read<AuthBloc>().add(AuthLogoutRequested());
                  }
                },
              );
            },
          ),
        ],
      ),
      body: const SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SyncStatusCard(),
            SizedBox(height: 16),
            _QuickStatsGrid(),
            SizedBox(height: 16),
            _QuickActionsGrid(),
            SizedBox(height: 16),
            _RecentActivityCard(),
          ],
        ),
      ),
    );
  }
}

class _SyncStatusCard extends StatelessWidget {
  const _SyncStatusCard();

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<SyncStatus>(
      stream: SalesSyncService().syncStatus,
      builder: (context, snapshot) {
        final status = snapshot.data ?? SyncStatus.idle;
        
        Color statusColor;
        String statusText;
        IconData statusIcon;
        
        switch (status) {
          case SyncStatus.syncing:
            statusColor = Colors.orange;
            statusText = 'Syncing data...';
            statusIcon = Icons.sync;
            break;
          case SyncStatus.success:
            statusColor = Colors.green;
            statusText = 'Data synchronized';
            statusIcon = Icons.check_circle;
            break;
          case SyncStatus.error:
            statusColor = Colors.red;
            statusText = 'Sync failed';
            statusIcon = Icons.error;
            break;
          case SyncStatus.idle:
          default:
            statusColor = Colors.grey;
            statusText = 'Ready to sync';
            statusIcon = Icons.cloud_off;
            break;
        }

        return Card(
          child: ListTile(
            leading: Icon(statusIcon, color: statusColor),
            title: Text(statusText),
            subtitle: const Text('Tap sync button to update data'),
            trailing: status == SyncStatus.syncing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : null,
          ),
        );
      },
    );
  }
}

class _QuickStatsGrid extends StatelessWidget {
  const _QuickStatsGrid();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LeadsBloc, LeadsState>(
      builder: (context, state) {
        int totalLeads = 0;
        int newLeads = 0;
        int convertedLeads = 0;
        
        if (state is LeadsLoaded) {
          totalLeads = state.leads.length;
          newLeads = state.leads.where((lead) => lead.status == 'NEW').length;
          convertedLeads = state.leads.where((lead) => lead.status == 'CONVERTED').length;
        }

        return GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          childAspectRatio: 1.5,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          children: [
            _StatCard(
              title: 'Total Leads',
              value: totalLeads.toString(),
              icon: Icons.people,
              color: Colors.blue,
            ),
            _StatCard(
              title: 'New Leads',
              value: newLeads.toString(),
              icon: Icons.person_add,
              color: Colors.green,
            ),
            _StatCard(
              title: 'Converted',
              value: convertedLeads.toString(),
              icon: Icons.check_circle,
              color: Colors.orange,
            ),
            _StatCard(
              title: 'Conversion Rate',
              value: totalLeads > 0 ? '${((convertedLeads / totalLeads) * 100).toStringAsFixed(1)}%' : '0%',
              icon: Icons.trending_up,
              color: Colors.purple,
            ),
          ],
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              title,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionsGrid extends StatelessWidget {
  const _QuickActionsGrid();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          childAspectRatio: 1.2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          children: [
            _ActionCard(
              title: 'New Lead',
              icon: Icons.person_add,
              color: Colors.blue,
              onTap: () {
                // Navigate to new lead screen
                Navigator.pushNamed(context, '/leads/new');
              },
            ),
            _ActionCard(
              title: 'Site Measurement',
              icon: Icons.straighten,
              color: Colors.green,
              onTap: () {
                // Navigate to measurement screen
                Navigator.pushNamed(context, '/measurements/new');
              },
            ),
            _ActionCard(
              title: 'Create Estimate',
              icon: Icons.calculate,
              color: Colors.orange,
              onTap: () {
                // Navigate to estimate screen
                Navigator.pushNamed(context, '/estimates/new');
              },
            ),
            _ActionCard(
              title: 'Log Interaction',
              icon: Icons.history,
              color: Colors.purple,
              onTap: () {
                // Navigate to interactions screen
                Navigator.pushNamed(context, '/interactions');
              },
            ),
          ],
        ),
      ],
    );
  }
}

class _ActionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ActionCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 32, color: color),
              const SizedBox(height: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecentActivityCard extends StatelessWidget {
  const _RecentActivityCard();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent Activity',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _ActivityItem(
                  icon: Icons.person_add,
                  title: 'New lead captured',
                  subtitle: 'John Doe - Meta Lead',
                  time: '2 hours ago',
                ),
                const Divider(),
                _ActivityItem(
                  icon: Icons.straighten,
                  title: 'Site measurement completed',
                  subtitle: 'ABC Company - Door measurement',
                  time: '4 hours ago',
                ),
                const Divider(),
                _ActivityItem(
                  icon: Icons.calculate,
                  title: 'Estimate created',
                  subtitle: 'XYZ Corp - ₹45,000',
                  time: '1 day ago',
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ActivityItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String time;

  const _ActivityItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.time,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
        child: Icon(icon, color: Theme.of(context).primaryColor),
      ),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: Text(
        time,
        style: Theme.of(context).textTheme.bodySmall,
      ),
    );
  }
}
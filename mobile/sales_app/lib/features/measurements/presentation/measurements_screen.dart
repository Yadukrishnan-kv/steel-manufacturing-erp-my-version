import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/measurements_bloc.dart';
import '../../../models/measurement.dart';
import '../../../models/lead.dart';
import 'measurement_form_screen.dart';

class MeasurementsScreen extends StatefulWidget {
  const MeasurementsScreen({super.key});

  @override
  State<MeasurementsScreen> createState() => _MeasurementsScreenState();
}

class _MeasurementsScreenState extends State<MeasurementsScreen> {
  @override
  void initState() {
    super.initState();
    context.read<MeasurementsBloc>().add(const LoadMeasurements());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Measurements'),
        actions: [
          IconButton(
            onPressed: () {
              context.read<MeasurementsBloc>().add(const LoadMeasurements());
            },
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: BlocBuilder<MeasurementsBloc, MeasurementsState>(
        builder: (context, state) {
          if (state is MeasurementsLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is MeasurementsLoaded) {
            return _buildMeasurementsList(state.measurements);
          } else if (state is MeasurementsError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    state.message,
                    style: Theme.of(context).textTheme.bodyLarge,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      context.read<MeasurementsBloc>().add(const LoadMeasurements());
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }
          return const Center(child: Text('No measurements found'));
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // For now, we'll show a dialog to select a lead
          _showLeadSelectionDialog();
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildMeasurementsList(List<SiteMeasurement> measurements) {
    if (measurements.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.straighten,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No measurements found',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Tap the + button to add a new measurement',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: measurements.length,
      itemBuilder: (context, index) {
        final measurement = measurements[index];
        return _MeasurementCard(measurement: measurement);
      },
    );
  }

  void _showLeadSelectionDialog() {
    // For demo purposes, we'll create a dummy lead
    // In a real app, this would show a list of leads to select from
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Lead'),
        content: const Text('This is a demo. In the real app, you would select a lead from your leads list.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              // Create a dummy lead for demo
              final dummyLead = Lead(
                id: 'demo_lead',
                customerName: 'Demo Customer',
                customerPhone: '+91 9876543210',
                source: 'MANUAL',
                status: 'NEW',
                assignedTo: 'current_user',
                createdAt: DateTime.now(),
              );
              
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => MeasurementFormScreen(lead: dummyLead),
                ),
              );
            },
            child: const Text('Continue with Demo Lead'),
          ),
        ],
      ),
    );
  }
}

class _MeasurementCard extends StatelessWidget {
  final SiteMeasurement measurement;

  const _MeasurementCard({required this.measurement});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    measurement.measurementType,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                _SyncStatusIcon(isSynced: measurement.isSynced),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.straighten, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  '${measurement.width} × ${measurement.height} ${measurement.unit}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                if (measurement.depth != null) ...[
                  Text(
                    ' × ${measurement.depth} ${measurement.unit}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.location_on, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    measurement.address,
                    style: Theme.of(context).textTheme.bodyMedium,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            if (measurement.photos.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.photo_camera, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    '${measurement.photos.length} photo(s)',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  _formatDate(measurement.measuredAt),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const Spacer(),
                Text(
                  'By: ${measurement.measuredBy}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inMinutes}m ago';
    }
  }
}

class _SyncStatusIcon extends StatelessWidget {
  final bool isSynced;

  const _SyncStatusIcon({required this.isSynced});

  @override
  Widget build(BuildContext context) {
    return Icon(
      isSynced ? Icons.cloud_done : Icons.cloud_off,
      size: 16,
      color: isSynced ? Colors.green : Colors.orange,
    );
  }
}
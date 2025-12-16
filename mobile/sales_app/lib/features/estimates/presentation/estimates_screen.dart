import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/estimates_bloc.dart';
import '../../../models/estimate.dart';
import '../../../models/lead.dart';
import 'estimate_form_screen.dart';

class EstimatesScreen extends StatefulWidget {
  const EstimatesScreen({super.key});

  @override
  State<EstimatesScreen> createState() => _EstimatesScreenState();
}

class _EstimatesScreenState extends State<EstimatesScreen> {
  @override
  void initState() {
    super.initState();
    context.read<EstimatesBloc>().add(const LoadEstimates());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Estimates'),
        actions: [
          IconButton(
            onPressed: () {
              context.read<EstimatesBloc>().add(const LoadEstimates());
            },
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: BlocBuilder<EstimatesBloc, EstimatesState>(
        builder: (context, state) {
          if (state is EstimatesLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is EstimatesLoaded) {
            return _buildEstimatesList(state.estimates);
          } else if (state is EstimatesError) {
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
                      context.read<EstimatesBloc>().add(const LoadEstimates());
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }
          return const Center(child: Text('No estimates found'));
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          _showLeadSelectionDialog();
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildEstimatesList(List<Estimate> estimates) {
    if (estimates.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.calculate,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No estimates found',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Tap the + button to create a new estimate',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: estimates.length,
      itemBuilder: (context, index) {
        final estimate = estimates[index];
        return _EstimateCard(estimate: estimate);
      },
    );
  }

  void _showLeadSelectionDialog() {
    // For demo purposes, we'll create a dummy lead
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
                  builder: (context) => EstimateFormScreen(lead: dummyLead),
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

class _EstimateCard extends StatelessWidget {
  final Estimate estimate;

  const _EstimateCard({required this.estimate});

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
                    estimate.productType,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                _StatusChip(status: estimate.status),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.straighten, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  '${estimate.width} × ${estimate.height}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.palette, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  estimate.coatingType,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(width: 16),
                const Icon(Icons.build, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  estimate.hardwareType,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total Cost',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    Text(
                      '₹${estimate.totalCost.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                if (estimate.discountPercentage != null) ...[
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Discount',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      Text(
                        '${estimate.discountPercentage!.toStringAsFixed(1)}%',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.red,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Final Amount',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    Text(
                      '₹${estimate.finalAmount.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.green,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  _formatDate(estimate.createdAt),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const Spacer(),
                _SyncStatusIcon(isSynced: estimate.isSynced),
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

class _StatusChip extends StatelessWidget {
  final String status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status) {
      case 'DRAFT':
        color = Colors.grey;
        break;
      case 'PENDING_APPROVAL':
        color = Colors.orange;
        break;
      case 'APPROVED':
        color = Colors.blue;
        break;
      case 'SENT':
        color = Colors.purple;
        break;
      case 'ACCEPTED':
        color = Colors.green;
        break;
      case 'REJECTED':
        color = Colors.red;
        break;
      default:
        color = Colors.grey;
    }

    return Chip(
      label: Text(
        status,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
      backgroundColor: color,
      padding: EdgeInsets.zero,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
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
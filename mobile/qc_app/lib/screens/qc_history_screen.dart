import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../blocs/qc/qc_bloc.dart';
import '../blocs/qc/qc_event.dart';
import '../blocs/qc/qc_state.dart';

class QCHistoryScreen extends StatefulWidget {
  const QCHistoryScreen({super.key});

  @override
  State<QCHistoryScreen> createState() => _QCHistoryScreenState();
}

class _QCHistoryScreenState extends State<QCHistoryScreen> {
  @override
  void initState() {
    super.initState();
    context.read<QCBloc>().add(QCLoadHistory());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('QC History'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/dashboard'),
        ),
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
                      context.read<QCBloc>().add(QCLoadHistory());
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          List<Map<String, dynamic>> history = [];
          if (state is QCHistoryLoaded) {
            history = state.history;
          }

          if (history.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.history,
                    size: 64,
                    color: Colors.grey,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'No QC history found',
                    style: TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Complete some QC checklists to see history here',
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              context.read<QCBloc>().add(QCLoadHistory());
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: history.length,
              itemBuilder: (context, index) {
                final item = history[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12.0),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: _getStatusColor(item['status']),
                      child: Icon(
                        _getStatusIcon(item['status']),
                        color: Colors.white,
                      ),
                    ),
                    title: Text(
                      'Order #${item['orderNumber'] ?? 'N/A'}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Inspector: ${item['inspector'] ?? 'Unknown'}'),
                        Text('Date: ${_formatDate(item['timestamp'])}'),
                        if (item['notes'] != null && item['notes'].isNotEmpty)
                          Text('Notes: ${item['notes']}'),
                      ],
                    ),
                    trailing: Chip(
                      label: Text(
                        item['status'] ?? 'Unknown',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                        ),
                      ),
                      backgroundColor: _getStatusColor(item['status']),
                    ),
                    onTap: () {
                      _showQCDetails(context, item);
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'passed':
        return Colors.green;
      case 'failed':
        return Colors.red;
      case 'pending':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String? status) {
    switch (status?.toLowerCase()) {
      case 'passed':
        return Icons.check_circle;
      case 'failed':
        return Icons.cancel;
      case 'pending':
        return Icons.pending;
      default:
        return Icons.help;
    }
  }

  String _formatDate(String? timestamp) {
    if (timestamp == null) return 'Unknown';
    try {
      final date = DateTime.parse(timestamp);
      return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return 'Invalid date';
    }
  }

  void _showQCDetails(BuildContext context, Map<String, dynamic> item) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('QC Details - Order #${item['orderNumber'] ?? 'N/A'}'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDetailRow('Inspector', item['inspector'] ?? 'Unknown'),
                _buildDetailRow('Date', _formatDate(item['timestamp'])),
                _buildDetailRow('Status', item['status'] ?? 'Unknown'),
                if (item['notes'] != null && item['notes'].isNotEmpty)
                  _buildDetailRow('Notes', item['notes']),
                const SizedBox(height: 16),
                const Text(
                  'Checklist Results:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                // Display checklist results if available
                if (item['checklistData'] != null)
                  ...(_buildChecklistResults(item['checklistData'])),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  List<Widget> _buildChecklistResults(Map<String, dynamic> checklistData) {
    List<Widget> widgets = [];
    
    checklistData.forEach((stage, checks) {
      if (checks is Map<String, dynamic>) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Text(
              stage,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        );
        
        checks.forEach((check, passed) {
          if (passed is bool) {
            widgets.add(
              Padding(
                padding: const EdgeInsets.only(left: 16.0, top: 4.0),
                child: Row(
                  children: [
                    Icon(
                      passed ? Icons.check_circle : Icons.cancel,
                      size: 16,
                      color: passed ? Colors.green : Colors.red,
                    ),
                    const SizedBox(width: 8),
                    Expanded(child: Text(check)),
                  ],
                ),
              ),
            );
          }
        });
      }
    });
    
    return widgets;
  }
}
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/leads_bloc.dart';
import '../../../models/lead.dart';
import '../../../services/external_lead_service.dart';
import 'lead_form_screen.dart';
import 'lead_detail_screen.dart';

class LeadsScreen extends StatefulWidget {
  const LeadsScreen({super.key});

  @override
  State<LeadsScreen> createState() => _LeadsScreenState();
}

class _LeadsScreenState extends State<LeadsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String? _selectedStatus;
  String? _selectedSource;

  @override
  void initState() {
    super.initState();
    context.read<LeadsBloc>().add(LoadLeads());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Leads'),
        actions: [
          PopupMenuButton(
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'refresh',
                child: ListTile(
                  leading: Icon(Icons.refresh),
                  title: Text('Refresh'),
                ),
              ),
              const PopupMenuItem(
                value: 'simulate_meta',
                child: ListTile(
                  leading: Icon(Icons.facebook),
                  title: Text('Simulate Meta Lead'),
                ),
              ),
              const PopupMenuItem(
                value: 'simulate_google',
                child: ListTile(
                  leading: Icon(Icons.search),
                  title: Text('Simulate Google Lead'),
                ),
              ),
            ],
            onSelected: (value) => _handleMenuAction(value as String),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchAndFilters(),
          Expanded(
            child: BlocBuilder<LeadsBloc, LeadsState>(
              builder: (context, state) {
                if (state is LeadsLoading) {
                  return const Center(child: CircularProgressIndicator());
                } else if (state is LeadsLoaded) {
                  return _buildLeadsList(state.filteredLeads);
                } else if (state is LeadsError) {
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
                            context.read<LeadsBloc>().add(LoadLeads());
                          },
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  );
                }
                return const Center(child: Text('No leads found'));
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const LeadFormScreen(),
            ),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildSearchAndFilters() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            controller: _searchController,
            decoration: const InputDecoration(
              hintText: 'Search leads...',
              prefixIcon: Icon(Icons.search),
              border: OutlineInputBorder(),
            ),
            onChanged: (value) {
              context.read<LeadsBloc>().add(SearchLeads(value));
            },
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedStatus,
                  decoration: const InputDecoration(
                    labelText: 'Status',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: null, child: Text('All Status')),
                    DropdownMenuItem(value: 'NEW', child: Text('New')),
                    DropdownMenuItem(value: 'CONTACTED', child: Text('Contacted')),
                    DropdownMenuItem(value: 'QUALIFIED', child: Text('Qualified')),
                    DropdownMenuItem(value: 'CONVERTED', child: Text('Converted')),
                    DropdownMenuItem(value: 'LOST', child: Text('Lost')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _selectedStatus = value;
                    });
                    context.read<LeadsBloc>().add(FilterLeads(status: value));
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedSource,
                  decoration: const InputDecoration(
                    labelText: 'Source',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: null, child: Text('All Sources')),
                    DropdownMenuItem(value: 'META', child: Text('Meta/Facebook')),
                    DropdownMenuItem(value: 'GOOGLE', child: Text('Google Ads')),
                    DropdownMenuItem(value: 'MANUAL', child: Text('Manual')),
                    DropdownMenuItem(value: 'REFERRAL', child: Text('Referral')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _selectedSource = value;
                    });
                    context.read<LeadsBloc>().add(FilterLeads(source: value));
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLeadsList(List<Lead> leads) {
    if (leads.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.people_outline,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No leads found',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Tap the + button to add a new lead',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: leads.length,
      itemBuilder: (context, index) {
        final lead = leads[index];
        return _LeadCard(
          lead: lead,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => LeadDetailScreen(lead: lead),
              ),
            );
          },
        );
      },
    );
  }

  void _handleMenuAction(String action) async {
    switch (action) {
      case 'refresh':
        context.read<LeadsBloc>().add(LoadLeads());
        break;
      case 'simulate_meta':
        await _simulateExternalLead('META');
        break;
      case 'simulate_google':
        await _simulateExternalLead('GOOGLE');
        break;
    }
  }

  Future<void> _simulateExternalLead(String source) async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Simulating $source lead capture...'),
          backgroundColor: Colors.blue,
        ),
      );

      final externalLeadService = ExternalLeadService();
      final lead = await externalLeadService.simulateExternalLead(source);
      
      // Add the lead to the bloc
      context.read<LeadsBloc>().add(CreateLead(lead));
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$source lead captured successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to simulate $source lead: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

class _LeadCard extends StatelessWidget {
  final Lead lead;
  final VoidCallback onTap;

  const _LeadCard({
    required this.lead,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      lead.customerName,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  _StatusChip(status: lead.status),
                ],
              ),
              const SizedBox(height: 8),
              if (lead.customerPhone != null)
                Row(
                  children: [
                    const Icon(Icons.phone, size: 16, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      lead.customerPhone!,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              if (lead.customerEmail != null)
                Row(
                  children: [
                    const Icon(Icons.email, size: 16, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      lead.customerEmail!,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              const SizedBox(height: 8),
              Row(
                children: [
                  _SourceChip(source: lead.source),
                  const Spacer(),
                  Text(
                    _formatDate(lead.createdAt),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ],
          ),
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
      case 'NEW':
        color = Colors.blue;
        break;
      case 'CONTACTED':
        color = Colors.orange;
        break;
      case 'QUALIFIED':
        color = Colors.purple;
        break;
      case 'CONVERTED':
        color = Colors.green;
        break;
      case 'LOST':
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

class _SourceChip extends StatelessWidget {
  final String source;

  const _SourceChip({required this.source});

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color color;
    
    switch (source) {
      case 'META':
        icon = Icons.facebook;
        color = Colors.blue[800]!;
        break;
      case 'GOOGLE':
        icon = Icons.search;
        color = Colors.red;
        break;
      case 'MANUAL':
        icon = Icons.person_add;
        color = Colors.green;
        break;
      case 'REFERRAL':
        icon = Icons.group;
        color = Colors.purple;
        break;
      default:
        icon = Icons.help_outline;
        color = Colors.grey;
    }

    return Chip(
      avatar: Icon(icon, size: 16, color: Colors.white),
      label: Text(
        source,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
        ),
      ),
      backgroundColor: color,
      padding: EdgeInsets.zero,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }
}
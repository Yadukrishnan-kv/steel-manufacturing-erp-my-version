import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../models/lead.dart';
import '../../../models/measurement.dart';
import '../../../models/estimate.dart';
import '../../../models/customer_interaction.dart';
import '../../measurements/presentation/measurement_form_screen.dart';
import '../../estimates/presentation/estimate_form_screen.dart';
import '../../interactions/presentation/interactions_screen.dart';
import '../../interactions/presentation/interaction_form_screen.dart';
import 'lead_form_screen.dart';

class LeadDetailScreen extends StatefulWidget {
  final Lead lead;

  const LeadDetailScreen({super.key, required this.lead});

  @override
  State<LeadDetailScreen> createState() => _LeadDetailScreenState();
}

class _LeadDetailScreenState extends State<LeadDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.lead.customerName),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => LeadFormScreen(lead: widget.lead),
                ),
              );
            },
            icon: const Icon(Icons.edit),
          ),
          PopupMenuButton(
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'call',
                child: ListTile(
                  leading: Icon(Icons.phone),
                  title: Text('Call Customer'),
                ),
              ),
              const PopupMenuItem(
                value: 'whatsapp',
                child: ListTile(
                  leading: Icon(Icons.message),
                  title: Text('WhatsApp'),
                ),
              ),
              const PopupMenuItem(
                value: 'email',
                child: ListTile(
                  leading: Icon(Icons.email),
                  title: Text('Send Email'),
                ),
              ),
            ],
            onSelected: (value) {
              _handleAction(value as String);
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Details'),
            Tab(text: 'Measurements'),
            Tab(text: 'Estimates'),
            Tab(text: 'Interactions'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDetailsTab(),
          _buildMeasurementsTab(),
          _buildEstimatesTab(),
          _buildInteractionsTab(),
        ],
      ),
      floatingActionButton: _buildFloatingActionButton(),
    );
  }

  Widget _buildDetailsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoCard(),
          const SizedBox(height: 16),
          _buildLocationCard(),
          const SizedBox(height: 16),
          _buildNotesCard(),
        ],
      ),
    );
  }

  Widget _buildInfoCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Customer Information',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildInfoRow(Icons.person, 'Name', widget.lead.customerName),
            if (widget.lead.customerPhone != null)
              _buildInfoRow(Icons.phone, 'Phone', widget.lead.customerPhone!),
            if (widget.lead.customerEmail != null)
              _buildInfoRow(Icons.email, 'Email', widget.lead.customerEmail!),
            _buildInfoRow(Icons.source, 'Source', widget.lead.source),
            _buildInfoRow(Icons.flag, 'Status', widget.lead.status),
            _buildInfoRow(Icons.schedule, 'Created', _formatDate(widget.lead.createdAt)),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationCard() {
    if (widget.lead.address == null && widget.lead.latitude == null) {
      return const SizedBox.shrink();
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Location Information',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            if (widget.lead.address != null)
              _buildInfoRow(Icons.location_on, 'Address', widget.lead.address!),
            if (widget.lead.latitude != null && widget.lead.longitude != null)
              _buildInfoRow(
                Icons.gps_fixed,
                'Coordinates',
                '${widget.lead.latitude!.toStringAsFixed(6)}, ${widget.lead.longitude!.toStringAsFixed(6)}',
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotesCard() {
    if (widget.lead.notes == null || widget.lead.notes!.isEmpty) {
      return const SizedBox.shrink();
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Notes',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(widget.lead.notes!),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey),
          const SizedBox(width: 8),
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMeasurementsTab() {
    // In a real app, this would load measurements from the bloc
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.straighten, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text('No measurements found'),
          SizedBox(height: 8),
          Text('Tap the + button to add a measurement'),
        ],
      ),
    );
  }

  Widget _buildEstimatesTab() {
    // In a real app, this would load estimates from the bloc
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.calculate, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text('No estimates found'),
          SizedBox(height: 8),
          Text('Tap the + button to create an estimate'),
        ],
      ),
    );
  }

  Widget _buildInteractionsTab() {
    return InteractionsScreen(leadId: widget.lead.id);
  }

  Widget _buildFloatingActionButton() {
    return FloatingActionButton(
      onPressed: () {
        _showActionSheet();
      },
      child: const Icon(Icons.add),
    );
  }

  void _showActionSheet() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.straighten),
              title: const Text('Add Measurement'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => MeasurementFormScreen(lead: widget.lead),
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.calculate),
              title: const Text('Create Estimate'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => EstimateFormScreen(lead: widget.lead),
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.phone),
              title: const Text('Log Phone Call'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => InteractionFormScreen(
                      lead: widget.lead,
                      interactionType: 'CALL',
                    ),
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.meeting_room),
              title: const Text('Log Meeting'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => InteractionFormScreen(
                      lead: widget.lead,
                      interactionType: 'MEETING',
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _handleAction(String action) {
    switch (action) {
      case 'call':
        // In a real app, this would open the phone dialer
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Opening phone dialer...')),
        );
        break;
      case 'whatsapp':
        // In a real app, this would open WhatsApp
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Opening WhatsApp...')),
        );
        break;
      case 'email':
        // In a real app, this would open email client
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Opening email client...')),
        );
        break;
    }
  }

  void _logInteraction(String type) {
    // In a real app, this would open an interaction form
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Logging $type interaction...')),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
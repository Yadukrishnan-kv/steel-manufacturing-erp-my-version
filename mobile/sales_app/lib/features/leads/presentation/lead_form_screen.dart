import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:form_builder_validators/form_builder_validators.dart';
import 'package:shared/shared.dart';
import '../bloc/leads_bloc.dart';
import '../../../models/lead.dart';
import '../../../services/location_service.dart';

class LeadFormScreen extends StatefulWidget {
  final Lead? lead;

  const LeadFormScreen({super.key, this.lead});

  @override
  State<LeadFormScreen> createState() => _LeadFormScreenState();
}

class _LeadFormScreenState extends State<LeadFormScreen> {
  final _formKey = GlobalKey<FormBuilderState>();
  final LocationService _locationService = LocationService();
  bool _isLoading = false;
  double? _latitude;
  double? _longitude;
  String? _address;

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    final position = await _locationService.getCurrentLocation();
    if (position != null) {
      setState(() {
        _latitude = position.latitude;
        _longitude = position.longitude;
      });
      
      final address = await _locationService.getAddressFromCoordinates(
        position.latitude,
        position.longitude,
      );
      setState(() {
        _address = address;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.lead == null ? 'New Lead' : 'Edit Lead'),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveLead,
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ],
      ),
      body: BlocListener<LeadsBloc, LeadsState>(
        listener: (context, state) {
          if (state is LeadCreated || state is LeadUpdated) {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  widget.lead == null ? 'Lead created successfully' : 'Lead updated successfully',
                ),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is LeadsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: FormBuilder(
            key: _formKey,
            initialValue: widget.lead != null ? {
              'customerName': widget.lead!.customerName,
              'customerPhone': widget.lead!.customerPhone,
              'customerEmail': widget.lead!.customerEmail,
              'source': widget.lead!.source,
              'status': widget.lead!.status,
              'address': widget.lead!.address,
              'notes': widget.lead!.notes,
            } : {},
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildCustomerInfoSection(),
                const SizedBox(height: 24),
                _buildLeadDetailsSection(),
                const SizedBox(height: 24),
                _buildLocationSection(),
                const SizedBox(height: 24),
                _buildNotesSection(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCustomerInfoSection() {
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
            FormBuilderTextField(
              name: 'customerName',
              decoration: const InputDecoration(
                labelText: 'Customer Name *',
                prefixIcon: Icon(Icons.person),
              ),
              validator: FormBuilderValidators.compose([
                FormBuilderValidators.required(),
                FormBuilderValidators.minLength(2),
              ]),
            ),
            const SizedBox(height: 16),
            FormBuilderTextField(
              name: 'customerPhone',
              decoration: const InputDecoration(
                labelText: 'Phone Number',
                prefixIcon: Icon(Icons.phone),
              ),
              keyboardType: TextInputType.phone,
              validator: FormBuilderValidators.compose([
                FormBuilderValidators.phoneNumber(),
              ]),
            ),
            const SizedBox(height: 16),
            FormBuilderTextField(
              name: 'customerEmail',
              decoration: const InputDecoration(
                labelText: 'Email Address',
                prefixIcon: Icon(Icons.email),
              ),
              keyboardType: TextInputType.emailAddress,
              validator: FormBuilderValidators.compose([
                FormBuilderValidators.email(),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLeadDetailsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Lead Details',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            FormBuilderDropdown<String>(
              name: 'source',
              decoration: const InputDecoration(
                labelText: 'Lead Source *',
                prefixIcon: Icon(Icons.source),
              ),
              validator: FormBuilderValidators.required(),
              items: const [
                DropdownMenuItem(value: 'META', child: Text('Meta/Facebook')),
                DropdownMenuItem(value: 'GOOGLE', child: Text('Google Ads')),
                DropdownMenuItem(value: 'MANUAL', child: Text('Manual Entry')),
                DropdownMenuItem(value: 'REFERRAL', child: Text('Referral')),
                DropdownMenuItem(value: 'WEBSITE', child: Text('Website')),
                DropdownMenuItem(value: 'WALK_IN', child: Text('Walk-in')),
              ],
            ),
            const SizedBox(height: 16),
            FormBuilderDropdown<String>(
              name: 'status',
              decoration: const InputDecoration(
                labelText: 'Status *',
                prefixIcon: Icon(Icons.flag),
              ),
              validator: FormBuilderValidators.required(),
              items: const [
                DropdownMenuItem(value: 'NEW', child: Text('New')),
                DropdownMenuItem(value: 'CONTACTED', child: Text('Contacted')),
                DropdownMenuItem(value: 'QUALIFIED', child: Text('Qualified')),
                DropdownMenuItem(value: 'CONVERTED', child: Text('Converted')),
                DropdownMenuItem(value: 'LOST', child: Text('Lost')),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Location Information',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                TextButton.icon(
                  onPressed: _getCurrentLocation,
                  icon: const Icon(Icons.my_location),
                  label: const Text('Get Location'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            FormBuilderTextField(
              name: 'address',
              decoration: const InputDecoration(
                labelText: 'Address',
                prefixIcon: Icon(Icons.location_on),
              ),
              maxLines: 3,
              initialValue: _address,
            ),
            if (_latitude != null && _longitude != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.green, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Location captured: ${_latitude!.toStringAsFixed(6)}, ${_longitude!.toStringAsFixed(6)}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildNotesSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Additional Notes',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            FormBuilderTextField(
              name: 'notes',
              decoration: const InputDecoration(
                labelText: 'Notes',
                prefixIcon: Icon(Icons.note),
                hintText: 'Add any additional information about this lead...',
              ),
              maxLines: 4,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _saveLead() async {
    if (_formKey.currentState?.saveAndValidate() ?? false) {
      setState(() {
        _isLoading = true;
      });

      final formData = _formKey.currentState!.value;
      final user = context.read<AuthBloc>().state;
      String assignedTo = '';
      
      if (user is AuthAuthenticated) {
        assignedTo = user.user.id;
      }

      final lead = Lead(
        id: widget.lead?.id ?? 'local_${DateTime.now().millisecondsSinceEpoch}',
        customerName: formData['customerName'],
        customerPhone: formData['customerPhone'],
        customerEmail: formData['customerEmail'],
        source: formData['source'],
        status: formData['status'],
        address: formData['address'] ?? _address,
        latitude: _latitude,
        longitude: _longitude,
        notes: formData['notes'],
        assignedTo: assignedTo,
        createdAt: widget.lead?.createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
      );

      if (widget.lead == null) {
        context.read<LeadsBloc>().add(CreateLead(lead));
      } else {
        context.read<LeadsBloc>().add(UpdateLead(lead));
      }

      setState(() {
        _isLoading = false;
      });
    }
  }
}
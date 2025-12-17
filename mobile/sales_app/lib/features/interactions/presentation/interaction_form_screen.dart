import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:form_builder_validators/form_builder_validators.dart';
import '../bloc/interactions_bloc.dart';
import '../../../models/customer_interaction.dart';
import '../../../models/lead.dart';

class InteractionFormScreen extends StatefulWidget {
  final Lead lead;
  final String interactionType;
  final CustomerInteraction? interaction;

  const InteractionFormScreen({
    super.key,
    required this.lead,
    required this.interactionType,
    this.interaction,
  });

  @override
  State<InteractionFormScreen> createState() => _InteractionFormScreenState();
}

class _InteractionFormScreenState extends State<InteractionFormScreen> {
  final _formKey = GlobalKey<FormBuilderState>();
  bool _isLoading = false;
  DateTime _scheduledDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    if (widget.interaction != null) {
      _scheduledDate = widget.interaction!.scheduledAt;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.interaction == null ? 'Log' : 'Edit'} ${_getInteractionTypeLabel()}'),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveInteraction,
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
      body: BlocListener<InteractionsBloc, InteractionsState>(
        listener: (context, state) {
          if (state is InteractionCreated || state is InteractionUpdated) {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  widget.interaction == null 
                      ? 'Interaction logged successfully' 
                      : 'Interaction updated successfully',
                ),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is InteractionsError) {
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
            initialValue: widget.interaction != null ? {
              'subject': widget.interaction!.subject,
              'direction': widget.interaction!.direction,
              'description': widget.interaction!.description,
              'status': widget.interaction!.status,
            } : {
              'direction': 'OUTBOUND',
              'status': 'SCHEDULED',
            },
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLeadInfoCard(),
                const SizedBox(height: 16),
                _buildInteractionDetailsSection(),
                const SizedBox(height: 16),
                _buildSchedulingSection(),
                const SizedBox(height: 16),
                _buildDescriptionSection(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLeadInfoCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _getInteractionIcon(),
                const SizedBox(width: 8),
                Text(
                  'Customer Information',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text('Customer: ${widget.lead.customerName}'),
            if (widget.lead.customerPhone != null)
              Text('Phone: ${widget.lead.customerPhone}'),
            if (widget.lead.customerEmail != null)
              Text('Email: ${widget.lead.customerEmail}'),
          ],
        ),
      ),
    );
  }

  Widget _buildInteractionDetailsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Interaction Details',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            FormBuilderTextField(
              name: 'subject',
              decoration: InputDecoration(
                labelText: 'Subject *',
                prefixIcon: const Icon(Icons.title),
                hintText: 'Brief description of the ${_getInteractionTypeLabel().toLowerCase()}',
              ),
              validator: FormBuilderValidators.compose([
                FormBuilderValidators.required(),
                FormBuilderValidators.minLength(3),
              ]),
            ),
            const SizedBox(height: 16),
            FormBuilderDropdown<String>(
              name: 'direction',
              decoration: const InputDecoration(
                labelText: 'Direction *',
                prefixIcon: Icon(Icons.swap_horiz),
              ),
              validator: FormBuilderValidators.required(),
              items: const [
                DropdownMenuItem(value: 'OUTBOUND', child: Text('Outbound (We initiated)')),
                DropdownMenuItem(value: 'INBOUND', child: Text('Inbound (Customer initiated)')),
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
                DropdownMenuItem(value: 'SCHEDULED', child: Text('Scheduled')),
                DropdownMenuItem(value: 'COMPLETED', child: Text('Completed')),
                DropdownMenuItem(value: 'CANCELLED', child: Text('Cancelled')),
                DropdownMenuItem(value: 'NO_RESPONSE', child: Text('No Response')),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSchedulingSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Scheduling',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.calendar_today),
              title: const Text('Date & Time'),
              subtitle: Text(_formatDateTime(_scheduledDate)),
              trailing: const Icon(Icons.edit),
              onTap: _selectDateTime,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDescriptionSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Description',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            FormBuilderTextField(
              name: 'description',
              decoration: InputDecoration(
                labelText: 'Description',
                prefixIcon: const Icon(Icons.note),
                hintText: 'Detailed notes about the ${_getInteractionTypeLabel().toLowerCase()}...',
              ),
              maxLines: 4,
            ),
          ],
        ),
      ),
    );
  }

  Widget _getInteractionIcon() {
    IconData icon;
    Color color;
    
    switch (widget.interactionType) {
      case 'CALL':
        icon = Icons.phone;
        color = Colors.green;
        break;
      case 'EMAIL':
        icon = Icons.email;
        color = Colors.blue;
        break;
      case 'WHATSAPP':
        icon = Icons.message;
        color = Colors.green[700]!;
        break;
      case 'SMS':
        icon = Icons.sms;
        color = Colors.orange;
        break;
      case 'MEETING':
        icon = Icons.meeting_room;
        color = Colors.purple;
        break;
      case 'SITE_VISIT':
        icon = Icons.location_on;
        color = Colors.red;
        break;
      default:
        icon = Icons.help_outline;
        color = Colors.grey;
    }

    return CircleAvatar(
      radius: 20,
      backgroundColor: color.withOpacity(0.1),
      child: Icon(icon, color: color),
    );
  }

  String _getInteractionTypeLabel() {
    switch (widget.interactionType) {
      case 'CALL':
        return 'Phone Call';
      case 'EMAIL':
        return 'Email';
      case 'WHATSAPP':
        return 'WhatsApp';
      case 'SMS':
        return 'SMS';
      case 'MEETING':
        return 'Meeting';
      case 'SITE_VISIT':
        return 'Site Visit';
      default:
        return 'Interaction';
    }
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} at ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  Future<void> _selectDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _scheduledDate,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (date != null) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(_scheduledDate),
      );

      if (time != null) {
        setState(() {
          _scheduledDate = DateTime(
            date.year,
            date.month,
            date.day,
            time.hour,
            time.minute,
          );
        });
      }
    }
  }

  Future<void> _saveInteraction() async {
    if (_formKey.currentState?.saveAndValidate() ?? false) {
      setState(() {
        _isLoading = true;
      });

      final formData = _formKey.currentState!.value;

      final interaction = CustomerInteraction(
        id: widget.interaction?.id ?? 'local_${DateTime.now().millisecondsSinceEpoch}',
        leadId: widget.lead.id,
        customerId: widget.lead.customerId,
        interactionType: widget.interactionType,
        direction: formData['direction'],
        subject: formData['subject'],
        description: formData['description'],
        scheduledAt: _scheduledDate,
        completedAt: formData['status'] == 'COMPLETED' ? DateTime.now() : null,
        status: formData['status'],
        createdBy: 'current_user', // TODO: Get from auth
        createdAt: widget.interaction?.createdAt ?? DateTime.now(),
      );

      if (widget.interaction == null) {
        context.read<InteractionsBloc>().add(CreateInteraction(interaction));
      } else {
        context.read<InteractionsBloc>().add(UpdateInteraction(interaction));
      }

      setState(() {
        _isLoading = false;
      });
    }
  }
}
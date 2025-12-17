import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/interactions_bloc.dart';
import '../../../models/customer_interaction.dart';
import '../../../models/lead.dart';
import 'interaction_form_screen.dart';

class InteractionsScreen extends StatefulWidget {
  final String? leadId;

  const InteractionsScreen({super.key, this.leadId});

  @override
  State<InteractionsScreen> createState() => _InteractionsScreenState();
}

class _InteractionsScreenState extends State<InteractionsScreen> {
  @override
  void initState() {
    super.initState();
    context.read<InteractionsBloc>().add(LoadInteractions(leadId: widget.leadId));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.leadId != null ? 'Lead Interactions' : 'All Interactions'),
        actions: [
          IconButton(
            onPressed: () {
              context.read<InteractionsBloc>().add(LoadInteractions(leadId: widget.leadId));
            },
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: BlocBuilder<InteractionsBloc, InteractionsState>(
        builder: (context, state) {
          if (state is InteractionsLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is InteractionsLoaded) {
            return _buildInteractionsList(state.interactions);
          } else if (state is InteractionsError) {
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
                      context.read<InteractionsBloc>().add(LoadInteractions(leadId: widget.leadId));
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }
          return const Center(child: Text('No interactions found'));
        },
      ),
      floatingActionButton: widget.leadId != null
          ? FloatingActionButton(
              onPressed: () {
                _showInteractionTypeDialog();
              },
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  Widget _buildInteractionsList(List<CustomerInteraction> interactions) {
    if (interactions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.history,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No interactions found',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              widget.leadId != null
                  ? 'Tap the + button to log an interaction'
                  : 'No customer interactions recorded yet',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: interactions.length,
      itemBuilder: (context, index) {
        final interaction = interactions[index];
        return _InteractionCard(
          interaction: interaction,
          onTap: () => _showInteractionDetails(interaction),
        );
      },
    );
  }

  void _showInteractionTypeDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Interaction Type'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _InteractionTypeOption(
              icon: Icons.phone,
              title: 'Phone Call',
              subtitle: 'Log a phone conversation',
              onTap: () => _navigateToInteractionForm('CALL'),
            ),
            _InteractionTypeOption(
              icon: Icons.email,
              title: 'Email',
              subtitle: 'Record email communication',
              onTap: () => _navigateToInteractionForm('EMAIL'),
            ),
            _InteractionTypeOption(
              icon: Icons.message,
              title: 'WhatsApp',
              subtitle: 'Log WhatsApp conversation',
              onTap: () => _navigateToInteractionForm('WHATSAPP'),
            ),
            _InteractionTypeOption(
              icon: Icons.meeting_room,
              title: 'Meeting',
              subtitle: 'Record in-person meeting',
              onTap: () => _navigateToInteractionForm('MEETING'),
            ),
            _InteractionTypeOption(
              icon: Icons.location_on,
              title: 'Site Visit',
              subtitle: 'Log customer site visit',
              onTap: () => _navigateToInteractionForm('SITE_VISIT'),
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToInteractionForm(String type) {
    Navigator.pop(context); // Close dialog
    
    // Create a dummy lead for demo purposes
    final dummyLead = Lead(
      id: widget.leadId ?? 'demo_lead',
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
        builder: (context) => InteractionFormScreen(
          lead: dummyLead,
          interactionType: type,
        ),
      ),
    );
  }

  void _showInteractionDetails(CustomerInteraction interaction) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(interaction.subject),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _DetailRow('Type', interaction.interactionType),
            _DetailRow('Direction', interaction.direction),
            _DetailRow('Status', interaction.status),
            if (interaction.outcome != null)
              _DetailRow('Outcome', interaction.outcome!),
            if (interaction.description != null) ...[
              const SizedBox(height: 8),
              const Text('Description:', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(interaction.description!),
            ],
            if (interaction.nextAction != null) ...[
              const SizedBox(height: 8),
              const Text('Next Action:', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(interaction.nextAction!),
            ],
          ],
        ),
        actions: [
          if (interaction.status != 'COMPLETED')
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                _completeInteraction(interaction);
              },
              child: const Text('Mark Complete'),
            ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _completeInteraction(CustomerInteraction interaction) {
    showDialog(
      context: context,
      builder: (context) => _CompleteInteractionDialog(
        interaction: interaction,
        onComplete: (outcome, nextAction, nextFollowUp) {
          context.read<InteractionsBloc>().add(
            CompleteInteraction(
              interactionId: interaction.id,
              outcome: outcome,
              nextAction: nextAction,
              nextFollowUp: nextFollowUp,
            ),
          );
        },
      ),
    );
  }
}

class _InteractionCard extends StatelessWidget {
  final CustomerInteraction interaction;
  final VoidCallback onTap;

  const _InteractionCard({
    required this.interaction,
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
                  _InteractionTypeIcon(type: interaction.interactionType),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      interaction.subject,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  _StatusChip(status: interaction.status),
                ],
              ),
              const SizedBox(height: 8),
              if (interaction.description != null)
                Text(
                  interaction.description!,
                  style: Theme.of(context).textTheme.bodyMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    interaction.direction == 'INBOUND' ? Icons.call_received : Icons.call_made,
                    size: 16,
                    color: Colors.grey,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    interaction.direction,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const Spacer(),
                  Text(
                    _formatDate(interaction.scheduledAt),
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

class _InteractionTypeIcon extends StatelessWidget {
  final String type;

  const _InteractionTypeIcon({required this.type});

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color color;
    
    switch (type) {
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
      radius: 16,
      backgroundColor: color.withOpacity(0.1),
      child: Icon(icon, size: 16, color: color),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status) {
      case 'SCHEDULED':
        color = Colors.blue;
        break;
      case 'COMPLETED':
        color = Colors.green;
        break;
      case 'CANCELLED':
        color = Colors.red;
        break;
      case 'NO_RESPONSE':
        color = Colors.orange;
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

class _InteractionTypeOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _InteractionTypeOption({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: Text(subtitle),
      onTap: onTap,
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}

class _CompleteInteractionDialog extends StatefulWidget {
  final CustomerInteraction interaction;
  final Function(String outcome, String? nextAction, DateTime? nextFollowUp) onComplete;

  const _CompleteInteractionDialog({
    required this.interaction,
    required this.onComplete,
  });

  @override
  State<_CompleteInteractionDialog> createState() => _CompleteInteractionDialogState();
}

class _CompleteInteractionDialogState extends State<_CompleteInteractionDialog> {
  String _selectedOutcome = 'INTERESTED';
  final TextEditingController _nextActionController = TextEditingController();
  DateTime? _nextFollowUp;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Complete Interaction'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          DropdownButtonFormField<String>(
            value: _selectedOutcome,
            decoration: const InputDecoration(labelText: 'Outcome'),
            items: const [
              DropdownMenuItem(value: 'INTERESTED', child: Text('Interested')),
              DropdownMenuItem(value: 'NOT_INTERESTED', child: Text('Not Interested')),
              DropdownMenuItem(value: 'FOLLOW_UP_REQUIRED', child: Text('Follow-up Required')),
              DropdownMenuItem(value: 'CONVERTED', child: Text('Converted')),
            ],
            onChanged: (value) {
              setState(() {
                _selectedOutcome = value!;
              });
            },
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _nextActionController,
            decoration: const InputDecoration(
              labelText: 'Next Action (Optional)',
              hintText: 'What should be done next?',
            ),
            maxLines: 2,
          ),
          const SizedBox(height: 16),
          ListTile(
            title: const Text('Next Follow-up Date'),
            subtitle: Text(_nextFollowUp?.toString().split(' ')[0] ?? 'Not set'),
            trailing: const Icon(Icons.calendar_today),
            onTap: () async {
              final date = await showDatePicker(
                context: context,
                initialDate: DateTime.now().add(const Duration(days: 7)),
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 365)),
              );
              if (date != null) {
                setState(() {
                  _nextFollowUp = date;
                });
              }
            },
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            widget.onComplete(
              _selectedOutcome,
              _nextActionController.text.isNotEmpty ? _nextActionController.text : null,
              _nextFollowUp,
            );
            Navigator.pop(context);
          },
          child: const Text('Complete'),
        ),
      ],
    );
  }
}
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../blocs/qc/qc_bloc.dart';
import '../blocs/qc/qc_event.dart';
import '../blocs/qc/qc_state.dart';

class QCChecklistScreen extends StatefulWidget {
  const QCChecklistScreen({super.key});

  @override
  State<QCChecklistScreen> createState() => _QCChecklistScreenState();
}

class _QCChecklistScreenState extends State<QCChecklistScreen> {
  final _formKey = GlobalKey<FormState>();
  final Map<String, dynamic> _checklistData = {};
  
  final List<Map<String, dynamic>> _qcStages = [
    {
      'stage': 'Cutting',
      'checks': [
        'Material dimensions accurate',
        'Cut quality acceptable',
        'No burrs or sharp edges',
        'Proper material identification',
      ]
    },
    {
      'stage': 'Fabrication',
      'checks': [
        'Welding quality meets standards',
        'Joint strength adequate',
        'Dimensional accuracy maintained',
        'Surface finish acceptable',
      ]
    },
    {
      'stage': 'Coating',
      'checks': [
        'Surface preparation complete',
        'Coating thickness uniform',
        'No defects or bubbles',
        'Color match specification',
      ]
    },
    {
      'stage': 'Assembly',
      'checks': [
        'All components present',
        'Hardware properly installed',
        'Alignment correct',
        'Operation smooth',
      ]
    },
  ];

  @override
  void initState() {
    super.initState();
    // Initialize checklist data
    for (var stage in _qcStages) {
      _checklistData[stage['stage']] = {};
      for (var check in stage['checks']) {
        _checklistData[stage['stage']][check] = false;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('QC Checklist'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/dashboard'),
        ),
      ),
      body: BlocListener<QCBloc, QCState>(
        listener: (context, state) {
          if (state is QCChecklistSubmitted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('QC Checklist submitted successfully!'),
                backgroundColor: Colors.green,
              ),
            );
            context.go('/dashboard');
          } else if (state is QCError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Error: ${state.message}'),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        child: BlocBuilder<QCBloc, QCState>(
          builder: (context, state) {
            return Form(
              key: _formKey,
              child: Column(
                children: [
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16.0),
                      itemCount: _qcStages.length,
                      itemBuilder: (context, index) {
                        final stage = _qcStages[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 16.0),
                          child: ExpansionTile(
                            title: Text(
                              stage['stage'],
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            children: [
                              Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  children: (stage['checks'] as List<String>)
                                      .map((check) => CheckboxListTile(
                                            title: Text(check),
                                            value: _checklistData[stage['stage']][check],
                                            onChanged: (bool? value) {
                                              setState(() {
                                                _checklistData[stage['stage']][check] = value ?? false;
                                              });
                                            },
                                          ))
                                      .toList(),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        TextFormField(
                          decoration: const InputDecoration(
                            labelText: 'Order Number',
                            border: OutlineInputBorder(),
                          ),
                          onSaved: (value) {
                            _checklistData['orderNumber'] = value;
                          },
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter order number';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          decoration: const InputDecoration(
                            labelText: 'Inspector Notes',
                            border: OutlineInputBorder(),
                          ),
                          maxLines: 3,
                          onSaved: (value) {
                            _checklistData['notes'] = value;
                          },
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton(
                            onPressed: state is QCLoading
                                ? null
                                : () {
                                    if (_formKey.currentState!.validate()) {
                                      _formKey.currentState!.save();
                                      
                                      // Format data according to backend API expectations
                                      final checklistItems = <Map<String, dynamic>>[];
                                      
                                      // Convert checklist data to expected format
                                      _checklistData.forEach((stage, checks) {
                                        if (checks is Map<String, dynamic>) {
                                          checks.forEach((checkName, passed) {
                                            if (passed is bool) {
                                              checklistItems.add({
                                                'checkpointId': '${stage}_${checkName.hashCode}',
                                                'description': checkName,
                                                'expectedValue': 'Pass',
                                                'actualValue': passed ? 'Pass' : 'Fail',
                                                'status': passed ? 'PASS' : 'FAIL',
                                                'comments': _checklistData['notes'] ?? '',
                                              });
                                            }
                                          });
                                        }
                                      });
                                      
                                      final submissionData = {
                                        'productionOrderId': 'temp-order-id', // You'll need to get this from somewhere
                                        'stage': 'CUTTING', // Default stage, could be dynamic
                                        'checklistItems': checklistItems,
                                      };
                                      
                                      context.read<QCBloc>().add(
                                        QCSubmitChecklist(submissionData),
                                      );
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                            ),
                            child: state is QCLoading
                                ? const CircularProgressIndicator(color: Colors.white)
                                : const Text(
                                    'Submit QC Checklist',
                                    style: TextStyle(fontSize: 16),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
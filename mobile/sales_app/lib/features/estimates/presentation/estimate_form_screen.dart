import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:form_builder_validators/form_builder_validators.dart';
import '../bloc/estimates_bloc.dart';
import '../../../models/estimate.dart';
import '../../../models/lead.dart';

class EstimateFormScreen extends StatefulWidget {
  final Lead lead;
  final Estimate? estimate;

  const EstimateFormScreen({
    super.key,
    required this.lead,
    this.estimate,
  });

  @override
  State<EstimateFormScreen> createState() => _EstimateFormScreenState();
}

class _EstimateFormScreenState extends State<EstimateFormScreen> {
  final _formKey = GlobalKey<FormBuilderState>();
  bool _isLoading = false;
  bool _isCalculating = false;
  Map<String, dynamic>? _calculationResult;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.estimate == null ? 'New Estimate' : 'Edit Estimate'),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveEstimate,
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
      body: BlocListener<EstimatesBloc, EstimatesState>(
        listener: (context, state) {
          if (state is EstimateCreated || state is EstimateUpdated) {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  widget.estimate == null 
                      ? 'Estimate created successfully' 
                      : 'Estimate updated successfully',
                ),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is EstimatesError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          } else if (state is EstimateCalculated) {
            setState(() {
              _calculationResult = state.calculation;
              _isCalculating = false;
            });
          }
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: FormBuilder(
            key: _formKey,
            initialValue: widget.estimate != null ? {
              'productType': widget.estimate!.productType,
              'width': widget.estimate!.width.toString(),
              'height': widget.estimate!.height.toString(),
              'coatingType': widget.estimate!.coatingType,
              'hardwareType': widget.estimate!.hardwareType,
            } : {},
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLeadInfoCard(),
                const SizedBox(height: 16),
                _buildProductDetailsSection(),
                const SizedBox(height: 16),
                _buildDimensionsSection(),
                const SizedBox(height: 16),
                _buildSpecificationsSection(),
                const SizedBox(height: 16),
                _buildCalculationSection(),
                if (_calculationResult != null) ...[
                  const SizedBox(height: 16),
                  _buildCostBreakdownCard(),
                ],
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
            Text(
              'Lead Information',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text('Customer: ${widget.lead.customerName}'),
            if (widget.lead.customerPhone != null)
              Text('Phone: ${widget.lead.customerPhone}'),
            if (widget.lead.address != null)
              Text('Address: ${widget.lead.address}'),
          ],
        ),
      ),
    );
  }

  Widget _buildProductDetailsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Product Details',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            FormBuilderDropdown<String>(
              name: 'productType',
              decoration: const InputDecoration(
                labelText: 'Product Type *',
                prefixIcon: Icon(Icons.category),
              ),
              validator: FormBuilderValidators.required(),
              items: const [
                DropdownMenuItem(value: 'DOOR', child: Text('Door')),
                DropdownMenuItem(value: 'WINDOW', child: Text('Window')),
                DropdownMenuItem(value: 'FRAME', child: Text('Frame')),
              ],
              onChanged: (value) => _onFormChanged(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDimensionsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Dimensions',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: FormBuilderTextField(
                    name: 'width',
                    decoration: const InputDecoration(
                      labelText: 'Width (mm) *',
                      prefixIcon: Icon(Icons.width_normal),
                    ),
                    keyboardType: TextInputType.number,
                    validator: FormBuilderValidators.compose([
                      FormBuilderValidators.required(),
                      FormBuilderValidators.numeric(),
                      FormBuilderValidators.min(1),
                    ]),
                    onChanged: (value) => _onFormChanged(),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: FormBuilderTextField(
                    name: 'height',
                    decoration: const InputDecoration(
                      labelText: 'Height (mm) *',
                      prefixIcon: Icon(Icons.height),
                    ),
                    keyboardType: TextInputType.number,
                    validator: FormBuilderValidators.compose([
                      FormBuilderValidators.required(),
                      FormBuilderValidators.numeric(),
                      FormBuilderValidators.min(1),
                    ]),
                    onChanged: (value) => _onFormChanged(),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSpecificationsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Specifications',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            FormBuilderDropdown<String>(
              name: 'coatingType',
              decoration: const InputDecoration(
                labelText: 'Coating Type *',
                prefixIcon: Icon(Icons.palette),
              ),
              validator: FormBuilderValidators.required(),
              items: const [
                DropdownMenuItem(value: 'POWDER_COATING', child: Text('Powder Coating')),
                DropdownMenuItem(value: 'ANODIZED', child: Text('Anodized')),
                DropdownMenuItem(value: 'PAINT', child: Text('Paint')),
              ],
              onChanged: (value) => _onFormChanged(),
            ),
            const SizedBox(height: 16),
            FormBuilderDropdown<String>(
              name: 'hardwareType',
              decoration: const InputDecoration(
                labelText: 'Hardware Type *',
                prefixIcon: Icon(Icons.build),
              ),
              validator: FormBuilderValidators.required(),
              items: const [
                DropdownMenuItem(value: 'STANDARD', child: Text('Standard')),
                DropdownMenuItem(value: 'PREMIUM', child: Text('Premium')),
                DropdownMenuItem(value: 'LUXURY', child: Text('Luxury')),
              ],
              onChanged: (value) => _onFormChanged(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCalculationSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Cost Calculation',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isCalculating ? null : _calculateEstimate,
                icon: _isCalculating
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.calculate),
                label: Text(_isCalculating ? 'Calculating...' : 'Calculate Estimate'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCostBreakdownCard() {
    if (_calculationResult == null) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Cost Breakdown',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildCostRow('Material Cost', _calculationResult!['materialCost']),
            _buildCostRow('Coating Cost', _calculationResult!['coatingCost']),
            _buildCostRow('Hardware Cost', _calculationResult!['hardwareCost']),
            _buildCostRow('Labor Cost', _calculationResult!['laborCost']),
            const Divider(),
            _buildCostRow(
              'Total Cost',
              _calculationResult!['totalCost'],
              isTotal: true,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info, color: Colors.blue, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Area: ${_calculationResult!['area'].toStringAsFixed(2)} sq.m',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCostRow(String label, double amount, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            '₹${amount.toStringAsFixed(2)}',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              color: isTotal ? Colors.green : null,
            ),
          ),
        ],
      ),
    );
  }

  void _onFormChanged() {
    // Clear calculation result when form changes
    if (_calculationResult != null) {
      setState(() {
        _calculationResult = null;
      });
    }
  }

  void _calculateEstimate() {
    if (_formKey.currentState?.saveAndValidate() ?? false) {
      setState(() {
        _isCalculating = true;
      });

      final formData = _formKey.currentState!.value;
      
      context.read<EstimatesBloc>().add(
        CalculateEstimate(
          productType: formData['productType'],
          width: double.parse(formData['width']),
          height: double.parse(formData['height']),
          coatingType: formData['coatingType'],
          hardwareType: formData['hardwareType'],
          specifications: {},
        ),
      );
    }
  }

  void _saveEstimate() {
    if (_formKey.currentState?.saveAndValidate() ?? false) {
      if (_calculationResult == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please calculate the estimate first'),
            backgroundColor: Colors.orange,
          ),
        );
        return;
      }

      setState(() {
        _isLoading = true;
      });

      final formData = _formKey.currentState!.value;

      final estimate = Estimate(
        id: widget.estimate?.id ?? 'local_${DateTime.now().millisecondsSinceEpoch}',
        leadId: widget.lead.id,
        customerId: widget.lead.customerId,
        productType: formData['productType'],
        width: double.parse(formData['width']),
        height: double.parse(formData['height']),
        coatingType: formData['coatingType'],
        hardwareType: formData['hardwareType'],
        specifications: {},
        materialCost: _calculationResult!['materialCost'],
        laborCost: _calculationResult!['laborCost'],
        hardwareCost: _calculationResult!['hardwareCost'],
        coatingCost: _calculationResult!['coatingCost'],
        totalCost: _calculationResult!['totalCost'],
        finalAmount: _calculationResult!['finalAmount'],
        status: 'DRAFT',
        createdBy: 'current_user', // TODO: Get from auth
        createdAt: widget.estimate?.createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
      );

      if (widget.estimate == null) {
        context.read<EstimatesBloc>().add(CreateEstimate(estimate));
      } else {
        context.read<EstimatesBloc>().add(UpdateEstimate(estimate));
      }

      setState(() {
        _isLoading = false;
      });
    }
  }
}
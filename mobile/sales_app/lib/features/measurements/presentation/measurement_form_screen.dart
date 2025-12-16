import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:form_builder_validators/form_builder_validators.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../bloc/measurements_bloc.dart';
import '../../../models/measurement.dart';
import '../../../models/lead.dart';
import '../../../services/location_service.dart';

class MeasurementFormScreen extends StatefulWidget {
  final Lead lead;
  final SiteMeasurement? measurement;

  const MeasurementFormScreen({
    super.key,
    required this.lead,
    this.measurement,
  });

  @override
  State<MeasurementFormScreen> createState() => _MeasurementFormScreenState();
}

class _MeasurementFormScreenState extends State<MeasurementFormScreen> {
  final _formKey = GlobalKey<FormBuilderState>();
  final LocationService _locationService = LocationService();
  final ImagePicker _imagePicker = ImagePicker();
  
  bool _isLoading = false;
  double? _latitude;
  double? _longitude;
  String? _address;
  List<String> _photos = [];

  @override
  void initState() {
    super.initState();
    if (widget.measurement == null) {
      _getCurrentLocation();
    } else {
      _latitude = widget.measurement!.latitude;
      _longitude = widget.measurement!.longitude;
      _address = widget.measurement!.address;
      _photos = List.from(widget.measurement!.photos);
    }
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
        title: Text(widget.measurement == null ? 'New Measurement' : 'Edit Measurement'),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveMeasurement,
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
      body: BlocListener<MeasurementsBloc, MeasurementsState>(
        listener: (context, state) {
          if (state is MeasurementCreated || state is MeasurementUpdated) {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  widget.measurement == null 
                      ? 'Measurement created successfully' 
                      : 'Measurement updated successfully',
                ),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is MeasurementsError) {
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
            initialValue: widget.measurement != null ? {
              'measurementType': widget.measurement!.measurementType,
              'width': widget.measurement!.width.toString(),
              'height': widget.measurement!.height.toString(),
              'depth': widget.measurement!.depth?.toString(),
              'unit': widget.measurement!.unit,
              'notes': widget.measurement!.notes,
            } : {
              'unit': 'MM',
            },
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLeadInfoCard(),
                const SizedBox(height: 16),
                _buildMeasurementDetailsSection(),
                const SizedBox(height: 16),
                _buildDimensionsSection(),
                const SizedBox(height: 16),
                _buildLocationSection(),
                const SizedBox(height: 16),
                _buildPhotosSection(),
                const SizedBox(height: 16),
                _buildNotesSection(),
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

  Widget _buildMeasurementDetailsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Measurement Details',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            FormBuilderDropdown<String>(
              name: 'measurementType',
              decoration: const InputDecoration(
                labelText: 'Measurement Type *',
                prefixIcon: Icon(Icons.category),
              ),
              validator: FormBuilderValidators.required(),
              items: const [
                DropdownMenuItem(value: 'DOOR', child: Text('Door')),
                DropdownMenuItem(value: 'WINDOW', child: Text('Window')),
                DropdownMenuItem(value: 'FRAME', child: Text('Frame')),
              ],
            ),
            const SizedBox(height: 16),
            FormBuilderDropdown<String>(
              name: 'unit',
              decoration: const InputDecoration(
                labelText: 'Unit *',
                prefixIcon: Icon(Icons.straighten),
              ),
              validator: FormBuilderValidators.required(),
              items: const [
                DropdownMenuItem(value: 'MM', child: Text('Millimeters (mm)')),
                DropdownMenuItem(value: 'CM', child: Text('Centimeters (cm)')),
                DropdownMenuItem(value: 'INCH', child: Text('Inches')),
              ],
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
                      labelText: 'Width *',
                      prefixIcon: Icon(Icons.width_normal),
                    ),
                    keyboardType: TextInputType.number,
                    validator: FormBuilderValidators.compose([
                      FormBuilderValidators.required(),
                      FormBuilderValidators.numeric(),
                      FormBuilderValidators.min(1),
                    ]),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: FormBuilderTextField(
                    name: 'height',
                    decoration: const InputDecoration(
                      labelText: 'Height *',
                      prefixIcon: Icon(Icons.height),
                    ),
                    keyboardType: TextInputType.number,
                    validator: FormBuilderValidators.compose([
                      FormBuilderValidators.required(),
                      FormBuilderValidators.numeric(),
                      FormBuilderValidators.min(1),
                    ]),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            FormBuilderTextField(
              name: 'depth',
              decoration: const InputDecoration(
                labelText: 'Depth (Optional)',
                prefixIcon: Icon(Icons.architecture),
              ),
              keyboardType: TextInputType.number,
              validator: FormBuilderValidators.compose([
                FormBuilderValidators.numeric(),
              ]),
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
                  label: const Text('Update Location'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_address != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.location_on, color: Colors.green, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          'Current Location',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(_address!),
                    if (_latitude != null && _longitude != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Coordinates: ${_latitude!.toStringAsFixed(6)}, ${_longitude!.toStringAsFixed(6)}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ],
                ),
              ),
            ] else ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.location_off, color: Colors.orange, size: 16),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text('Location not captured. Tap "Update Location" to get current location.'),
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

  Widget _buildPhotosSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Photos',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                TextButton.icon(
                  onPressed: _addPhoto,
                  icon: const Icon(Icons.add_a_photo),
                  label: const Text('Add Photo'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_photos.isEmpty) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.withOpacity(0.3)),
                ),
                child: Column(
                  children: [
                    Icon(Icons.photo_camera, size: 48, color: Colors.grey[400]),
                    const SizedBox(height: 8),
                    Text(
                      'No photos added',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Tap "Add Photo" to capture measurement photos',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
              ),
            ] else ...[
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemCount: _photos.length,
                itemBuilder: (context, index) {
                  return Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(
                          File(_photos[index]),
                          width: double.infinity,
                          height: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: () => _removePhoto(index),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.close,
                              color: Colors.white,
                              size: 16,
                            ),
                          ),
                        ),
                      ),
                    ],
                  );
                },
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
                hintText: 'Add any additional information about this measurement...',
              ),
              maxLines: 4,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _addPhoto() async {
    final XFile? photo = await _imagePicker.pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
    );
    
    if (photo != null) {
      setState(() {
        _photos.add(photo.path);
      });
    }
  }

  void _removePhoto(int index) {
    setState(() {
      _photos.removeAt(index);
    });
  }

  Future<void> _saveMeasurement() async {
    if (_formKey.currentState?.saveAndValidate() ?? false) {
      if (_latitude == null || _longitude == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please capture location before saving'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      setState(() {
        _isLoading = true;
      });

      final formData = _formKey.currentState!.value;

      final measurement = SiteMeasurement(
        id: widget.measurement?.id ?? 'local_${DateTime.now().millisecondsSinceEpoch}',
        leadId: widget.lead.id,
        customerId: widget.lead.customerId,
        measurementType: formData['measurementType'],
        width: double.parse(formData['width']),
        height: double.parse(formData['height']),
        depth: formData['depth'] != null && formData['depth'].isNotEmpty 
            ? double.parse(formData['depth']) 
            : null,
        unit: formData['unit'],
        latitude: _latitude!,
        longitude: _longitude!,
        address: _address ?? 'Unknown Location',
        photos: _photos,
        notes: formData['notes'],
        measuredBy: 'current_user', // TODO: Get from auth
        measuredAt: DateTime.now(),
      );

      if (widget.measurement == null) {
        context.read<MeasurementsBloc>().add(CreateMeasurement(measurement));
      } else {
        context.read<MeasurementsBloc>().add(UpdateMeasurement(measurement));
      }

      setState(() {
        _isLoading = false;
      });
    }
  }
}
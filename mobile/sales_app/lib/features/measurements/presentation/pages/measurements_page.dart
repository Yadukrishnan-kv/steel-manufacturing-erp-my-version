import 'package:flutter/material.dart';

class MeasurementsPage extends StatelessWidget {
  const MeasurementsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Site Measurements'),
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.straighten,
              size: 64,
              color: Colors.green,
            ),
            SizedBox(height: 16),
            Text(
              'Site Measurements',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Geo-tagged site measurement with photo capture will be implemented here.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Start measurement
        },
        child: const Icon(Icons.camera_alt),
      ),
    );
  }
}
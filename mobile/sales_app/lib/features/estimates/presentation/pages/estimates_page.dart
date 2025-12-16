import 'package:flutter/material.dart';

class EstimatesPage extends StatelessWidget {
  const EstimatesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Estimates'),
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.calculate,
              size: 64,
              color: Colors.orange,
            ),
            SizedBox(height: 16),
            Text(
              'Estimation Engine',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Pricing calculation based on size, coating, hardware, and labor will be implemented here.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Create estimate
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
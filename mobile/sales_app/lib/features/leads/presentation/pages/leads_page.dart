import 'package:flutter/material.dart';

class LeadsPage extends StatelessWidget {
  const LeadsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Leads'),
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.people,
              size: 64,
              color: Colors.blue,
            ),
            SizedBox(height: 16),
            Text(
              'Lead Management',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Lead capture and management features will be implemented here.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Add new lead
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
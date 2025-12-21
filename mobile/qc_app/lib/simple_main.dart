import 'package:flutter/material.dart';

void main() {
  runApp(const SimpleQCApp());
}

class SimpleQCApp extends StatelessWidget {
  const SimpleQCApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Steel ERP - QC',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const QCHomePage(),
    );
  }
}

class QCHomePage extends StatelessWidget {
  const QCHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quality Control'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.verified,
              size: 100,
              color: Colors.green,
            ),
            SizedBox(height: 20),
            Text(
              'Steel Manufacturing ERP',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),
            Text(
              'Quality Control Application',
              style: TextStyle(fontSize: 18),
            ),
            SizedBox(height: 40),
            Card(
              margin: EdgeInsets.all(20),
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Column(
                  children: [
                    Text(
                      'QC Features:',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 10),
                    Text('• Stage-specific QC checklists'),
                    Text('• Photo capture and scoring'),
                    Text('• Offline data collection'),
                    Text('• Rework order generation'),
                    Text('• Real-time status updates'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
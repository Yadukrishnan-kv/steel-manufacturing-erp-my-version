import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared/shared.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize shared dependency injection
  await setupDependencyInjection();
  
  runApp(const QCApp());
}

class QCApp extends StatelessWidget {
  const QCApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (context) => getIt<AuthBloc>()..add(AuthCheckRequested()),
        ),
      ],
      child: MaterialApp(
        title: 'Steel ERP - QC',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        home: const QCHomePage(),
      ),
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
          ],
        ),
      ),
    );
  }
}
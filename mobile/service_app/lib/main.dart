import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared/shared.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Hive for local storage
  await Hive.initFlutter();
  
  // Initialize shared dependency injection
  await setupDependencyInjection();
  
  runApp(const ServiceApp());
}

class ServiceApp extends StatelessWidget {
  const ServiceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (context) => getIt<AuthBloc>()..add(AuthCheckRequested()),
        ),
      ],
      child: MaterialApp(
        title: 'Steel ERP - Service',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        home: const ServiceHomePage(),
      ),
    );
  }
}

class ServiceHomePage extends StatelessWidget {
  const ServiceHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Service Management'),
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.build,
              size: 100,
              color: Colors.orange,
            ),
            SizedBox(height: 20),
            Text(
              'Steel Manufacturing ERP',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),
            Text(
              'Service Application',
              style: TextStyle(fontSize: 18),
            ),
          ],
        ),
      ),
    );
  }
}

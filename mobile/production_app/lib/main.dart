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
  
  runApp(const ProductionApp());
}

class ProductionApp extends StatelessWidget {
  const ProductionApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (context) => getIt<AuthBloc>()..add(AuthCheckRequested()),
        ),
      ],
      child: MaterialApp(
        title: 'Steel ERP - Production',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        home: const ProductionHomePage(),
      ),
    );
  }
}

class ProductionHomePage extends StatelessWidget {
  const ProductionHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Production Management'),
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.precision_manufacturing,
              size: 100,
              color: Colors.red,
            ),
            SizedBox(height: 20),
            Text(
              'Steel Manufacturing ERP',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),
            Text(
              'Production Application',
              style: TextStyle(fontSize: 18),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared/shared.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize shared dependency injection
  await setupDependencyInjection();
  
  runApp(const StoreApp());
}

class StoreApp extends StatelessWidget {
  const StoreApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (context) => getIt<AuthBloc>()..add(AuthCheckRequested()),
        ),
      ],
      child: MaterialApp(
        title: 'Steel ERP - Store',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        home: const StoreHomePage(),
      ),
    );
  }
}

class StoreHomePage extends StatelessWidget {
  const StoreHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Store Management'),
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.inventory,
              size: 100,
              color: Colors.purple,
            ),
            SizedBox(height: 20),
            Text(
              'Steel Manufacturing ERP',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),
            Text(
              'Store/Inventory Application',
              style: TextStyle(fontSize: 18),
            ),
          ],
        ),
      ),
    );
  }
}

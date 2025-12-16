class AppConfig {
  static const String appName = 'Steel Manufacturing ERP';
  static const String version = '1.0.0';
  
  // API Configuration
  static const String baseUrl = 'http://localhost:3000';
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
  
  // Sync Configuration
  static const Duration syncInterval = Duration(minutes: 5);
  static const int maxRetryAttempts = 3;
  static const Duration retryDelay = Duration(seconds: 5);
  
  // Storage Configuration
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String offlineDataKey = 'offline_data';
  
  // App-specific configurations
  static const Map<String, String> appConfigs = {
    'sales_app': 'Sales',
    'qc_app': 'Quality Control',
    'service_app': 'Service',
    'store_app': 'Store',
    'production_app': 'Production',
  };
  
  // Permission configurations
  static const Map<String, List<String>> appPermissions = {
    'sales_app': ['camera', 'location', 'storage'],
    'qc_app': ['camera', 'storage'],
    'service_app': ['camera', 'location', 'storage'],
    'store_app': ['camera', 'location', 'storage'],
    'production_app': ['camera', 'storage'],
  };
}
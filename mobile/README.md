# Steel Manufacturing ERP - Mobile Applications

This directory contains Flutter mobile applications for the Steel Manufacturing ERP system.

## Applications

### 1. Sales App (`sales_app/`)
- **Purpose**: Lead capture, site measurement, and estimation
- **Features**:
  - Lead management with external API integration
  - Geo-tagged site measurement with photo capture
  - Estimation calculator with offline capability
  - Customer interaction tracking
  - Data synchronization with backend

### 2. QC App (`qc_app/`)
- **Purpose**: Quality Control inspections
- **Features**:
  - Stage-specific QC checklists (cutting, fabrication, coating, assembly, dispatch, installation)
  - Photo capture and scoring functionality
  - Offline QC data collection with sync capability
  - Rework order generation
  - Real-time QC status updates

### 3. Service App (`service_app/`)
- **Purpose**: Service and installation management
- **Features**:
  - Service booking and technician assignment
  - Installation tracking with geo-tagging
  - Parts consumption tracking
  - Service completion documentation with photos and signatures
  - Customer communication features

### 4. Store App (`store_app/`)
- **Purpose**: Inventory and warehouse management
- **Features**:
  - Barcode/QR code scanning for stock transactions
  - Stock movement recording with location tracking
  - Cycle counting and stock adjustment
  - Goods receipt and put-away functionality
  - Offline inventory transaction recording

### 5. Production App (`production_app/`)
- **Purpose**: Production tracking and management
- **Features**:
  - Production order tracking and operation completion
  - Scrap recording and material consumption tracking
  - Real-time production status updates
  - Barcode scanning for material tracking
  - Production analytics and performance metrics

### 6. Shared Package (`shared/`)
- **Purpose**: Common utilities and models
- **Features**:
  - Authentication services
  - API client and network utilities
  - Storage services (local and offline)
  - Connectivity and sync services
  - Common data models

## Architecture

### State Management
- **Framework**: Flutter Bloc/Cubit
- **Pattern**: BLoC (Business Logic Component)
- **Benefits**: Predictable state management, testability, separation of concerns

### Offline Capabilities
- **Sales App**: Hive database for lead data and customer information
- **QC App**: SQLite for QC forms and inspection data
- **Service App**: Hive for service history and completion forms
- **Store App**: SQLite for inventory transactions
- **Production App**: Hive for production data recording

### Navigation
- **Framework**: GoRouter
- **Pattern**: Declarative routing
- **Benefits**: Type-safe navigation, deep linking support

### API Communication
- **HTTP Client**: Dio
- **Code Generation**: Retrofit for API clients
- **Serialization**: json_annotation and json_serializable

### Local Storage
- **Preferences**: SharedPreferences for app settings
- **Structured Data**: Hive (NoSQL) or SQLite (SQL) based on app needs
- **File Storage**: Local file system for images and documents

## Development Setup

### Prerequisites
- Flutter SDK 3.10+
- Dart SDK 3.0+
- Android Studio / VS Code
- Android SDK (for Android development)
- Xcode (for iOS development, macOS only)

### Installation
1. Install Flutter dependencies for each app:
   ```bash
   cd sales_app && flutter pub get
   cd ../qc_app && flutter pub get
   cd ../service_app && flutter pub get
   cd ../store_app && flutter pub get
   cd ../production_app && flutter pub get
   cd ../shared && flutter pub get
   ```

2. Generate code (if needed):
   ```bash
   flutter packages pub run build_runner build
   ```

### Running the Apps
```bash
# Sales App
cd sales_app && flutter run

# QC App
cd qc_app && flutter run

# Service App
cd service_app && flutter run

# Store App
cd store_app && flutter run

# Production App
cd production_app && flutter run
```

## Build Configuration

### Android
- **Target SDK**: 34
- **Min SDK**: 21
- **Build Tools**: Gradle 8.0+

### iOS
- **Deployment Target**: iOS 12.0+
- **Xcode**: 14.0+

## Testing

### Unit Tests
```bash
flutter test
```

### Widget Tests
```bash
flutter test test/widget_test.dart
```

### Integration Tests
```bash
flutter test integration_test/
```

## Deployment

### Android
```bash
flutter build apk --release
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

## Dependencies

### Core Dependencies
- `flutter_bloc`: State management
- `dio`: HTTP client
- `go_router`: Navigation
- `shared_preferences`: Local preferences
- `connectivity_plus`: Network connectivity

### App-Specific Dependencies
- **Sales App**: `geolocator`, `google_maps_flutter`, `image_picker`, `camera`, `hive`
- **QC App**: `sqflite`, `camera`, `image_picker`, `signature`
- **Service App**: `geolocator`, `google_maps_flutter`, `camera`, `signature`, `hive`
- **Store App**: `mobile_scanner`, `qr_flutter`, `sqflite`, `geolocator`
- **Production App**: `mobile_scanner`, `camera`, `hive`

## Code Generation

The apps use code generation for:
- JSON serialization (`json_serializable`)
- API clients (`retrofit_generator`)
- Local storage models (`hive_generator`)

Run code generation:
```bash
flutter packages pub run build_runner build --delete-conflicting-outputs
```

## Offline Strategy

### Data Synchronization
1. **Offline-First**: Apps work offline by default
2. **Background Sync**: Automatic sync when connectivity is restored
3. **Conflict Resolution**: Last-write-wins with manual resolution for critical data
4. **Queue Management**: Failed operations are queued for retry

### Storage Strategy
- **Transactional Data**: Stored locally and synced to backend
- **Reference Data**: Cached locally with periodic refresh
- **Media Files**: Stored locally with cloud backup
- **User Preferences**: Stored locally only

## Security

### Authentication
- JWT token-based authentication
- Secure token storage using platform keychain
- Automatic token refresh

### Data Protection
- Encrypted local storage for sensitive data
- HTTPS for all API communications
- Certificate pinning for production

### Permissions
- Camera: For photo capture and barcode scanning
- Location: For geo-tagging and maps
- Storage: For local data and file management
- Network: For API communication

## Performance

### Optimization Strategies
- Lazy loading of data and images
- Efficient list rendering with pagination
- Image compression and caching
- Background processing for sync operations
- Memory management for large datasets

### Monitoring
- Crash reporting integration
- Performance metrics tracking
- User analytics (privacy-compliant)
- Network usage monitoring
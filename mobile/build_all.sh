#!/bin/bash

echo "Building all Flutter mobile applications..."

echo ""
echo "Building shared package..."
cd shared
flutter packages pub get
flutter packages pub run build_runner build --delete-conflicting-outputs
cd ..

echo ""
echo "Building Sales App..."
cd sales_app
flutter packages pub get
flutter build apk --release
cd ..

echo ""
echo "Building QC App..."
cd qc_app
flutter packages pub get
flutter build apk --release
cd ..

echo ""
echo "Building Service App..."
cd service_app
flutter packages pub get
flutter build apk --release
cd ..

echo ""
echo "Building Store App..."
cd store_app
flutter packages pub get
flutter build apk --release
cd ..

echo ""
echo "Building Production App..."
cd production_app
flutter packages pub get
flutter build apk --release
cd ..

echo ""
echo "All mobile applications built successfully!"
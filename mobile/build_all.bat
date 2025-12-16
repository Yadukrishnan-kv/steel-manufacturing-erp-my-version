@echo off
echo Building all Flutter mobile applications...

echo.
echo Building shared package...
cd shared
call flutter packages pub get
call flutter packages pub run build_runner build --delete-conflicting-outputs
cd ..

echo.
echo Building Sales App...
cd sales_app
call flutter packages pub get
call flutter build apk --release
cd ..

echo.
echo Building QC App...
cd qc_app
call flutter packages pub get
call flutter build apk --release
cd ..

echo.
echo Building Service App...
cd service_app
call flutter packages pub get
call flutter build apk --release
cd ..

echo.
echo Building Store App...
cd store_app
call flutter packages pub get
call flutter build apk --release
cd ..

echo.
echo Building Production App...
cd production_app
call flutter packages pub get
call flutter build apk --release
cd ..

echo.
echo All mobile applications built successfully!
pause
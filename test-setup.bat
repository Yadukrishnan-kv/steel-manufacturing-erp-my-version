@echo off
echo Testing Steel Manufacturing ERP Setup...
echo.

echo Step 1: Testing database connection...
cd backend
call npx prisma db seed > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database connection and seed data: OK
) else (
    echo ❌ Database connection failed
    echo Please run setup-database.bat first
    pause
    exit /b 1
)

echo.
echo Step 2: Testing backend dependencies...
if exist node_modules (
    echo ✅ Backend dependencies: OK
) else (
    echo ❌ Backend dependencies missing
    echo Running npm install...
    call npm install
)

echo.
echo Step 3: Testing frontend dependencies...
cd ..\frontend
if exist node_modules (
    echo ✅ Frontend dependencies: OK
) else (
    echo ❌ Frontend dependencies missing
    echo Running npm install...
    call npm install
)

echo.
echo Step 4: Testing customer portal dependencies...
cd ..\customer-portal
if exist node_modules (
    echo ✅ Customer portal dependencies: OK
) else (
    echo ❌ Customer portal dependencies missing
    echo Running npm install...
    call npm install
)

cd ..

echo.
echo ✅ Setup test completed successfully!
echo.
echo 🚀 Ready to start development servers:
echo    Run: start-dev.bat
echo.
echo 🔑 Test Login Credentials:
echo    Super Admin: admin@steelmanufacturing.com / Admin123!
echo    Branch Manager: manager.kerala@steelmanufacturing.com / Manager123!
echo    Production Manager: production@steelmanufacturing.com / Production123!
echo    Sales Executive: sales@steelmanufacturing.com / Sales123!
echo    QC Inspector: qc@steelmanufacturing.com / QC123!
echo    Service Technician: service@steelmanufacturing.com / Service123!
echo    Customer Portal: customer@example.com / Customer123!
echo    Employee Portal: employee@steelmanufacturing.com / Employee123!
echo.
pause
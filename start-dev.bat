@echo off
echo Starting Steel Manufacturing ERP Development Environment...
echo.

echo Checking if PostgreSQL is running...
pg_isready -h localhost -p 5432
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL is not running. Please start PostgreSQL first.
    pause
    exit /b 1
)

echo PostgreSQL is running!
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Customer Portal...
start "Customer Portal" cmd /k "cd customer-portal && npm run dev"

echo.
echo All servers are starting up...
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo Customer Portal: http://localhost:5174
echo.
echo Press any key to exit...
pause > nul
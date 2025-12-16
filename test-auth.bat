@echo off
echo Testing Steel Manufacturing ERP Authentication...
echo.

echo Testing Backend API Connection...
curl -X POST http://localhost:3001/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\": \"admin@steelmanufacturing.com\", \"password\": \"Admin123!\"}"

echo.
echo.
echo Backend API Test Complete!
echo.
echo Frontend is running on: http://localhost:5174
echo Backend is running on: http://localhost:3001
echo.
echo Test Credentials:
echo Email: admin@steelmanufacturing.com
echo Password: Admin123!
echo.
echo You can now test the login in your browser at http://localhost:5174
pause
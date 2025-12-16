@echo off
echo Setting up Steel Manufacturing ERP Database...
echo.

cd backend

echo Installing backend dependencies...
call npm install

echo.
echo Running database migrations...
call npx prisma migrate dev --name init

echo.
echo Seeding database with test data...
call npx prisma db seed

echo.
echo Database setup completed!
echo.
echo You can now start the development servers using start-dev.bat
echo.
pause
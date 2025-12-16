@echo off
echo Resetting Steel Manufacturing ERP Database...
echo.

cd backend

echo Resetting database and running migrations...
call npx prisma migrate reset --force

echo.
echo Seeding database with fresh test data...
call npx prisma db seed

echo.
echo Database reset completed!
echo.
echo You can now start the development servers using start-dev.bat
echo.
pause
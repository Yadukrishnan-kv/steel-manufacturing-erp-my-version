@echo off
REM Steel ERP Development Setup Script for Windows
setlocal enabledelayedexpansion

echo 🚀 Setting up Steel Manufacturing ERP development environment...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install it first.
    exit /b 1
) else (
    echo ✅ Node.js is installed
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install it first.
    exit /b 1
) else (
    echo ✅ npm is installed
)

REM Check if Docker is installed
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install it first.
    exit /b 1
) else (
    echo ✅ Docker is installed
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Set up environment files
echo ⚙️ Setting up environment files...
if not exist .env (
    copy .env.example .env
    echo ✅ Created .env file
) else (
    echo ℹ️ .env file already exists
)

if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo ✅ Created backend\.env file
) else (
    echo ℹ️ backend\.env file already exists
)

if not exist frontend\.env (
    copy frontend\.env.example frontend\.env
    echo ✅ Created frontend\.env file
) else (
    echo ℹ️ frontend\.env file already exists
)

REM Start Docker services
echo 🐳 Starting Docker services...
docker-compose up -d

REM Wait for PostgreSQL to be ready
echo ⏳ Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul

REM Set up database
echo 🗄️ Setting up database...
cd backend
npm run db:generate
npm run db:push
cd ..

echo 🎉 Development environment setup complete!
echo.
echo 📋 Next steps:
echo 1. Review and update the .env files with your configuration
echo 2. Start the development servers: npm run dev
echo 3. Access the applications:
echo    - Frontend: http://localhost:5173
echo    - Backend API: http://localhost:3000
echo    - PgAdmin: http://localhost:8080
echo.
echo 📚 For more information, see the README.md file

pause
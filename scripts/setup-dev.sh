#!/bin/bash

# Steel ERP Development Setup Script
set -e

echo "🚀 Setting up Steel Manufacturing ERP development environment..."

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    else
        echo "✅ $1 is installed"
    fi
}

echo "📋 Checking required tools..."
check_tool "node"
check_tool "npm"
check_tool "docker"
check_tool "docker-compose"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
else
    echo "✅ Node.js version is compatible: $(node -v)"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set up environment files
echo "⚙️ Setting up environment files..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "ℹ️ .env file already exists"
fi

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env file"
else
    echo "ℹ️ backend/.env file already exists"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env file"
else
    echo "ℹ️ frontend/.env file already exists"
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Set up database
echo "🗄️ Setting up database..."
cd backend
npm run db:generate
npm run db:push
cd ..

echo "🎉 Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review and update the .env files with your configuration"
echo "2. Start the development servers: npm run dev"
echo "3. Access the applications:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend API: http://localhost:3000"
echo "   - PgAdmin: http://localhost:8080"
echo ""
echo "📚 For more information, see the README.md file"
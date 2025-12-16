#!/bin/bash

echo "Starting Steel Manufacturing ERP Development Environment..."
echo

# Check if PostgreSQL is running
echo "Checking if PostgreSQL is running..."
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "ERROR: PostgreSQL is not running. Please start PostgreSQL first."
    echo "On macOS with Homebrew: brew services start postgresql"
    echo "On Ubuntu/Debian: sudo systemctl start postgresql"
    exit 1
fi

echo "PostgreSQL is running!"
echo

# Function to start a service in background
start_service() {
    local name=$1
    local dir=$2
    local command=$3
    local port=$4
    
    echo "Starting $name..."
    cd "$dir"
    
    # Check if port is already in use
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Warning: Port $port is already in use. $name may already be running."
    else
        $command &
        echo "$name started on port $port"
    fi
    
    cd - >/dev/null
}

# Start backend
start_service "Backend Server" "backend" "npm run dev" "3000"

# Wait a bit for backend to start
sleep 5

# Start frontend
start_service "Frontend Server" "frontend" "npm run dev" "5173"

# Wait a bit
sleep 3

# Start customer portal
start_service "Customer Portal" "customer-portal" "npm run dev" "5174"

echo
echo "All servers are starting up..."
echo
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo "Customer Portal: http://localhost:5174"
echo
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap 'echo "Stopping all services..."; kill $(jobs -p) 2>/dev/null; exit' INT
wait
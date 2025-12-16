#!/bin/bash

echo "Setting up Steel Manufacturing ERP Database..."
echo

cd backend

echo "Installing backend dependencies..."
npm install

echo
echo "Running database migrations..."
npx prisma migrate dev --name init

echo
echo "Seeding database with test data..."
npx prisma db seed

echo
echo "Database setup completed!"
echo
echo "You can now start the development servers using ./start-dev.sh"
echo
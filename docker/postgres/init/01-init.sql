-- Initialize Steel ERP Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create additional databases if needed
-- CREATE DATABASE steel_erp_test;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas for different modules
CREATE SCHEMA IF NOT EXISTS manufacturing;
CREATE SCHEMA IF NOT EXISTS sales;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS procurement;
CREATE SCHEMA IF NOT EXISTS quality;
CREATE SCHEMA IF NOT EXISTS service;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS alerts;
CREATE SCHEMA IF NOT EXISTS bi;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO steel_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO steel_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO steel_user;

-- Grant permissions on schemas
GRANT ALL PRIVILEGES ON SCHEMA manufacturing TO steel_user;
GRANT ALL PRIVILEGES ON SCHEMA sales TO steel_user;
GRANT ALL PRIVILEGES ON SCHEMA inventory TO steel_user;
GRANT ALL PRIVILEGES ON SCHEMA procurement TO steel_user;
GRANT ALL PRIVILEGES ON SCHEMA quality TO steel_user;
GRANT ALL PRIVILEGES ON SCHEMA service TO steel_user;
GRANT ALL PRIVILEGES ON SCHEMA finance TO steel_user;
GRANT ALL PRIVILEGES ON SCHEMA hr TO steel_user;
GRANT ALL PRIVILEGES ON SCHEMA alerts TO steel_user;
GRANT ALL PRIVILEGES ON SCHEMA bi TO steel_user;
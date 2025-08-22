#!/bin/bash

# Portfolio Database Setup Script
# This script initializes the database schema for the portfolio website

echo "=== Portfolio Database Setup ==="

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
    echo "✓ Environment variables loaded"
else
    echo "❌ .env file not found. Please create it first."
    exit 1
fi

# Check if required environment variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASS" ]; then
    echo "❌ Missing required database environment variables:"
    echo "   - DB_HOST"
    echo "   - DB_NAME" 
    echo "   - DB_USER"
    echo "   - DB_PASS"
    exit 1
fi

echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Test database connection
echo "Testing database connection..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ Database connection successful"
else
    echo "❌ Database connection failed. Please check your credentials."
    exit 1
fi

# Create database if it doesn't exist
echo "Creating database if it doesn't exist..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ Database '$DB_NAME' ready"
else
    echo "❌ Failed to create database"
    exit 1
fi

# Run initialization script
echo "Running database initialization script..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < database/init.sql
if [ $? -eq 0 ]; then
    echo "✓ Database tables created successfully"
else
    echo "❌ Failed to initialize database schema"
    exit 1
fi

# Check if tables were created
echo "Verifying table creation..."
TABLES=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | grep -v "Tables_in")
if [ ! -z "$TABLES" ]; then
    echo "✓ Tables created:"
    echo "$TABLES" | sed 's/^/    - /'
else
    echo "❌ No tables found"
    exit 1
fi

echo ""
echo "=== Database Setup Complete! ==="
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "1. Change the default admin password immediately!"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "2. Update the .env file with secure values:"
echo "   - JWT_SECRET"
echo "   - Admin credentials"
echo "   - Rate limiting settings"
echo ""
echo "3. Remove or update sample testimonials in production"
echo ""
echo "Next steps:"
echo "- Run: php -S localhost:8000 (for local development)"
echo "- Access admin panel at: /admin/login.php"
echo "- Test testimonials functionality"
echo ""

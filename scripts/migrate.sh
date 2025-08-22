#!/bin/bash

# Database Migration System
# Handles database schema migrations for different environments

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_ROOT/database/migrations"
CONFIG_DIR="$PROJECT_ROOT/config"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Database Migration Tool

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    migrate [environment]     Run pending migrations
    rollback [steps]         Rollback migrations
    status                   Show migration status
    create <name>            Create new migration
    seed [environment]       Run database seeders
    reset [environment]      Reset database (drop all tables)
    fresh [environment]      Drop all tables and re-run migrations
    install                  Install migrations table

Options:
    -e, --environment        Environment (development, staging, production)
    -f, --force              Force operation without confirmation
    -s, --step               Number of migrations to rollback
    -h, --help               Show this help

Examples:
    $0 migrate production
    $0 rollback 3
    $0 create add_user_table
    $0 status
    $0 seed development
EOF
}

# Load environment configuration
load_environment() {
    local env=${1:-development}
    
    # Load environment file
    if [[ -f "$PROJECT_ROOT/.env.$env" ]]; then
        source "$PROJECT_ROOT/.env.$env"
        log_info "Loaded environment: $env"
    elif [[ -f "$PROJECT_ROOT/.env" ]]; then
        source "$PROJECT_ROOT/.env"
        log_warning "Using default .env file"
    else
        log_error "No environment file found"
        exit 1
    fi
    
    # Validate required variables
    if [[ -z "$DB_HOST" || -z "$DB_NAME" || -z "$DB_USERNAME" ]]; then
        log_error "Missing required database configuration"
        exit 1
    fi
}

# Get database connection
get_db_connection() {
    if [[ -n "$DB_PASSWORD" ]]; then
        echo "mysql -h$DB_HOST -u$DB_USERNAME -p$DB_PASSWORD $DB_NAME"
    else
        echo "mysql -h$DB_HOST -u$DB_USERNAME $DB_NAME"
    fi
}

# Install migrations table
install_migrations_table() {
    log_info "Installing migrations table..."
    
    local db_cmd=$(get_db_connection)
    
    $db_cmd << EOF
CREATE TABLE IF NOT EXISTS migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    migration VARCHAR(255) NOT NULL,
    batch INT NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_migration (migration)
);
EOF
    
    log_success "Migrations table installed"
}

# Get next batch number
get_next_batch() {
    local db_cmd=$(get_db_connection)
    local batch=$($db_cmd -N -e "SELECT COALESCE(MAX(batch), 0) + 1 FROM migrations" 2>/dev/null || echo "1")
    echo $batch
}

# Get executed migrations
get_executed_migrations() {
    local db_cmd=$(get_db_connection)
    $db_cmd -N -e "SELECT migration FROM migrations ORDER BY id" 2>/dev/null || echo ""
}

# Run migrations
run_migrations() {
    local environment=${1:-development}
    
    log_info "Running migrations for environment: $environment"
    load_environment $environment
    
    # Ensure migrations table exists
    install_migrations_table
    
    # Create migrations directory if it doesn't exist
    mkdir -p "$MIGRATIONS_DIR"
    
    # Get executed migrations
    local executed_migrations=$(get_executed_migrations)
    local batch=$(get_next_batch)
    local migrations_run=0
    
    # Find and run pending migrations
    for migration_file in "$MIGRATIONS_DIR"/*.sql; do
        if [[ -f "$migration_file" ]]; then
            local migration_name=$(basename "$migration_file" .sql)
            
            # Check if migration already executed
            if echo "$executed_migrations" | grep -q "^$migration_name$"; then
                continue
            fi
            
            log_info "Running migration: $migration_name"
            
            # Execute migration
            local db_cmd=$(get_db_connection)
            if $db_cmd < "$migration_file"; then
                # Record migration
                $db_cmd -e "INSERT INTO migrations (migration, batch) VALUES ('$migration_name', $batch)"
                log_success "Migration completed: $migration_name"
                ((migrations_run++))
            else
                log_error "Migration failed: $migration_name"
                exit 1
            fi
        fi
    done
    
    if [[ $migrations_run -eq 0 ]]; then
        log_info "No pending migrations to run"
    else
        log_success "Ran $migrations_run migrations"
    fi
}

# Rollback migrations
rollback_migrations() {
    local steps=${1:-1}
    local environment=${2:-development}
    
    log_info "Rolling back $steps migration(s) for environment: $environment"
    load_environment $environment
    
    local db_cmd=$(get_db_connection)
    
    # Get migrations to rollback
    local migrations_to_rollback=$($db_cmd -N -e "
        SELECT migration FROM migrations 
        ORDER BY id DESC 
        LIMIT $steps
    " 2>/dev/null)
    
    if [[ -z "$migrations_to_rollback" ]]; then
        log_info "No migrations to rollback"
        return
    fi
    
    # Rollback each migration
    while IFS= read -r migration_name; do
        local rollback_file="$MIGRATIONS_DIR/${migration_name}_down.sql"
        
        if [[ -f "$rollback_file" ]]; then
            log_info "Rolling back migration: $migration_name"
            
            if $db_cmd < "$rollback_file"; then
                $db_cmd -e "DELETE FROM migrations WHERE migration = '$migration_name'"
                log_success "Rollback completed: $migration_name"
            else
                log_error "Rollback failed: $migration_name"
                exit 1
            fi
        else
            log_warning "No rollback file found for: $migration_name"
            $db_cmd -e "DELETE FROM migrations WHERE migration = '$migration_name'"
        fi
    done <<< "$migrations_to_rollback"
}

# Show migration status
show_status() {
    local environment=${1:-development}
    
    log_info "Migration status for environment: $environment"
    load_environment $environment
    
    local db_cmd=$(get_db_connection)
    
    echo "Executed migrations:"
    $db_cmd -e "
        SELECT 
            migration,
            batch,
            executed_at
        FROM migrations 
        ORDER BY id
    " 2>/dev/null || log_warning "Migrations table not found"
    
    echo
    echo "Pending migrations:"
    local executed_migrations=$(get_executed_migrations)
    local pending_found=false
    
    for migration_file in "$MIGRATIONS_DIR"/*.sql; do
        if [[ -f "$migration_file" ]]; then
            local migration_name=$(basename "$migration_file" .sql)
            
            if ! echo "$executed_migrations" | grep -q "^$migration_name$"; then
                echo "  - $migration_name"
                pending_found=true
            fi
        fi
    done
    
    if [[ "$pending_found" == "false" ]]; then
        echo "  No pending migrations"
    fi
}

# Create new migration
create_migration() {
    local name=$1
    
    if [[ -z "$name" ]]; then
        log_error "Migration name is required"
        exit 1
    fi
    
    # Create migrations directory
    mkdir -p "$MIGRATIONS_DIR"
    
    # Generate timestamp
    local timestamp=$(date +%Y_%m_%d_%H%M%S)
    local migration_file="$MIGRATIONS_DIR/${timestamp}_${name}.sql"
    local rollback_file="$MIGRATIONS_DIR/${timestamp}_${name}_down.sql"
    
    # Create migration file
    cat > "$migration_file" << EOF
-- Migration: $name
-- Created: $(date)

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
EOF
    
    # Create rollback file
    cat > "$rollback_file" << EOF
-- Rollback: $name
-- Created: $(date)

-- Add your rollback SQL here
-- Example:
-- DROP TABLE IF EXISTS example;
EOF
    
    log_success "Created migration: $migration_file"
    log_success "Created rollback: $rollback_file"
}

# Run database seeders
run_seeders() {
    local environment=${1:-development}
    
    log_info "Running seeders for environment: $environment"
    load_environment $environment
    
    local seeders_dir="$PROJECT_ROOT/database/seeders"
    
    if [[ ! -d "$seeders_dir" ]]; then
        log_warning "Seeders directory not found: $seeders_dir"
        return
    fi
    
    local db_cmd=$(get_db_connection)
    local seeders_run=0
    
    for seeder_file in "$seeders_dir"/*.sql; do
        if [[ -f "$seeder_file" ]]; then
            local seeder_name=$(basename "$seeder_file" .sql)
            log_info "Running seeder: $seeder_name"
            
            if $db_cmd < "$seeder_file"; then
                log_success "Seeder completed: $seeder_name"
                ((seeders_run++))
            else
                log_error "Seeder failed: $seeder_name"
                exit 1
            fi
        fi
    done
    
    if [[ $seeders_run -eq 0 ]]; then
        log_info "No seeders found to run"
    else
        log_success "Ran $seeders_run seeders"
    fi
}

# Reset database
reset_database() {
    local environment=${1:-development}
    local force=${2:-false}
    
    if [[ "$force" != "true" ]]; then
        read -p "Are you sure you want to reset the database? This will drop all tables. (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Database reset cancelled"
            return
        fi
    fi
    
    log_warning "Resetting database for environment: $environment"
    load_environment $environment
    
    local db_cmd=$(get_db_connection)
    
    # Get all tables
    local tables=$($db_cmd -N -e "SHOW TABLES" 2>/dev/null)
    
    if [[ -n "$tables" ]]; then
        # Disable foreign key checks
        $db_cmd -e "SET FOREIGN_KEY_CHECKS = 0"
        
        # Drop all tables
        while IFS= read -r table; do
            log_info "Dropping table: $table"
            $db_cmd -e "DROP TABLE IF EXISTS \`$table\`"
        done <<< "$tables"
        
        # Re-enable foreign key checks
        $db_cmd -e "SET FOREIGN_KEY_CHECKS = 1"
        
        log_success "Database reset completed"
    else
        log_info "No tables found to drop"
    fi
}

# Fresh migration (reset + migrate)
fresh_migration() {
    local environment=${1:-development}
    local force=${2:-false}
    
    reset_database "$environment" "$force"
    run_migrations "$environment"
}

# Main script logic
case "${1:-help}" in
    migrate)
        run_migrations "${2:-development}"
        ;;
    rollback)
        rollback_migrations "${2:-1}" "${3:-development}"
        ;;
    status)
        show_status "${2:-development}"
        ;;
    create)
        create_migration "$2"
        ;;
    seed)
        run_seeders "${2:-development}"
        ;;
    reset)
        reset_database "${2:-development}" "$3"
        ;;
    fresh)
        fresh_migration "${2:-development}" "$3"
        ;;
    install)
        load_environment "${2:-development}"
        install_migrations_table
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
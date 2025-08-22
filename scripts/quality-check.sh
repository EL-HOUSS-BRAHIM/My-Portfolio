#!/bin/bash

# Code Quality Tools Setup and Execution Script
# This script sets up and runs all code quality tools for the portfolio project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}Portfolio Code Quality Tools Setup${NC}"
echo "=================================="

# Function to print status messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check PHP
    if ! command_exists php; then
        print_error "PHP is not installed or not in PATH"
        exit 1
    fi
    
    # Check Composer
    if ! command_exists composer; then
        print_error "Composer is not installed or not in PATH"
        exit 1
    fi
    
    # Check Node.js and npm
    if ! command_exists node; then
        print_warning "Node.js is not installed. JavaScript linting will be skipped."
        NODE_AVAILABLE=false
    else
        NODE_AVAILABLE=true
    fi
    
    print_success "Dependencies check completed"
}

# Install PHP dependencies
install_php_dependencies() {
    print_status "Installing PHP code quality tools..."
    
    if [ ! -f "tests/composer.json" ]; then
        print_error "tests/composer.json not found"
        exit 1
    fi
    
    cd tests
    composer install --no-dev --optimize-autoloader
    cd ..
    
    print_success "PHP dependencies installed"
}

# Install Node.js dependencies
install_node_dependencies() {
    if [ "$NODE_AVAILABLE" = true ]; then
        print_status "Installing Node.js dependencies..."
        
        cd tests
        if [ ! -f "package.json" ]; then
            print_warning "tests/package.json not found, skipping Node.js dependencies"
            cd ..
            return
        fi
        
        npm install
        cd ..
        
        print_success "Node.js dependencies installed"
    fi
}

# Run PHPStan analysis
run_phpstan() {
    print_status "Running PHPStan static analysis..."
    
    if [ ! -f "vendor/bin/phpstan" ] && [ ! -f "tests/vendor/bin/phpstan" ]; then
        print_warning "PHPStan not found, skipping analysis"
        return
    fi
    
    PHPSTAN_BIN="tests/vendor/bin/phpstan"
    if [ ! -f "$PHPSTAN_BIN" ]; then
        PHPSTAN_BIN="vendor/bin/phpstan"
    fi
    
    if $PHPSTAN_BIN analyse --memory-limit=256M; then
        print_success "PHPStan analysis completed successfully"
    else
        print_warning "PHPStan found some issues (see output above)"
    fi
}

# Run PHP Code Sniffer
run_phpcs() {
    print_status "Running PHP Code Sniffer..."
    
    PHPCS_BIN="tests/vendor/bin/phpcs"
    if [ ! -f "$PHPCS_BIN" ]; then
        PHPCS_BIN="vendor/bin/phpcs"
    fi
    
    if [ ! -f "$PHPCS_BIN" ]; then
        print_warning "PHPCS not found, skipping code style check"
        return
    fi
    
    if $PHPCS_BIN; then
        print_success "PHP Code Sniffer completed successfully"
    else
        print_warning "PHPCS found code style issues (see output above)"
        
        # Offer to fix automatically
        read -p "Would you like to automatically fix these issues? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            PHPCBF_BIN="${PHPCS_BIN/phpcs/phpcbf}"
            if $PHPCBF_BIN; then
                print_success "Code style issues fixed automatically"
            else
                print_warning "Some issues could not be fixed automatically"
            fi
        fi
    fi
}

# Run PHP Mess Detector
run_phpmd() {
    print_status "Running PHP Mess Detector..."
    
    PHPMD_BIN="tests/vendor/bin/phpmd"
    if [ ! -f "$PHPMD_BIN" ]; then
        PHPMD_BIN="vendor/bin/phpmd"
    fi
    
    if [ ! -f "$PHPMD_BIN" ]; then
        print_warning "PHPMD not found, skipping mess detection"
        return
    fi
    
    if $PHPMD_BIN src text cleancode,codesize,controversial,design,naming,unusedcode; then
        print_success "PHP Mess Detector completed successfully"
    else
        print_warning "PHPMD found some issues (see output above)"
    fi
}

# Run ESLint for JavaScript
run_eslint() {
    if [ "$NODE_AVAILABLE" = true ]; then
        print_status "Running ESLint for JavaScript..."
        
        if [ ! -f "tests/node_modules/.bin/eslint" ]; then
            print_warning "ESLint not found, skipping JavaScript linting"
            return
        fi
        
        if tests/node_modules/.bin/eslint assets/js-clean/**/*.js; then
            print_success "ESLint completed successfully"
        else
            print_warning "ESLint found JavaScript issues (see output above)"
            
            # Offer to fix automatically
            read -p "Would you like to automatically fix these issues? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if tests/node_modules/.bin/eslint assets/js-clean/**/*.js --fix; then
                    print_success "JavaScript issues fixed automatically"
                else
                    print_warning "Some JavaScript issues could not be fixed automatically"
                fi
            fi
        fi
    fi
}

# Run Stylelint for CSS
run_stylelint() {
    if [ "$NODE_AVAILABLE" = true ]; then
        print_status "Running Stylelint for CSS..."
        
        if [ ! -f "tests/node_modules/.bin/stylelint" ]; then
            print_warning "Stylelint not found, skipping CSS linting"
            return
        fi
        
        if tests/node_modules/.bin/stylelint "assets/css/**/*.css"; then
            print_success "Stylelint completed successfully"
        else
            print_warning "Stylelint found CSS issues (see output above)"
            
            # Offer to fix automatically
            read -p "Would you like to automatically fix these issues? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if tests/node_modules/.bin/stylelint "assets/css/**/*.css" --fix; then
                    print_success "CSS issues fixed automatically"
                else
                    print_warning "Some CSS issues could not be fixed automatically"
                fi
            fi
        fi
    fi
}

# Run PHPUnit tests
run_phpunit() {
    print_status "Running PHPUnit tests..."
    
    PHPUNIT_BIN="tests/vendor/bin/phpunit"
    if [ ! -f "$PHPUNIT_BIN" ]; then
        PHPUNIT_BIN="vendor/bin/phpunit"
    fi
    
    if [ ! -f "$PHPUNIT_BIN" ]; then
        print_warning "PHPUnit not found, skipping tests"
        return
    fi
    
    cd tests
    if ../tests/vendor/bin/phpunit; then
        print_success "PHPUnit tests completed successfully"
    else
        print_error "Some PHPUnit tests failed"
    fi
    cd ..
}

# Run Jest tests
run_jest() {
    if [ "$NODE_AVAILABLE" = true ]; then
        print_status "Running Jest tests..."
        
        if [ ! -f "tests/node_modules/.bin/jest" ]; then
            print_warning "Jest not found, skipping JavaScript tests"
            return
        fi
        
        cd tests
        if npm test; then
            print_success "Jest tests completed successfully"
        else
            print_error "Some Jest tests failed"
        fi
        cd ..
    fi
}

# Generate coverage reports
generate_coverage() {
    print_status "Generating test coverage reports..."
    
    # PHP coverage
    if [ -f "tests/vendor/bin/phpunit" ]; then
        cd tests
        ../tests/vendor/bin/phpunit --coverage-html coverage/php
        cd ..
        print_success "PHP coverage report generated in tests/coverage/php/"
    fi
    
    # JavaScript coverage
    if [ "$NODE_AVAILABLE" = true ] && [ -f "tests/node_modules/.bin/jest" ]; then
        cd tests
        npm run test:coverage
        cd ..
        print_success "JavaScript coverage report generated in tests/coverage/"
    fi
}

# Main execution
main() {
    print_status "Starting Portfolio Code Quality Analysis"
    
    # Parse command line arguments
    RUN_TESTS=true
    RUN_COVERAGE=false
    FIX_ISSUES=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-tests)
                RUN_TESTS=false
                shift
                ;;
            --coverage)
                RUN_COVERAGE=true
                shift
                ;;
            --fix)
                FIX_ISSUES=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --no-tests    Skip running tests"
                echo "  --coverage    Generate coverage reports"
                echo "  --fix         Automatically fix issues where possible"
                echo "  --help        Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run all checks
    check_dependencies
    install_php_dependencies
    install_node_dependencies
    
    echo -e "\n${BLUE}Running Code Quality Analysis...${NC}"
    echo "================================"
    
    run_phpstan
    run_phpcs
    run_phpmd
    run_eslint
    run_stylelint
    
    if [ "$RUN_TESTS" = true ]; then
        echo -e "\n${BLUE}Running Tests...${NC}"
        echo "================"
        
        run_phpunit
        run_jest
    fi
    
    if [ "$RUN_COVERAGE" = true ]; then
        echo -e "\n${BLUE}Generating Coverage Reports...${NC}"
        echo "============================="
        
        generate_coverage
    fi
    
    echo -e "\n${GREEN}Code Quality Analysis Completed!${NC}"
    echo "=================================="
    
    print_status "Summary:"
    echo "- Static analysis: PHPStan"
    echo "- Code style: PHPCS"
    echo "- Code quality: PHPMD"
    echo "- JavaScript: ESLint"
    echo "- CSS: Stylelint"
    
    if [ "$RUN_TESTS" = true ]; then
        echo "- Unit tests: PHPUnit & Jest"
    fi
    
    if [ "$RUN_COVERAGE" = true ]; then
        echo "- Coverage reports generated"
    fi
    
    print_success "All quality checks completed!"
}

# Run main function with all arguments
main "$@"
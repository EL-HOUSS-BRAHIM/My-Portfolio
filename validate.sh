#!/bin/bash

# Portfolio Validation Script
# Quick check to ensure all files are properly organized and paths are correct

echo "🔍 Portfolio Project Validation"
echo "=============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

validation_passed=0
validation_failed=0

validate_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1 exists${NC}"
        ((validation_passed++))
        return 0
    else
        echo -e "${RED}❌ $1 missing${NC}"
        ((validation_failed++))
        return 1
    fi
}

validate_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ Directory $1 exists${NC}"
        ((validation_passed++))
        return 0
    else
        echo -e "${RED}❌ Directory $1 missing${NC}"
        ((validation_failed++))
        return 1
    fi
}

echo ""
echo "🏗️  Checking Project Structure..."
echo "--------------------------------"

# Check main directories
validate_directory "assets"
validate_directory "assets/css"
validate_directory "assets/js"
validate_directory "assets/images"
validate_directory "assets/icons"
validate_directory "src"
validate_directory "src/api"
validate_directory "admin"
validate_directory "config"
validate_directory "storage"

echo ""
echo "📄 Checking Core Files..."
echo "------------------------"

# Check essential files
validate_file "index.html"
validate_file "assets/css/portfolio.css"
validate_file "assets/js/portfolio.js"
validate_file "assets/js/testimonials.js"
validate_file "assets/js/main.js"
validate_file "README.md"
validate_file ".env.example"

echo ""
echo "🔧 Checking New Tools..."
echo "-----------------------"

validate_file "optimize.sh"
validate_file "security-audit.sh"

if [ -f "optimize.sh" ]; then
    if [ -x "optimize.sh" ]; then
        echo -e "${GREEN}✅ optimize.sh is executable${NC}"
        ((validation_passed++))
    else
        echo -e "${YELLOW}⚠️  optimize.sh exists but not executable${NC}"
    fi
fi

if [ -f "security-audit.sh" ]; then
    if [ -x "security-audit.sh" ]; then
        echo -e "${GREEN}✅ security-audit.sh is executable${NC}"
        ((validation_passed++))
    else
        echo -e "${YELLOW}⚠️  security-audit.sh exists but not executable${NC}"
    fi
fi

echo ""
echo "🔗 Checking HTML Asset References..."
echo "-----------------------------------"

if [ -f "index.html" ]; then
    # Check for correct asset paths
    if grep -q "assets/css/portfolio.css" index.html; then
        echo -e "${GREEN}✅ CSS path correct in index.html${NC}"
        ((validation_passed++))
    else
        echo -e "${RED}❌ CSS path incorrect in index.html${NC}"
        ((validation_failed++))
    fi
    
    if grep -q "assets/js/portfolio.js" index.html; then
        echo -e "${GREEN}✅ Portfolio JS path correct in index.html${NC}"
        ((validation_passed++))
    else
        echo -e "${RED}❌ Portfolio JS path incorrect in index.html${NC}"
        ((validation_failed++))
    fi
    
    if grep -q "assets/js/testimonials.js" index.html; then
        echo -e "${GREEN}✅ Testimonials JS path correct in index.html${NC}"
        ((validation_passed++))
    else
        echo -e "${RED}❌ Testimonials JS path incorrect in index.html${NC}"
        ((validation_failed++))
    fi
    
    # Check for old paths that should be removed (paths without assets/)
    old_css=$(grep "href.*css/portfolio.css" index.html | grep -v "assets/css")
    old_js=$(grep "src.*js/portfolio.js" index.html | grep -v "assets/js")
    
    if [ -n "$old_css" ] || [ -n "$old_js" ]; then
        echo -e "${RED}❌ Old asset paths still present in index.html${NC}"
        [ -n "$old_css" ] && echo "  Found old CSS path: $old_css"
        [ -n "$old_js" ] && echo "  Found old JS path: $old_js"
        ((validation_failed++))
    else
        echo -e "${GREEN}✅ No old asset paths found in index.html${NC}"
        ((validation_passed++))
    fi
fi

echo ""
echo "🗂️  Checking for Unwanted Files..."
echo "---------------------------------"

# Check for files that should have been removed
unwanted_files=("test-contact.html" "contact.php" "db_config.php" "db.php" "enter.php" "login.php" "protected.php")
unwanted_found=0

for file in "${unwanted_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${YELLOW}⚠️  Unwanted file still exists: $file${NC}"
        ((unwanted_found++))
    fi
done

if [ $unwanted_found -eq 0 ]; then
    echo -e "${GREEN}✅ No unwanted files found${NC}"
    ((validation_passed++))
fi

# Check for old directories
old_dirs=("css" "js" "images" "icons")
old_dirs_found=0

for dir in "${old_dirs[@]}"; do
    if [ -d "$dir" ] && [ "$dir" != "assets/css" ] && [ "$dir" != "assets/js" ]; then
        echo -e "${YELLOW}⚠️  Old directory still exists: $dir${NC}"
        ((old_dirs_found++))
    fi
done

if [ $old_dirs_found -eq 0 ]; then
    echo -e "${GREEN}✅ No old directories found${NC}"
    ((validation_passed++))
fi

echo ""
echo "📊 Validation Summary"
echo "===================="
echo -e "${GREEN}Passed: $validation_passed${NC}"
echo -e "${RED}Failed: $validation_failed${NC}"

if [ $validation_failed -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Portfolio validation PASSED!${NC}"
    echo -e "${GREEN}Your portfolio is properly organized and ready for the next phase.${NC}"
    echo ""
    echo "🚀 Recommended next steps:"
    echo "1. Run ./optimize.sh for performance optimization"
    echo "2. Run ./security-audit.sh for security check"
    echo "3. Test the website functionality"
    echo "4. Deploy to production"
else
    echo ""
    echo -e "${RED}⚠️  Portfolio validation found issues.${NC}"
    echo "Please fix the failed items before proceeding."
fi

echo ""
echo "📄 Report saved to: storage/validation_report.txt"

# Save report
{
    echo "Portfolio Validation Report"
    echo "Generated: $(date)"
    echo "=========================="
    echo ""
    echo "Passed: $validation_passed"
    echo "Failed: $validation_failed"
    echo ""
    if [ $validation_failed -eq 0 ]; then
        echo "Status: PASSED ✅"
        echo "Portfolio is properly organized and ready for next phase."
    else
        echo "Status: FAILED ❌"
        echo "Issues found that need to be addressed."
    fi
} > storage/validation_report.txt

#!/bin/bash

# CSS Coverage Audit Script
# This script audits CSS coverage across all HTML files and identifies missing styles

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RESULTS_DIR="$PROJECT_ROOT/tests/css-audit-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
AUDIT_REPORT="$RESULTS_DIR/css_audit_report_$TIMESTAMP.html"

echo -e "${BLUE}CSS Coverage Audit for Portfolio${NC}"
echo "================================"

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

print_metric() {
    echo -e "${PURPLE}[METRIC]${NC} $1"
}

# Setup results directory
setup_results_directory() {
    mkdir -p "$RESULTS_DIR"
    print_status "CSS audit results will be saved to: $RESULTS_DIR"
}

# Extract all CSS classes from HTML files
extract_html_classes() {
    local html_classes_file="$RESULTS_DIR/html_classes.txt"
    
    print_status "Extracting CSS classes from HTML files..."
    
    # Find all HTML files and extract classes
    find "$PROJECT_ROOT" -name "*.html" -o -name "*.php" | while read -r file; do
        if [[ ! "$file" =~ (vendor|node_modules|storage|tests) ]]; then
            grep -oE 'class="[^"]*"' "$file" 2>/dev/null | sed 's/class="//g' | sed 's/"//g' | tr ' ' '\n'
        fi
    done | sort -u > "$html_classes_file"
    
    local class_count=$(wc -l < "$html_classes_file")
    print_metric "Found $class_count unique CSS classes in HTML files"
    
    echo "$html_classes_file"
}

# Extract all CSS rules from CSS files
extract_css_rules() {
    local css_rules_file="$RESULTS_DIR/css_rules.txt"
    
    print_status "Extracting CSS rules from CSS files..."
    
    # Find all CSS files and extract class selectors
    find "$PROJECT_ROOT/assets/css" -name "*.css" | while read -r file; do
        if [[ ! "$file" =~ minified ]]; then
            # Extract class selectors (lines starting with . or containing .)
            grep -oE '\.[a-zA-Z0-9_-]+[^{]*' "$file" 2>/dev/null | sed 's/[{,].*//g' | sed 's/^\.//g' | sed 's/:.*//g' | sed 's/\s.*//g'
        fi
    done | sort -u | grep -v '^$' > "$css_rules_file"
    
    local rule_count=$(wc -l < "$css_rules_file")
    print_metric "Found $rule_count unique CSS class rules"
    
    echo "$css_rules_file"
}

# Check for missing CSS classes
check_missing_css() {
    local html_classes_file="$1"
    local css_rules_file="$2"
    local missing_css_file="$RESULTS_DIR/missing_css_classes.txt"
    
    print_status "Checking for missing CSS classes..."
    
    # Find classes in HTML that don't have CSS rules
    comm -23 "$html_classes_file" "$css_rules_file" > "$missing_css_file"
    
    local missing_count=$(wc -l < "$missing_css_file")
    print_metric "Found $missing_count classes without CSS rules"
    
    if [ "$missing_count" -gt 0 ]; then
        print_warning "Classes missing CSS definitions:"
        head -20 "$missing_css_file" | while read -r class; do
            echo "  - .$class"
        done
        
        if [ "$missing_count" -gt 20 ]; then
            echo "  ... and $((missing_count - 20)) more (see $missing_css_file)"
        fi
    else
        print_success "All HTML classes have corresponding CSS rules!"
    fi
    
    echo "$missing_css_file"
}

# Check for unused CSS classes
check_unused_css() {
    local html_classes_file="$1"
    local css_rules_file="$2"
    local unused_css_file="$RESULTS_DIR/unused_css_classes.txt"
    
    print_status "Checking for unused CSS classes..."
    
    # Find CSS rules that don't appear in HTML
    comm -13 "$html_classes_file" "$css_rules_file" > "$unused_css_file"
    
    local unused_count=$(wc -l < "$unused_css_file")
    print_metric "Found $unused_count potentially unused CSS rules"
    
    if [ "$unused_count" -gt 0 ]; then
        print_warning "Potentially unused CSS classes:"
        head -20 "$unused_css_file" | while read -r class; do
            echo "  - .$class"
        done
        
        if [ "$unused_count" -gt 20 ]; then
            echo "  ... and $((unused_count - 20)) more (see $unused_css_file)"
        fi
    else
        print_success "All CSS classes are being used!"
    fi
    
    echo "$unused_css_file"
}

# Analyze CSS file structure
analyze_css_structure() {
    print_status "Analyzing CSS file structure..."
    
    local structure_file="$RESULTS_DIR/css_structure_analysis.txt"
    
    echo "CSS File Structure Analysis - $(date)" > "$structure_file"
    echo "=====================================" >> "$structure_file"
    
    # Analyze each CSS file
    find "$PROJECT_ROOT/assets/css" -name "*.css" -not -path "*/minified/*" | while read -r file; do
        local filename=$(basename "$file")
        local lines=$(wc -l < "$file")
        local rules=$(grep -c '{' "$file" 2>/dev/null || echo 0)
        local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
        
        echo "" >> "$structure_file"
        echo "File: $filename" >> "$structure_file"
        echo "  Lines: $lines" >> "$structure_file"
        echo "  Rules: $rules" >> "$structure_file"
        echo "  Size: $size bytes" >> "$structure_file"
        
        # Check for common patterns
        local media_queries=$(grep -c '@media' "$file" 2>/dev/null || echo 0)
        local keyframes=$(grep -c '@keyframes' "$file" 2>/dev/null || echo 0)
        local imports=$(grep -c '@import' "$file" 2>/dev/null || echo 0)
        
        echo "  Media Queries: $media_queries" >> "$structure_file"
        echo "  Keyframes: $keyframes" >> "$structure_file"
        echo "  Imports: $imports" >> "$structure_file"
        
        print_metric "$filename: $lines lines, $rules rules, $size bytes"
    done
}

# Check for responsive design coverage
check_responsive_design() {
    print_status "Checking responsive design coverage..."
    
    local responsive_file="$RESULTS_DIR/responsive_analysis.txt"
    
    echo "Responsive Design Analysis - $(date)" > "$responsive_file"
    echo "====================================" >> "$responsive_file"
    
    # Common breakpoints to check for
    local breakpoints=("320px" "480px" "768px" "1024px" "1200px" "1440px")
    
    echo "Checking for responsive breakpoints:" >> "$responsive_file"
    
    for breakpoint in "${breakpoints[@]}"; do
        local count=$(find "$PROJECT_ROOT/assets/css" -name "*.css" -not -path "*/minified/*" -exec grep -l "$breakpoint" {} \; | wc -l)
        echo "  $breakpoint: $count files" >> "$responsive_file"
        
        if [ "$count" -gt 0 ]; then
            print_success "✓ $breakpoint breakpoint found in $count files"
        else
            print_warning "⚠ $breakpoint breakpoint not found"
        fi
    done
    
    # Check for mobile-first approach
    local mobile_first=$(find "$PROJECT_ROOT/assets/css" -name "*.css" -not -path "*/minified/*" -exec grep -l "min-width" {} \; | wc -l)
    local desktop_first=$(find "$PROJECT_ROOT/assets/css" -name "*.css" -not -path "*/minified/*" -exec grep -l "max-width" {} \; | wc -l)
    
    echo "" >> "$responsive_file"
    echo "Responsive Design Approach:" >> "$responsive_file"
    echo "  Mobile-first (min-width): $mobile_first files" >> "$responsive_file"
    echo "  Desktop-first (max-width): $desktop_first files" >> "$responsive_file"
    
    print_metric "Mobile-first approach: $mobile_first files"
    print_metric "Desktop-first approach: $desktop_first files"
}

# Check for accessibility in CSS
check_accessibility_css() {
    print_status "Checking CSS accessibility features..."
    
    local accessibility_file="$RESULTS_DIR/accessibility_analysis.txt"
    
    echo "CSS Accessibility Analysis - $(date)" > "$accessibility_file"
    echo "===================================" >> "$accessibility_file"
    
    # Check for accessibility-related CSS
    local focus_styles=$(find "$PROJECT_ROOT/assets/css" -name "*.css" -not -path "*/minified/*" -exec grep -l ":focus" {} \; | wc -l)
    local hover_styles=$(find "$PROJECT_ROOT/assets/css" -name "*.css" -not -path "*/minified/*" -exec grep -l ":hover" {} \; | wc -l)
    local sr_only=$(find "$PROJECT_ROOT/assets/css" -name "*.css" -not -path "*/minified/*" -exec grep -l "sr-only\|screen-reader" {} \; | wc -l)
    local high_contrast=$(find "$PROJECT_ROOT/assets/css" -name "*.css" -not -path "*/minified/*" -exec grep -l "prefers-contrast" {} \; | wc -l)
    local reduced_motion=$(find "$PROJECT_ROOT/assets/css" -name "*.css" -not -path "*/minified/*" -exec grep -l "prefers-reduced-motion" {} \; | wc -l)
    
    echo "Accessibility Features:" >> "$accessibility_file"
    echo "  Focus styles: $focus_styles files" >> "$accessibility_file"
    echo "  Hover styles: $hover_styles files" >> "$accessibility_file"
    echo "  Screen reader styles: $sr_only files" >> "$accessibility_file"
    echo "  High contrast support: $high_contrast files" >> "$accessibility_file"
    echo "  Reduced motion support: $reduced_motion files" >> "$accessibility_file"
    
    print_metric "Focus styles: $focus_styles files"
    print_metric "Hover styles: $hover_styles files"
    print_metric "Screen reader styles: $sr_only files"
    print_metric "High contrast support: $high_contrast files"
    print_metric "Reduced motion support: $reduced_motion files"
    
    # Recommendations
    echo "" >> "$accessibility_file"
    echo "Accessibility Recommendations:" >> "$accessibility_file"
    
    if [ "$focus_styles" -eq 0 ]; then
        echo "  - Add focus styles for better keyboard navigation" >> "$accessibility_file"
        print_warning "Consider adding focus styles for keyboard navigation"
    fi
    
    if [ "$sr_only" -eq 0 ]; then
        echo "  - Add screen reader only styles for better accessibility" >> "$accessibility_file"
        print_warning "Consider adding screen reader only styles"
    fi
    
    if [ "$reduced_motion" -eq 0 ]; then
        echo "  - Add support for prefers-reduced-motion" >> "$accessibility_file"
        print_warning "Consider adding prefers-reduced-motion support"
    fi
}

# Generate missing CSS files
generate_missing_css() {
    local missing_css_file="$1"
    
    if [ ! -f "$missing_css_file" ] || [ ! -s "$missing_css_file" ]; then
        print_status "No missing CSS classes to generate"
        return
    fi
    
    print_status "Generating CSS for missing classes..."
    
    local generated_css_file="$RESULTS_DIR/generated_missing_styles.css"
    
    echo "/* Generated CSS for missing classes - $(date) */" > "$generated_css_file"
    echo "/* Add these styles to appropriate CSS files */" >> "$generated_css_file"
    echo "" >> "$generated_css_file"
    
    # Generate basic CSS for missing classes
    while read -r class; do
        if [ -n "$class" ]; then
            echo "/* Class: $class */" >> "$generated_css_file"
            echo ".$class {" >> "$generated_css_file"
            echo "    /* Add your styles here */" >> "$generated_css_file"
            echo "}" >> "$generated_css_file"
            echo "" >> "$generated_css_file"
        fi
    done < "$missing_css_file"
    
    local generated_count=$(grep -c '{' "$generated_css_file")
    print_success "Generated CSS template for $generated_count missing classes"
    print_status "Generated CSS saved to: $generated_css_file"
}

# Check admin panel CSS coverage
check_admin_css_coverage() {
    print_status "Checking admin panel CSS coverage..."
    
    local admin_css_file="$RESULTS_DIR/admin_css_analysis.txt"
    
    echo "Admin Panel CSS Analysis - $(date)" > "$admin_css_file"
    echo "==================================" >> "$admin_css_file"
    
    # Check if admin-specific CSS exists
    local admin_css_files=$(find "$PROJECT_ROOT/assets/css" -name "*admin*" -o -name "*dashboard*" | wc -l)
    
    if [ "$admin_css_files" -eq 0 ]; then
        print_warning "No dedicated admin panel CSS files found"
        echo "Missing: Dedicated admin CSS files" >> "$admin_css_file"
        
        # Create basic admin CSS
        create_admin_css
    else
        print_success "Found $admin_css_files admin CSS files"
        echo "Found: $admin_css_files admin CSS files" >> "$admin_css_file"
    fi
    
    # Check admin PHP files for CSS classes
    local admin_classes=$(find "$PROJECT_ROOT/admin" -name "*.php" -exec grep -oE 'class="[^"]*"' {} \; 2>/dev/null | sed 's/class="//g' | sed 's/"//g' | tr ' ' '\n' | sort -u | wc -l)
    
    echo "Admin classes found: $admin_classes" >> "$admin_css_file"
    print_metric "Admin panel uses $admin_classes unique CSS classes"
}

# Create admin CSS file
create_admin_css() {
    print_status "Creating admin panel CSS file..."
    
    local admin_css_file="$PROJECT_ROOT/assets/css/admin.css"
    
    cat > "$admin_css_file" << 'EOF'
/* Admin Panel Styles */
/* Generated automatically - customize as needed */

/* Admin Layout */
.admin-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.admin-header {
    background: #fff;
    border-bottom: 1px solid #e0e0e0;
    padding: 1rem 0;
    margin-bottom: 2rem;
}

.admin-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #333;
    margin: 0;
}

/* Admin Navigation */
.admin-nav {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 2rem;
}

.admin-nav ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 1rem;
}

.admin-nav a {
    display: block;
    padding: 0.5rem 1rem;
    text-decoration: none;
    color: #666;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.admin-nav a:hover,
.admin-nav a.active {
    background: #007acc;
    color: white;
}

/* Admin Cards */
.admin-card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-card h3 {
    margin-top: 0;
    color: #333;
    font-size: 1.2rem;
}

/* Admin Tables */
.admin-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
}

.admin-table th,
.admin-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
}

.admin-table th {
    background: #f8f9fa;
    font-weight: 600;
    color: #555;
}

.admin-table tr:hover {
    background: #f8f9fa;
}

/* Admin Forms */
.admin-form {
    max-width: 600px;
}

.admin-form-group {
    margin-bottom: 1.5rem;
}

.admin-form label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
}

.admin-form input,
.admin-form textarea,
.admin-form select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s ease;
}

.admin-form input:focus,
.admin-form textarea:focus,
.admin-form select:focus {
    outline: none;
    border-color: #007acc;
    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
}

/* Admin Buttons */
.admin-btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: #007acc;
    color: white;
    text-decoration: none;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s ease;
}

.admin-btn:hover {
    background: #005a9e;
}

.admin-btn-secondary {
    background: #6c757d;
}

.admin-btn-secondary:hover {
    background: #545b62;
}

.admin-btn-danger {
    background: #dc3545;
}

.admin-btn-danger:hover {
    background: #c82333;
}

.admin-btn-success {
    background: #28a745;
}

.admin-btn-success:hover {
    background: #218838;
}

/* Admin Status Badges */
.admin-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 4px;
    text-transform: uppercase;
}

.admin-badge-pending {
    background: #ffc107;
    color: #212529;
}

.admin-badge-approved {
    background: #28a745;
    color: white;
}

.admin-badge-rejected {
    background: #dc3545;
    color: white;
}

.admin-badge-unread {
    background: #17a2b8;
    color: white;
}

/* Admin Stats */
.admin-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.admin-stat-card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
}

.admin-stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: #007acc;
    margin-bottom: 0.5rem;
}

.admin-stat-label {
    color: #666;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Responsive Design */
@media (max-width: 768px) {
    .admin-container {
        padding: 10px;
    }
    
    .admin-nav ul {
        flex-direction: column;
    }
    
    .admin-table {
        font-size: 0.9rem;
    }
    
    .admin-stats {
        grid-template-columns: 1fr;
    }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
    .admin-container {
        background: #1a1a1a;
        color: #e0e0e0;
    }
    
    .admin-card {
        background: #2d2d2d;
        border-color: #404040;
    }
    
    .admin-table th {
        background: #404040;
    }
    
    .admin-form input,
    .admin-form textarea,
    .admin-form select {
        background: #2d2d2d;
        border-color: #404040;
        color: #e0e0e0;
    }
}

/* Print Styles */
@media print {
    .admin-nav,
    .admin-btn {
        display: none;
    }
    
    .admin-card {
        break-inside: avoid;
        box-shadow: none;
        border: 1px solid #000;
    }
}
EOF

    print_success "Created admin panel CSS file: assets/css/admin.css"
}

# Generate comprehensive CSS audit report
generate_css_audit_report() {
    print_status "Generating comprehensive CSS audit report..."
    
    local html_classes_file="$1"
    local css_rules_file="$2"
    local missing_css_file="$3"
    local unused_css_file="$4"
    
    cat > "$AUDIT_REPORT" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS Coverage Audit Report - $TIMESTAMP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
        h2 { color: #007acc; margin-top: 30px; }
        .metric { background: #f8f9fa; padding: 10px; margin: 5px 0; border-left: 4px solid #007acc; }
        .success { border-left-color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .error { border-left-color: #dc3545; }
        .summary { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; max-height: 300px; }
        .timestamp { color: #666; font-size: 0.9em; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .file-list { max-height: 200px; overflow-y: auto; background: #f8f9fa; padding: 10px; border-radius: 4px; }
        .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>CSS Coverage Audit Report</h1>
        <p class="timestamp">Generated on: $(date)</p>
        
        <div class="summary">
            <h3>Executive Summary</h3>
            <div class="grid">
                <div>
                    <h4>Coverage Statistics</h4>
                    <ul>
                        <li>Total HTML classes: $(wc -l < "$html_classes_file") classes</li>
                        <li>Total CSS rules: $(wc -l < "$css_rules_file") rules</li>
                        <li>Missing CSS: $(wc -l < "$missing_css_file") classes</li>
                        <li>Unused CSS: $(wc -l < "$unused_css_file") rules</li>
                    </ul>
                </div>
                <div>
                    <h4>File Analysis</h4>
                    <ul>
                        <li>CSS files: $(find "$PROJECT_ROOT/assets/css" -name "*.css" -not -path "*/minified/*" | wc -l) files</li>
                        <li>HTML files: $(find "$PROJECT_ROOT" -name "*.html" -o -name "*.php" | grep -v vendor | wc -l) files</li>
                        <li>Admin files: $(find "$PROJECT_ROOT/admin" -name "*.php" | wc -l) files</li>
                    </ul>
                </div>
            </div>
        </div>
EOF

    # Add missing CSS section
    if [ -s "$missing_css_file" ]; then
        echo '<h2>Missing CSS Classes</h2>' >> "$AUDIT_REPORT"
        echo '<div class="metric error">' >> "$AUDIT_REPORT"
        echo '<h4>Classes without CSS definitions:</h4>' >> "$AUDIT_REPORT"
        echo '<div class="file-list">' >> "$AUDIT_REPORT"
        head -50 "$missing_css_file" | while read -r class; do
            echo "<div>.$class</div>" >> "$AUDIT_REPORT"
        done
        echo '</div>' >> "$AUDIT_REPORT"
        echo '</div>' >> "$AUDIT_REPORT"
    fi
    
    # Add unused CSS section
    if [ -s "$unused_css_file" ]; then
        echo '<h2>Potentially Unused CSS Classes</h2>' >> "$AUDIT_REPORT"
        echo '<div class="metric warning">' >> "$AUDIT_REPORT"
        echo '<h4>CSS rules that may not be used:</h4>' >> "$AUDIT_REPORT"
        echo '<div class="file-list">' >> "$AUDIT_REPORT"
        head -50 "$unused_css_file" | while read -r class; do
            echo "<div>.$class</div>" >> "$AUDIT_REPORT"
        done
        echo '</div>' >> "$AUDIT_REPORT"
        echo '</div>' >> "$AUDIT_REPORT"
    fi
    
    # Add detailed analysis from other files
    for analysis_file in "$RESULTS_DIR"/*_analysis.txt; do
        if [ -f "$analysis_file" ]; then
            local analysis_name=$(basename "$analysis_file" .txt | sed 's/_/ /g' | sed 's/\b\w/\u&/g')
            echo "<h2>$analysis_name</h2>" >> "$AUDIT_REPORT"
            echo '<pre>' >> "$AUDIT_REPORT"
            cat "$analysis_file" >> "$AUDIT_REPORT"
            echo '</pre>' >> "$AUDIT_REPORT"
        fi
    done
    
    # Add recommendations
    cat >> "$AUDIT_REPORT" << EOF
        
        <h2>Recommendations</h2>
        
        <div class="recommendation">
            <h4>Immediate Actions</h4>
            <ul>
                <li>Review and add CSS for missing classes ($(wc -l < "$missing_css_file") classes)</li>
                <li>Consider removing unused CSS rules to reduce file size</li>
                <li>Ensure admin panel has dedicated CSS styling</li>
                <li>Add responsive design breakpoints if missing</li>
            </ul>
        </div>
        
        <div class="recommendation">
            <h4>Accessibility Improvements</h4>
            <ul>
                <li>Add focus styles for keyboard navigation</li>
                <li>Implement screen reader only styles</li>
                <li>Add support for prefers-reduced-motion</li>
                <li>Ensure sufficient color contrast ratios</li>
            </ul>
        </div>
        
        <div class="recommendation">
            <h4>Performance Optimization</h4>
            <ul>
                <li>Minify CSS files for production</li>
                <li>Consider critical CSS extraction</li>
                <li>Remove unused CSS rules</li>
                <li>Optimize CSS file organization</li>
            </ul>
        </div>
        
        <div class="recommendation">
            <h4>Maintenance</h4>
            <ul>
                <li>Set up regular CSS audits</li>
                <li>Use CSS linting tools</li>
                <li>Document CSS architecture</li>
                <li>Implement CSS naming conventions</li>
            </ul>
        </div>
        
        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
            <p>CSS Coverage Audit Report - Generated $TIMESTAMP</p>
            <p>Files analyzed: HTML/PHP files in project, CSS files in assets/css/</p>
        </footer>
    </div>
</body>
</html>
EOF

    print_success "CSS audit report generated: $AUDIT_REPORT"
}

# Main execution
main() {
    print_status "Starting CSS Coverage Audit"
    
    setup_results_directory
    
    echo -e "\n${BLUE}Analyzing CSS Coverage...${NC}"
    echo "=========================="
    
    # Extract classes and rules
    local html_classes_file=$(extract_html_classes)
    local css_rules_file=$(extract_css_rules)
    
    # Check coverage
    local missing_css_file=$(check_missing_css "$html_classes_file" "$css_rules_file")
    local unused_css_file=$(check_unused_css "$html_classes_file" "$css_rules_file")
    
    # Additional analysis
    analyze_css_structure
    check_responsive_design
    check_accessibility_css
    check_admin_css_coverage
    
    # Generate missing CSS
    generate_missing_css "$missing_css_file"
    
    # Generate report
    generate_css_audit_report "$html_classes_file" "$css_rules_file" "$missing_css_file" "$unused_css_file"
    
    echo -e "\n${GREEN}CSS Coverage Audit Completed!${NC}"
    echo "============================="
    
    print_success "Audit completed successfully!"
    print_status "Results saved in: $RESULTS_DIR"
    print_status "Report available at: $AUDIT_REPORT"
    
    # Summary
    local total_html_classes=$(wc -l < "$html_classes_file")
    local total_css_rules=$(wc -l < "$css_rules_file")
    local missing_count=$(wc -l < "$missing_css_file")
    local unused_count=$(wc -l < "$unused_css_file")
    
    echo ""
    echo "=== SUMMARY ==="
    print_metric "Total HTML classes: $total_html_classes"
    print_metric "Total CSS rules: $total_css_rules"
    print_metric "Missing CSS classes: $missing_count"
    print_metric "Unused CSS rules: $unused_count"
    
    if [ "$missing_count" -eq 0 ] && [ "$unused_count" -lt 10 ]; then
        print_success "🎉 Excellent CSS coverage!"
    elif [ "$missing_count" -lt 10 ] && [ "$unused_count" -lt 20 ]; then
        print_success "✅ Good CSS coverage with minor improvements needed"
    else
        print_warning "⚠️ CSS coverage needs attention"
    fi
    
    # Open report if on desktop environment
    if command -v xdg-open >/dev/null 2>&1; then
        read -p "Would you like to open the CSS audit report? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            xdg-open "$AUDIT_REPORT"
        fi
    fi
}

# Run main function
main "$@"
#!/bin/bash
# Setup script to initialize dynamic content in the database

echo "=== Portfolio Dynamic Content Setup ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if database is configured
if [ ! -f "config/production.env" ]; then
    echo -e "${RED}Error: config/production.env not found${NC}"
    echo "Please create the configuration file first."
    exit 1
fi

# Source database configuration
source config/production.env

echo -e "${YELLOW}Step 1: Running database migrations...${NC}"
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/init.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database schema updated successfully${NC}"
else
    echo -e "${RED}✗ Failed to update database schema${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Populating skills from JSON...${NC}"
php -r "
require_once 'src/config/Database.php';

\$db = Database::getInstance();
\$json = file_get_contents('data/skills.json');
\$data = json_decode(\$json, true);

if (!isset(\$data['skills'])) {
    echo 'Error: Invalid skills JSON format\n';
    exit(1);
}

\$count = 0;
foreach (\$data['skills'] as \$skill) {
    \$sql = \"INSERT INTO skills (category, name, description, level, icon, order_position, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                description = VALUES(description),
                level = VALUES(level),
                icon = VALUES(icon),
                order_position = VALUES(order_position)\";
    
    \$result = \$db->execute(\$sql, [
        \$skill['category'],
        \$skill['name'],
        \$skill['description'] ?? null,
        \$skill['level'],
        \$skill['icon'] ?? null,
        \$skill['order_position'] ?? 0,
        \$skill['is_active'] ?? true
    ]);
    
    if (\$result) \$count++;
}

echo \"Imported \$count skills\n\";
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Skills imported successfully${NC}"
else
    echo -e "${RED}✗ Failed to import skills${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Populating education from JSON...${NC}"
php -r "
require_once 'src/config/Database.php';

\$db = Database::getInstance();
\$json = file_get_contents('data/education.json');
\$data = json_decode(\$json, true);

if (!isset(\$data['education'])) {
    echo 'Error: Invalid education JSON format\n';
    exit(1);
}

\$count = 0;
foreach (\$data['education'] as \$edu) {
    \$sql = \"INSERT INTO education (institution, degree, field_of_study, start_date, end_date, 
            is_current, description, location, achievements, skills, order_position, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\";
    
    \$result = \$db->execute(\$sql, [
        \$edu['institution'],
        \$edu['degree'],
        \$edu['field_of_study'] ?? null,
        \$edu['start_date'],
        \$edu['end_date'] ?? null,
        \$edu['is_current'] ?? false,
        \$edu['description'] ?? null,
        \$edu['location'] ?? null,
        \$edu['achievements'] ?? null,
        \$edu['skills'] ?? null,
        \$edu['order_position'] ?? 0,
        \$edu['is_active'] ?? true
    ]);
    
    if (\$result) \$count++;
}

echo \"Imported \$count education entries\n\";
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Education imported successfully${NC}"
else
    echo -e "${RED}✗ Failed to import education${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Populating projects from JSON...${NC}"
php -r "
require_once 'src/config/Database.php';

\$db = Database::getInstance();
\$json = file_get_contents('data/projects.json');
\$data = json_decode(\$json, true);

if (!isset(\$data['projects'])) {
    echo 'Error: Invalid projects JSON format\n';
    exit(1);
}

\$count = 0;
foreach (\$data['projects'] as \$project) {
    \$sql = \"INSERT INTO projects (title, description, short_description, image_url, demo_url, 
            github_url, technologies, category, featured, order_position, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\";
    
    \$result = \$db->execute(\$sql, [
        \$project['title'],
        \$project['description'],
        \$project['short_description'] ?? null,
        \$project['image_url'] ?? null,
        \$project['demo_url'] ?? null,
        \$project['github_url'] ?? null,
        \$project['technologies'] ?? null,
        \$project['category'] ?? null,
        \$project['featured'] ?? false,
        \$project['order_position'] ?? 0,
        \$project['is_active'] ?? true
    ]);
    
    if (\$result) \$count++;
}

echo \"Imported \$count projects\n\";
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Projects imported successfully${NC}"
else
    echo -e "${RED}✗ Failed to import projects${NC}"
fi

echo ""
echo -e "${GREEN}=== Setup Complete! ===${NC}"
echo ""
echo "Your portfolio content has been imported into the database."
echo "You can now:"
echo "  1. Access the admin dashboard at: /admin/dashboard.php"
echo "  2. Manage skills at: /admin/manage-skills.php"
echo "  3. Manage education at: /admin/manage-education.php"
echo "  4. Manage projects at: /admin/manage-projects.php"
echo ""
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo -e "${RED}IMPORTANT: Change the admin password after first login!${NC}"

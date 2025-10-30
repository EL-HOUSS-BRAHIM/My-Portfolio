# Dynamic Content Management System

This portfolio now features a complete dynamic content management system that allows you to manage Skills, Education, and Projects through an admin dashboard.

## 🎯 Features

### Dynamic Sections
- **Skills**: Manage technical skills with categories, proficiency levels, and icons
- **Education**: Track educational background with dates, descriptions, and achievements
- **Projects**: Showcase portfolio projects with images, links, and technologies

### Admin Dashboard
- Secure authentication system
- CRUD operations for all dynamic content
- Real-time statistics and metrics
- Responsive admin interface
- User-friendly forms with validation

### API Endpoints
- RESTful API for all content types
- JSON responses
- Authentication-protected write operations
- Public read access for active items

## 📁 File Structure

```
My-Portfolio/
├── admin/
│   ├── dashboard.php          # Main admin dashboard
│   ├── login.php              # Admin login page
│   ├── manage-skills.php      # Skills management interface
│   ├── manage-education.php   # Education management interface
│   └── manage-projects.php    # Projects management interface
│
├── src/api/
│   ├── skills.php             # Skills API endpoint
│   ├── education.php          # Education API endpoint
│   └── projects.php           # Projects API endpoint
│
├── data/
│   ├── skills.json            # Initial skills data
│   ├── education.json         # Initial education data
│   └── projects.json          # Initial projects data
│
├── assets/js-clean/
│   ├── dynamic-skills.js      # Frontend skills loader
│   ├── dynamic-education.js   # Frontend education loader
│   └── dynamic-projects.js    # Frontend projects loader
│
├── database/
│   └── init.sql               # Database schema (updated)
│
└── scripts/
    └── setup-dynamic-content.sh  # Setup script
```

## 🚀 Setup Instructions

### 1. Database Setup

Run the database initialization script:

```bash
mysql -u your_username -p your_database < database/init.sql
```

Or use the automated setup script:

```bash
chmod +x scripts/setup-dynamic-content.sh
./scripts/setup-dynamic-content.sh
```

This will:
- Create necessary database tables
- Import initial data from JSON files
- Set up the default admin account

### 2. Configuration

Ensure your database configuration is set in `config/production.env`:

```env
DB_HOST=localhost
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password
```

### 3. Default Admin Access

Default credentials:
- **Username**: admin
- **Password**: admin123

⚠️ **IMPORTANT**: Change this password immediately after first login!

### 4. Frontend Integration

The dynamic content loaders are automatically included in `index.html`. They will:
- Fetch data from APIs on page load
- Render content dynamically
- Apply animations and transitions
- Handle errors gracefully

## 📝 Usage Guide

### Admin Dashboard

1. **Login**: Navigate to `/admin/login.php`
2. **Dashboard**: View statistics for all content types
3. **Manage Content**: Use the management pages to add, edit, or delete items

### Managing Skills

**Location**: `/admin/manage-skills.php`

**Fields**:
- Category (Frontend/Backend/Tools & DevOps)
- Skill Name
- Description
- Level (0-100)
- Icon Class (Font Awesome)
- Order Position
- Active Status

**Example**:
```json
{
  "category": "Frontend Development",
  "name": "React",
  "description": "Hooks, Context API, Component Architecture",
  "level": 85,
  "icon": "fab fa-react",
  "order_position": 2,
  "is_active": true
}
```

### Managing Education

**Location**: `/admin/manage-education.php`

**Fields**:
- Institution
- Degree
- Field of Study
- Start Date
- End Date (or "Currently Studying")
- Description
- Location
- Achievements
- Skills (comma-separated)
- Order Position
- Active Status

**Example**:
```json
{
  "institution": "ALX Software Engineering Program",
  "degree": "Certified Full Stack Software Engineer",
  "field_of_study": "Backend Specialization",
  "start_date": "2023-01-01",
  "end_date": "2024-01-01",
  "is_current": false,
  "description": "Intensive 12-month program...",
  "location": "Online",
  "skills": "Python, JavaScript, Node.js, SQL"
}
```

### Managing Projects

**Location**: `/admin/manage-projects.php`

**Fields**:
- Title
- Description
- Short Description
- Image URL
- Demo URL
- GitHub URL
- Technologies (comma-separated)
- Category
- Featured (checkbox)
- Order Position
- Active Status

**Example**:
```json
{
  "title": "Budgetify",
  "description": "Full-stack finance management app...",
  "short_description": "Personal finance tracker",
  "image_url": "assets/images/budgetify.jpg",
  "demo_url": "https://demo.com",
  "github_url": "https://github.com/...",
  "technologies": "Node.js, Express, MongoDB, React",
  "category": "Team Collaboration",
  "featured": true
}
```

## 🔌 API Documentation

### Skills API

**Endpoint**: `/src/api/skills.php`

**GET** - Retrieve skills
```
GET /src/api/skills.php?active=true
GET /src/api/skills.php?category=Frontend%20Development
```

**POST** - Create skill (requires authentication)
```json
{
  "category": "Frontend Development",
  "name": "Vue.js",
  "description": "Progressive JavaScript framework",
  "level": 75,
  "icon": "fab fa-vuejs"
}
```

**PUT** - Update skill (requires authentication)
```json
{
  "id": 1,
  "level": 90
}
```

**DELETE** - Delete skill (requires authentication)
```
DELETE /src/api/skills.php?id=1
```

### Education API

**Endpoint**: `/src/api/education.php`

Similar structure to Skills API.

### Projects API

**Endpoint**: `/src/api/projects.php`

**Additional Filters**:
```
GET /src/api/projects.php?featured=true
GET /src/api/projects.php?category=Backend
```

## 🎨 Customization

### Adding New Skill Categories

1. Edit `assets/js-clean/dynamic-skills.js`
2. Add to `categoryConfig` object:
```javascript
'Your Category': {
    icon: 'fas fa-your-icon',
    description: 'Your description'
}
```

### Styling

Each section has its own CSS file in `assets/css/`:
- `skills.css` - Skills section styling
- `experience.css` - Education section styling
- `projects.css` - Projects section styling

### JSON Data Structure

You can bulk import data by editing JSON files in `/data/` directory and running:

```bash
./scripts/setup-dynamic-content.sh
```

## 🔒 Security Features

- Session-based authentication
- CSRF token protection
- Password hashing with bcrypt
- Rate limiting on login attempts
- SQL injection prevention with prepared statements
- XSS protection with input sanitization
- Admin-only access to write operations

## 🐛 Troubleshooting

### Skills/Education/Projects not loading

1. Check browser console for errors
2. Verify API endpoints are accessible:
   - Visit `/src/api/skills.php`
   - Should return JSON response
3. Check database connection in `config/production.env`
4. Ensure tables exist in database

### Admin login issues

1. Verify database contains admin user
2. Check session configuration in PHP
3. Clear browser cookies
4. Reset admin password:
```sql
UPDATE admin_users 
SET password_hash = '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsOOO6VBq'
WHERE username = 'admin';
```

### Content not updating

1. Clear browser cache (Ctrl+Shift+R)
2. Check if `is_active` is set to true
3. Verify API returns updated data
4. Check database for changes

## 📊 Database Schema

### Skills Table
```sql
- id (INT, PRIMARY KEY)
- category (VARCHAR)
- name (VARCHAR)
- description (TEXT)
- level (INT, 0-100)
- icon (VARCHAR)
- order_position (INT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Education Table
```sql
- id (INT, PRIMARY KEY)
- institution (VARCHAR)
- degree (VARCHAR)
- field_of_study (VARCHAR)
- start_date (DATE)
- end_date (DATE)
- is_current (BOOLEAN)
- description (TEXT)
- location (VARCHAR)
- achievements (TEXT)
- skills (TEXT)
- order_position (INT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Projects Table
```sql
- id (INT, PRIMARY KEY)
- title (VARCHAR)
- description (TEXT)
- short_description (VARCHAR)
- image_url (VARCHAR)
- demo_url (VARCHAR)
- github_url (VARCHAR)
- technologies (TEXT)
- category (VARCHAR)
- featured (BOOLEAN)
- order_position (INT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🔄 Backup and Restore

### Export Current Data

```bash
# Export to JSON
php scripts/export-to-json.php

# Export database
mysqldump -u username -p database_name > backup.sql
```

### Import Data

```bash
# From JSON files
./scripts/setup-dynamic-content.sh

# From SQL backup
mysql -u username -p database_name < backup.sql
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error logs in `storage/logs/`
3. Check browser console for JavaScript errors
4. Verify database connectivity

## 🎉 Next Steps

1. Log into admin dashboard
2. Change default password
3. Add your skills, education, and projects
4. Customize styling to match your brand
5. Add more projects as you complete them
6. Keep your portfolio updated!

---

**Made with ❤️ for Your Portfolio**

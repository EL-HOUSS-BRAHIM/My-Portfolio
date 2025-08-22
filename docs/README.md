# Portfolio Application Documentation

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Admin Panel Guide](#admin-panel-guide)
- [Development Guide](#development-guide)
- [Deployment Guide](#deployment-guide)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)
- [Security Guidelines](#security-guidelines)

## Overview

This portfolio application is a modern, responsive web application built with PHP, HTML5, CSS3, and JavaScript. It features:

- **Professional Portfolio Display**: Showcase projects, skills, and experience
- **Admin Panel**: Content management system for easy updates
- **Contact Form**: Secure contact form with spam protection
- **Testimonials**: Display client testimonials and reviews
- **Responsive Design**: Mobile-first, responsive layout
- **Performance Optimized**: Fast loading with optimized assets
- **SEO Friendly**: Structured data and meta optimization
- **Security Features**: CSRF protection, rate limiting, input validation

## Project Structure

```
My-Portfolio/
├── admin/                  # Admin panel files
│   ├── dashboard.php       # Admin dashboard
│   ├── login.php          # Admin login
│   └── logout.php         # Admin logout
├── assets/                # Static assets
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   ├── images/            # Images
│   └── icons/             # Icons
├── config/                # Configuration files
│   └── environments/      # Environment-specific configs
├── database/              # Database related files
│   ├── migrations/        # Database migrations
│   └── seeders/          # Database seeders
├── scripts/               # Utility scripts
├── src/                   # Source code
│   ├── api/              # API endpoints
│   ├── auth/             # Authentication
│   ├── config/           # Configuration classes
│   └── utils/            # Utility classes
├── storage/              # Storage directory
│   ├── logs/             # Application logs
│   ├── cache/            # Cache files
│   └── sessions/         # Session files
├── tests/                # Test files
├── vendor/               # Composer dependencies
├── index.html            # Main page
└── composer.json         # PHP dependencies
```

## Installation & Setup

### Prerequisites

- PHP 8.1 or higher
- MySQL 5.7 or higher
- Composer
- Node.js 16+ (for development tools)
- Web server (Apache/Nginx)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/portfolio.git
   cd portfolio
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install development dependencies**
   ```bash
   npm install
   ```

4. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

5. **Configure environment variables**
   ```bash
   nano .env
   ```

6. **Set up database**
   ```bash
   ./scripts/migrate.sh install
   ./scripts/migrate.sh migrate
   ```

7. **Set permissions**
   ```bash
   chmod -R 755 storage/
   chmod -R 755 assets/uploads/
   ```

8. **Start development server**
   ```bash
   php -S localhost:8000
   ```

## Environment Configuration

### Environment Files

- `.env.development` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### Key Configuration Options

```bash
# Application
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_HOST=localhost
DB_NAME=portfolio
DB_USERNAME=root
DB_PASSWORD=

# Mail
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=
MAIL_PASSWORD=

# Security
CSRF_TOKEN_NAME=_token
SESSION_SECURE_COOKIES=false
```

### Feature Flags

The application uses feature flags for controlling functionality:

```json
{
  "development": {
    "debug_mode": true,
    "analytics": false,
    "newsletter": true,
    "blog": true
  },
  "production": {
    "debug_mode": false,
    "analytics": true,
    "newsletter": true,
    "blog": true
  }
}
```

## Database Setup

### Migrations

Run database migrations:

```bash
# Run all pending migrations
./scripts/migrate.sh migrate

# Run migrations for specific environment
./scripts/migrate.sh migrate production

# Check migration status
./scripts/migrate.sh status

# Rollback migrations
./scripts/migrate.sh rollback 3

# Create new migration
./scripts/migrate.sh create add_new_table
```

### Database Schema

The application includes the following main tables:

- `users` - Admin users
- `contact_submissions` - Contact form submissions
- `testimonials` - Client testimonials
- `projects` - Portfolio projects
- `skills` - Skills and technologies
- `experiences` - Work experience
- `blog_posts` - Blog posts (if enabled)
- `newsletter_subscribers` - Newsletter subscribers

## API Documentation

### Authentication

The API uses session-based authentication for admin operations.

#### Login
```http
POST /src/api/auth/login.php
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### Contact Form

#### Submit Contact Form
```http
POST /src/api/contact.php
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Project Inquiry",
  "message": "Hello, I'm interested in your services."
}
```

Response:
```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

### Testimonials

#### Get Testimonials
```http
GET /src/api/testimonials.php
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Jane Smith",
      "position": "CEO",
      "company": "Tech Corp",
      "content": "Excellent work!",
      "rating": 5
    }
  ]
}
```

#### Add Testimonial (Admin)
```http
POST /src/api/testimonials.php
Content-Type: application/json

{
  "name": "Jane Smith",
  "position": "CEO",
  "company": "Tech Corp",
  "content": "Excellent work!",
  "rating": 5
}
```

### Projects

#### Get Projects
```http
GET /src/api/projects.php
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "E-commerce Platform",
      "description": "Full-stack e-commerce solution",
      "technologies": ["PHP", "MySQL", "JavaScript"],
      "github_url": "https://github.com/user/project",
      "live_url": "https://project.example.com"
    }
  ]
}
```

### Error Handling

All API endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "validation_error",
  "message": "Invalid input data",
  "details": {
    "email": "Valid email address is required"
  }
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

### Rate Limiting

API endpoints are rate-limited:
- Development: 1000 requests/hour
- Production: 100 requests/hour
- Contact form: 5 submissions/hour per IP

## Admin Panel Guide

### Accessing the Admin Panel

1. Navigate to `/admin/`
2. Login with admin credentials
3. Use the dashboard to manage content

### Dashboard Features

#### Contact Submissions
- View all contact form submissions
- Mark as read/unread
- Reply to messages
- Archive old submissions

#### Testimonials Management
- Add new testimonials
- Edit existing testimonials
- Set featured testimonials
- Reorder display

#### Projects Management
- Add new projects
- Upload project images
- Set project technologies
- Manage project links

#### User Management
- Create admin users
- Manage user roles
- Update user information

### Content Upload Guidelines

#### Images
- **Format**: JPG, PNG, WebP
- **Size**: Maximum 5MB
- **Dimensions**: 
  - Project images: 1200x800px recommended
  - Testimonial avatars: 200x200px
  - Profile images: 400x400px

#### Text Content
- **Testimonials**: Maximum 500 characters
- **Project descriptions**: Maximum 1000 characters
- **Skills**: Keep skill names concise

## Development Guide

### Code Structure

#### PHP Classes
- `EnvironmentConfig` - Environment configuration management
- `Logger` - Application logging
- `PerformanceMonitor` - Performance tracking
- `SecurityManager` - Security utilities
- `DatabaseConnection` - Database abstraction

#### JavaScript Modules
- `app.js` - Main application logic
- `contact.js` - Contact form handling
- `animations.js` - UI animations
- `mobile.js` - Mobile-specific functionality

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes**
   - Follow PSR-12 coding standards
   - Write tests for new functionality
   - Update documentation

3. **Run tests**
   ```bash
   composer test
   npm test
   ```

4. **Quality checks**
   ```bash
   ./scripts/quality-check.sh
   ```

5. **Submit pull request**

### Testing

#### PHP Tests
```bash
# Run all tests
composer test

# Run specific test suite
./vendor/bin/phpunit tests/Unit
./vendor/bin/phpunit tests/Integration

# Generate coverage report
composer test-coverage
```

#### JavaScript Tests
```bash
# Run Jest tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Code Quality

#### PHP Standards
- PSR-12 coding standard
- PHPStan level 8 analysis
- PHPUnit for testing

#### JavaScript Standards
- ESLint with standard configuration
- Jest for testing
- Prettier for formatting

#### CSS Standards
- Stylelint for CSS linting
- BEM methodology
- Mobile-first responsive design

## Deployment Guide

### Production Deployment

1. **Prepare environment**
   ```bash
   # Set up production environment
   cp .env.production .env
   nano .env  # Configure production values
   ```

2. **Install dependencies**
   ```bash
   composer install --no-dev --optimize-autoloader
   ```

3. **Run migrations**
   ```bash
   ./scripts/migrate.sh migrate production
   ```

4. **Optimize assets**
   ```bash
   ./scripts/optimize.sh
   ```

5. **Set up web server**
   - Configure Apache/Nginx
   - Enable SSL/TLS
   - Set up proper file permissions

6. **Configure monitoring**
   ```bash
   ./scripts/setup-monitoring.sh
   crontab storage/monitoring/monitoring-crontab
   ```

### Staging Deployment

Use staging environment for testing:

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Run tests on staging
./scripts/test-staging.sh
```

### Zero-Downtime Deployment

1. **Deploy to new directory**
2. **Run migrations**
3. **Update symlink**
4. **Restart services**

## Monitoring & Maintenance

### Health Monitoring

Access health check endpoint:
```http
GET /health.php
```

Response:
```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "storage": "ok",
    "logs": "ok",
    "disk_space": "ok",
    "memory": "ok"
  },
  "metrics": {
    "memory_usage": 52428800,
    "disk_usage_percent": 45.2,
    "uptime": 86400
  }
}
```

### Log Management

#### Log Locations
- Application logs: `storage/logs/app-YYYY-MM-DD.log`
- Performance logs: `storage/logs/performance-YYYY-MM-DD.log`
- Security logs: `storage/logs/security-YYYY-MM-DD.log`
- API logs: `storage/logs/api-YYYY-MM-DD.log`

#### Log Levels
- `EMERGENCY` - System is unusable
- `ALERT` - Action must be taken immediately
- `CRITICAL` - Critical conditions
- `ERROR` - Error conditions
- `WARNING` - Warning conditions
- `NOTICE` - Normal but significant condition
- `INFO` - Informational messages
- `DEBUG` - Debug-level messages

### Performance Monitoring

Monitor key metrics:
- Response time
- Memory usage
- Database query count
- Error rate
- Uptime percentage

### Backup Procedures

#### Automated Backups
- Database: Daily at 2 AM
- Files: Weekly
- Retention: 30 days

#### Manual Backup
```bash
# Database backup
mysqldump -u username -p database_name > backup.sql

# File backup
tar -czf backup.tar.gz /path/to/portfolio
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
1. Check database credentials in `.env`
2. Verify database server is running
3. Check network connectivity
4. Review database logs

#### File Permission Errors
```bash
# Fix storage permissions
chmod -R 755 storage/
chown -R www-data:www-data storage/

# Fix upload permissions
chmod -R 755 assets/uploads/
chown -R www-data:www-data assets/uploads/
```

#### Performance Issues
1. Enable OpCache in production
2. Check slow query log
3. Monitor memory usage
4. Review database indexes

#### Email Delivery Issues
1. Check SMTP configuration
2. Verify firewall settings
3. Test with different email provider
4. Check spam folders

### Debug Mode

Enable debug mode in development:
```bash
APP_DEBUG=true
LOG_LEVEL=DEBUG
```

This provides:
- Detailed error messages
- Stack traces
- Query logging
- Performance metrics

### Log Analysis

#### View recent errors
```bash
tail -f storage/logs/app-$(date +%Y-%m-%d).log | grep ERROR
```

#### Monitor performance
```bash
tail -f storage/logs/performance-$(date +%Y-%m-%d).log
```

#### Check security events
```bash
tail -f storage/logs/security-$(date +%Y-%m-%d).log
```

## Security Guidelines

### Best Practices

1. **Input Validation**
   - Validate all user inputs
   - Use prepared statements
   - Escape output data

2. **Authentication**
   - Use strong passwords
   - Implement rate limiting
   - Enable session regeneration

3. **File Security**
   - Validate file uploads
   - Scan for malware
   - Restrict file types

4. **HTTPS**
   - Force HTTPS in production
   - Use HSTS headers
   - Proper SSL configuration

5. **Headers**
   - Content Security Policy
   - X-Frame-Options
   - X-Content-Type-Options

### Security Headers

```php
// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
```

### Regular Security Tasks

1. **Update dependencies** (monthly)
2. **Review access logs** (weekly)
3. **Security scan** (quarterly)
4. **Penetration testing** (annually)

---

## Support

For questions or issues:

1. Check this documentation
2. Review troubleshooting section
3. Check application logs
4. Contact development team

## Contributing

1. Fork the repository
2. Create feature branch
3. Follow coding standards
4. Write tests
5. Submit pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.
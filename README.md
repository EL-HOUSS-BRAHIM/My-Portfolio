# Portfolio Website - Brahim El Houss

🌟 **Modern Portfolio Website** showcasing Full Stack Software Engineering skills and projects.

## 🚀 Live Demo
- **Production**: [brahim-crafts.tech](https://brahim-crafts.tech)
- **Alternative**: [brahim-elhouss.me](https://brahim-elhouss.me)

## 📋 Project Overview

A professional portfolio website featuring:
- **Responsive Design**: Mobile-first approach with modern UI/UX
- **Contact System**: Enhanced contact form with real-time validation
- **Testimonials**: Dynamic testimonial carousel with admin management
- **Admin Panel**: Secure admin dashboard for content management
- **SEO Optimized**: Complete meta tags, schema.org markup, and sitemap
- **Performance**: Optimized assets and fast loading times

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern CSS with animations and responsive design
- **JavaScript ES6+**: Modular architecture with async/await patterns
- **Progressive Enhancement**: Works without JavaScript enabled

### Backend
- **PHP 8.1+**: Modern PHP with OOP principles
- **MySQL**: Relational database with proper indexing
- **PDO**: Secure database connections with prepared statements
- **PHPMailer**: Email functionality with SMTP support

### DevOps & Deployment
- **Nginx**: Web server with optimized configuration
- **SSL/TLS**: Secure HTTPS with proper headers
- **Environment Variables**: Secure configuration management
- **Composer**: PHP dependency management

## 📁 Project Structure

```
/portfolio/
├── /admin/                     # Admin panel
│   ├── dashboard.php          # Admin dashboard
│   ├── login.php              # Admin authentication
│   └── logout.php             # Session management
├── /assets/                   # Frontend assets
│   ├── /css/                  # Stylesheets
│   │   └── portfolio.css      # Main stylesheet
│   ├── /js/                   # JavaScript modules
│   │   ├── main.js            # Application controller
│   │   ├── portfolio.js       # Contact form & animations
│   │   └── testimonials.js    # Testimonial carousel
│   ├── /images/               # Static images
│   ├── /icons/                # Icon files
│   └── /uploads/              # User uploads
├── /config/                   # Configuration files
├── /database/                 # Database scripts
│   ├── init.sql              # Database initialization
│   └── setup.sh              # Automated setup
├── /src/                     # PHP backend
│   ├── /api/                  # API endpoints
│   │   ├── contact.php        # Contact form handler
│   │   ├── add_testimonial.php # Testimonial submission
│   │   ├── get_testimonials.php # Testimonial retrieval
│   │   └── get_image.php      # Image serving
│   ├── /auth/                 # Authentication classes
│   ├── /config/               # Configuration classes
│   └── /utils/                # Utility classes
├── /storage/                  # Runtime storage
│   ├── /logs/                 # Application logs
│   ├── /cache/                # Cached data
│   └── /sessions/             # PHP sessions
├── /vendor/                   # Composer dependencies
├── /scripts/                  # Deployment and optimization scripts
│   ├── deploy.sh              # Enhanced deployment script
│   ├── optimize.sh            # Performance optimization script
│   ├── validate.sh            # Validation script
│   └── security-audit.sh      # Security checks
├── index.html                 # Main portfolio page
├── .env.example               # Environment template
└── composer.json              # PHP dependencies
```

## 🚀 Quick Start

### Prerequisites
- PHP 8.1 or higher
- MySQL 5.7 or higher
- Composer
- Web server (Nginx/Apache)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd portfolio
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   chmod +x database/setup.sh
   ./database/setup.sh
   ```

5. **Web server configuration**
   ```bash
   # Use the enhanced deployment script
   chmod +x scripts/deploy.sh
   sudo ./scripts/deploy.sh
   ```

### Performance Optimization

To optimize your portfolio for production:
```bash
chmod +x scripts/optimize.sh
./scripts/optimize.sh
```

This will:
- Minify CSS and JavaScript files
- Optimize and convert images to WebP
- Generate cache warmup scripts
- Create optimized .htaccess configuration
- Run security audits

### Development Server

For local development:
```bash
php -S localhost:8080
```

Visit `http://localhost:8080` to view the portfolio.

## 🔧 Configuration

### Environment Variables (.env)

```env
# Database Configuration
DB_HOST=localhost
DB_NAME=portfolio_db
DB_USER=your_username
DB_PASS=your_password

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
ADMIN_EMAIL=admin@yourdomain.com

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password_hash

# Security
CSRF_SECRET=random_32_character_string
SESSION_NAME=portfolio_session

# Application
APP_URL=https://yourdomain.com
APP_ENV=production
```

### Database Schema

The application uses the following main tables:
- `testimonials`: User testimonials with images
- `contact_messages`: Contact form submissions
- `admin_users`: Admin authentication

See `/database/init.sql` for complete schema.

## 🛡️ Security Features

- **Input Validation**: Comprehensive server-side validation
- **SQL Injection Protection**: PDO prepared statements
- **XSS Prevention**: Output escaping and Content Security Policy
- **CSRF Protection**: Token-based form protection
- **Rate Limiting**: API endpoint protection
- **Session Security**: Secure session configuration
- **Password Hashing**: Bcrypt with salt
- **File Upload Security**: Type validation and size limits

## 🎨 Features

### Contact Form
- Real-time field validation
- Email format verification
- Message length validation
- Loading states and visual feedback
- Spam protection

### Testimonials System
- Image upload with validation
- Star rating system
- Carousel navigation
- Admin approval workflow

### Admin Panel
- Secure authentication
- Dashboard with statistics
- Content management
- Message management
- Session management

### SEO Optimization
- Meta tags optimization
- Open Graph and Twitter Cards
- Schema.org JSON-LD markup
- XML sitemap
- Robots.txt configuration

## 📱 Responsive Design

- **Mobile-first approach**
- **Breakpoints**: 320px, 768px, 1024px, 1200px
- **Touch-friendly interfaces**
- **Optimized images** for different screen sizes

## 🚀 Performance

- **Optimized CSS/JS**: Minified and compressed
- **Image optimization**: WebP format support
- **Caching headers**: Browser and server-side caching
- **Lazy loading**: Images loaded on demand
- **CDN ready**: Asset organization for CDN deployment

## 🔧 Maintenance

### Backup
Regular backups are recommended:
```bash
# Database backup
mysqldump -u username -p portfolio_db > backup.sql

# Files backup
tar -czf portfolio_backup.tar.gz /path/to/portfolio
```

### Logs
Application logs are stored in `/storage/logs/`:
- `error.log`: PHP and application errors
- `access.log`: Contact form submissions
- `admin.log`: Admin panel activities

### Updates
1. Backup current installation
2. Update code files
3. Run database migrations if needed
4. Clear cache: `rm -rf storage/cache/*`
5. Test functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License. See LICENSE file for details.

## 📞 Support

For questions or support:
- **Email**: brahim@yourdomain.com
- **LinkedIn**: [linkedin.com/in/brahim-el-houss](https://linkedin.com/in/brahim-el-houss)
- **GitHub**: [github.com/EL-HOUSS-BRAHIM](https://github.com/EL-HOUSS-BRAHIM)

## 🚀 Deployment

See `DEPLOYMENT.md` for detailed deployment instructions.

---

**Portfolio Website** - Built with ❤️ by Brahim El Houss

# API Documentation

## Overview

The Portfolio API provides endpoints for managing portfolio content, handling contact submissions, and administrative functions. All API endpoints return JSON responses and follow RESTful conventions.

## Base URL

```
Development: http://localhost:8000/src/api
Production: https://brahim-elhouss.me/src/api
```

## Authentication

The API uses session-based authentication for administrative operations. Public endpoints (like contact form submission) do not require authentication.

### Login

Authenticate to access protected endpoints.

**Endpoint:** `POST /auth/login.php`

**Request:**
```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "last_login": "2024-01-01 12:00:00"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "authentication_failed",
  "message": "Invalid credentials"
}
```

### Logout

**Endpoint:** `POST /auth/logout.php`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Check Authentication Status

**Endpoint:** `GET /auth/status.php`

**Response (Authenticated):**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

**Response (Not Authenticated):**
```json
{
  "authenticated": false
}
```

## Contact Form

### Submit Contact Form

Submit a contact form message.

**Endpoint:** `POST /contact.php`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Project Inquiry",
  "message": "I'm interested in discussing a potential project with you."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "id": 123
}
```

**Validation Rules:**
- `name`: Required, 2-100 characters
- `email`: Required, valid email format
- `subject`: Optional, max 200 characters
- `message`: Required, 10-2000 characters

**Rate Limiting:** 5 submissions per hour per IP address

## Testimonials

### Get Testimonials

Retrieve all active testimonials.

**Endpoint:** `GET /testimonials.php`

**Query Parameters:**
- `featured`: `true` to get only featured testimonials
- `limit`: Number of testimonials to return (default: 50)
- `offset`: Offset for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Jane Smith",
      "position": "CEO",
      "company": "Tech Corp",
      "content": "Excellent work! The project was delivered on time and exceeded expectations.",
      "rating": 5,
      "avatar_path": "/assets/uploads/testimonials/jane-smith.jpg",
      "is_featured": true,
      "created_at": "2024-01-01 10:00:00"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

### Add Testimonial (Admin)

**Endpoint:** `POST /testimonials.php`

**Authentication Required:** Yes

**Request:**
```json
{
  "name": "Jane Smith",
  "position": "CEO",
  "company": "Tech Corp",
  "content": "Excellent work!",
  "rating": 5,
  "is_featured": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Testimonial added successfully",
  "id": 26
}
```

### Update Testimonial (Admin)

**Endpoint:** `PUT /testimonials.php?id=1`

**Authentication Required:** Yes

**Request:**
```json
{
  "name": "Jane Smith",
  "position": "CTO",
  "company": "Tech Corp",
  "content": "Updated testimonial content",
  "rating": 5,
  "is_featured": true
}
```

### Delete Testimonial (Admin)

**Endpoint:** `DELETE /testimonials.php?id=1`

**Authentication Required:** Yes

**Response:**
```json
{
  "success": true,
  "message": "Testimonial deleted successfully"
}
```

## Projects

### Get Projects

Retrieve all active projects.

**Endpoint:** `GET /projects.php`

**Query Parameters:**
- `featured`: `true` to get only featured projects
- `technology`: Filter by technology (e.g., "PHP", "JavaScript")
- `limit`: Number of projects to return (default: 20)
- `offset`: Offset for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "E-commerce Platform",
      "description": "Full-stack e-commerce solution with payment integration",
      "short_description": "Modern e-commerce platform",
      "technologies": ["PHP", "MySQL", "JavaScript", "Bootstrap"],
      "image_path": "/assets/images/projects/ecommerce.jpg",
      "github_url": "https://github.com/user/ecommerce",
      "live_url": "https://demo.example.com",
      "is_featured": true,
      "start_date": "2023-06-01",
      "end_date": "2023-08-15",
      "created_at": "2024-01-01 09:00:00"
    }
  ],
  "total": 12,
  "limit": 20,
  "offset": 0
}
```

### Add Project (Admin)

**Endpoint:** `POST /projects.php`

**Authentication Required:** Yes

**Request:**
```json
{
  "title": "New Project",
  "description": "Detailed project description",
  "short_description": "Brief project summary",
  "technologies": ["React", "Node.js", "MongoDB"],
  "github_url": "https://github.com/user/project",
  "live_url": "https://project.example.com",
  "is_featured": false,
  "start_date": "2024-01-01",
  "end_date": "2024-03-01"
}
```

### Update Project (Admin)

**Endpoint:** `PUT /projects.php?id=1`

**Authentication Required:** Yes

### Delete Project (Admin)

**Endpoint:** `DELETE /projects.php?id=1`

**Authentication Required:** Yes

## Skills

### Get Skills

Retrieve all skills grouped by category.

**Endpoint:** `GET /skills.php`

**Response:**
```json
{
  "success": true,
  "data": {
    "Programming Languages": [
      {
        "id": 1,
        "name": "PHP",
        "proficiency_level": 5,
        "icon_path": "/assets/icons/tech/php.svg"
      },
      {
        "id": 2,
        "name": "JavaScript",
        "proficiency_level": 4,
        "icon_path": "/assets/icons/tech/javascript.svg"
      }
    ],
    "Frameworks": [
      {
        "id": 3,
        "name": "Laravel",
        "proficiency_level": 4,
        "icon_path": "/assets/icons/tech/laravel.svg"
      }
    ]
  }
}
```

### Add Skill (Admin)

**Endpoint:** `POST /skills.php`

**Authentication Required:** Yes

**Request:**
```json
{
  "name": "Vue.js",
  "category": "Frameworks",
  "proficiency_level": 4
}
```

## Experience

### Get Experience

Retrieve work experience entries.

**Endpoint:** `GET /experience.php`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Senior Full Stack Developer",
      "company": "Tech Solutions Inc.",
      "company_url": "https://techsolutions.com",
      "location": "San Francisco, CA",
      "description": "Led development of enterprise web applications",
      "responsibilities": [
        "Developed and maintained web applications",
        "Led a team of 3 developers",
        "Implemented CI/CD pipelines"
      ],
      "achievements": [
        "Reduced page load time by 40%",
        "Increased test coverage to 95%"
      ],
      "start_date": "2022-01-01",
      "end_date": null,
      "is_current": true
    }
  ]
}
```

## Contact Submissions (Admin)

### Get Contact Submissions

**Endpoint:** `GET /admin/contact-submissions.php`

**Authentication Required:** Yes

**Query Parameters:**
- `status`: Filter by status (`new`, `read`, `replied`, `archived`)
- `limit`: Number of submissions to return (default: 50)
- `offset`: Offset for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "subject": "Project Inquiry",
      "message": "I'm interested in your services",
      "status": "new",
      "ip_address": "192.168.1.1",
      "created_at": "2024-01-01 14:30:00"
    }
  ],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

### Update Contact Submission Status

**Endpoint:** `PUT /admin/contact-submissions.php?id=1`

**Authentication Required:** Yes

**Request:**
```json
{
  "status": "read"
}
```

## File Upload

### Upload File (Admin)

**Endpoint:** `POST /upload.php`

**Authentication Required:** Yes

**Request:** Form data with file upload

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "id": 123,
    "filename": "project-image.jpg",
    "path": "/assets/uploads/projects/project-image.jpg",
    "size": 245760,
    "mime_type": "image/jpeg"
  }
}
```

**Allowed File Types:**
- Images: JPG, JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX
- Maximum size: 10MB (development), 5MB (production)

## Analytics (Admin)

### Get Dashboard Statistics

**Endpoint:** `GET /admin/analytics.php`

**Authentication Required:** Yes

**Response:**
```json
{
  "success": true,
  "data": {
    "contact_submissions": {
      "total": 156,
      "this_month": 23,
      "pending": 8
    },
    "testimonials": {
      "total": 45,
      "featured": 6
    },
    "projects": {
      "total": 12,
      "featured": 4
    },
    "performance": {
      "avg_response_time": 0.245,
      "uptime_percentage": 99.8
    }
  }
}
```

## Error Handling

All API endpoints use standardized error responses:

### Error Response Format

```json
{
  "success": false,
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "Specific validation error"
  }
}
```

### Common Error Codes

- `validation_error` - Input validation failed
- `authentication_required` - Authentication required
- `authentication_failed` - Invalid credentials
- `authorization_failed` - Insufficient permissions
- `not_found` - Resource not found
- `rate_limit_exceeded` - Rate limit exceeded
- `server_error` - Internal server error

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

API endpoints have the following rate limits:

### Public Endpoints
- Contact form: 5 submissions per hour per IP
- General API: 100 requests per hour per IP

### Authenticated Endpoints
- Admin operations: 1000 requests per hour

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1640995200
```

## Webhooks

### Contact Form Webhook

Configure webhook URL to receive contact form notifications:

**Payload:**
```json
{
  "event": "contact_form_submitted",
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Project Inquiry",
    "message": "...",
    "timestamp": "2024-01-01T14:30:00Z"
  }
}
```

## SDKs and Libraries

### JavaScript SDK

```javascript
// Portfolio API Client
class PortfolioAPI {
  constructor(baseUrl, apiKey = null) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    return response.json();
  }

  // Contact form
  async submitContact(data) {
    return this.request('/contact.php', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Testimonials
  async getTestimonials(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/testimonials.php?${query}`);
  }

  // Projects
  async getProjects(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/projects.php?${query}`);
  }
}

// Usage
const api = new PortfolioAPI('http://localhost:8000/src/api');
const testimonials = await api.getTestimonials({ featured: true });
```

## Testing

### API Testing

Use the provided test suite to validate API functionality:

```bash
# Run API tests
composer run test:api

# Test specific endpoint
./vendor/bin/phpunit tests/Api/ContactTest.php
```

### Manual Testing

Use tools like Postman or curl to test endpoints:

```bash
# Test contact form
curl -X POST http://localhost:8000/src/api/contact.php \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Message",
    "message": "This is a test message"
  }'

# Test authentication
curl -X POST http://localhost:8000/src/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password"
  }'
```

---

## Support

For API support:
1. Check error messages and status codes
2. Review rate limiting headers
3. Validate request format
4. Check authentication status
5. Contact development team
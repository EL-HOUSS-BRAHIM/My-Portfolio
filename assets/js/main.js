/**
 * Portfolio Application Main Script
 * 
 * Modular JavaScript application for the portfolio website
 * with improved error handling and organization.
 */

class PortfolioApp {
    constructor() {
        this.config = {
            apiBaseUrl: '/src/api',
            animationDelay: 100,
            testimonialAutoSlideInterval: 8000
        };
        
        this.modules = {};
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initModules();
            this.setupGlobalEventListeners();
        });
    }
    
    initModules() {
        // Initialize all modules
        this.modules.animations = new AnimationController();
        this.modules.contact = new ContactForm(this.config.apiBaseUrl);
        this.modules.testimonials = new TestimonialSlider(this.config.apiBaseUrl, this.config.testimonialAutoSlideInterval);
        this.modules.navigation = new NavigationController();
    }
    
    setupGlobalEventListeners() {
        // Global error handling
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });
    }
}

/**
 * Animation Controller
 * Handles scroll animations and transitions
 */
class AnimationController {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupScrollAnimations();
        this.setupEducationAnimations();
    }
    
    setupScrollAnimations() {
        const animateOnScroll = document.querySelectorAll('.animate-on-scroll');
        
        if (animateOnScroll.length === 0) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        animateOnScroll.forEach(item => {
            observer.observe(item);
        });
    }
    
    setupEducationAnimations() {
        const educationItems = document.querySelectorAll('.education-item');
        
        educationItems.forEach((item, index) => {
            item.style.setProperty('--item-index', index);
        });
    }
}

/**
 * Contact Form Handler
 * Manages contact form submission and validation
 */
class ContactForm {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.form = document.getElementById('contactForm');
        this.responseMessage = document.getElementById('responseMessage');
        this.init();
    }
    
    init() {
        if (!this.form) return;
        
        this.form.addEventListener('submit', (event) => {
            this.handleSubmit(event);
        });
        
        // Add real-time validation
        this.setupValidation();
    }
    
    setupValidation() {
        const inputs = this.form.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    }
    
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';
        
        // Remove existing error
        this.clearFieldError(field);
        
        // Validation rules
        switch (fieldName) {
            case 'name':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Name is required';
                } else if (value.length > 100) {
                    isValid = false;
                    errorMessage = 'Name must be less than 100 characters';
                }
                break;
                
            case 'email':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Email is required';
                } else if (!this.isValidEmail(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;
                
            case 'message':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Message is required';
                } else if (value.length < 10) {
                    isValid = false;
                    errorMessage = 'Message must be at least 10 characters long';
                } else if (value.length > 2000) {
                    isValid = false;
                    errorMessage = 'Message must be less than 2000 characters';
                }
                break;
        }
        
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }
        
        return isValid;
    }
    
    showFieldError(field, message) {
        field.classList.add('error');
        
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }
    
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    async handleSubmit(event) {
        event.preventDefault();
        
        // Validate all fields
        const inputs = this.form.querySelectorAll('input, textarea');
        let isFormValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });
        
        if (!isFormValid) {
            this.showMessage('Please fix the errors above', 'error');
            return;
        }
        
        // Show loading state
        const submitButton = this.form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
        
        try {
            const formData = new FormData(this.form);
            
            const response = await fetch(`${this.apiBaseUrl}/contact.php`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage(data.message, 'success');
                this.form.reset();
            } else {
                this.showMessage(data.message || 'Failed to send message', 'error');
                
                // Show field-specific errors if available
                if (data.errors) {
                    Object.keys(data.errors).forEach(fieldName => {
                        const field = this.form.querySelector(`[name="${fieldName}"]`);
                        if (field) {
                            this.showFieldError(field, data.errors[fieldName]);
                        }
                    });
                }
            }
            
        } catch (error) {
            console.error('Contact form error:', error);
            this.showMessage('An unexpected error occurred. Please try again later.', 'error');
        } finally {
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }
    
    showMessage(message, type) {
        if (!this.responseMessage) return;
        
        this.responseMessage.textContent = message;
        this.responseMessage.className = `response-message ${type}`;
        this.responseMessage.style.display = 'block';
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                this.responseMessage.style.display = 'none';
            }, 5000);
        }
    }
}

// Initialize the application
const app = new PortfolioApp();

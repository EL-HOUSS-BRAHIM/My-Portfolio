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
        // Contact form logic is now handled in portfolio.js
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

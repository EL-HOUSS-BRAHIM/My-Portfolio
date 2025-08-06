/**
 * Portfolio Application - Main Entry Point
 * 
 * Modern, clean, and efficient portfolio application with modular architecture.
 * This is the main application controller that initializes all modules.
 * 
 * @author Brahim El Houss
 * @version 2.0.0
 */

class PortfolioApp {
    constructor() {
        this.config = {
            apiBaseUrl: './src/api',
            animationDelay: 100,
            testimonialAutoSlideInterval: 8000,
            debounceDelay: 250,
            throttleDelay: 16 // ~60fps
        };
        
        this.modules = new Map();
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            document.addEventListener('DOMContentLoaded', () => this.onDOMContentLoaded());
            console.debug('[PortfolioApp] Application initialized');
        } catch (error) {
            console.error('[PortfolioApp] Initialization failed:', error);
        }
    }

    /**
     * Handle DOM content loaded event
     */
    async onDOMContentLoaded() {
        try {
            await this.initModules();
            this.setupGlobalEventListeners();
            this.isInitialized = true;
            console.debug('[PortfolioApp] DOM loaded - All modules initialized');
        } catch (error) {
            console.error('[PortfolioApp] DOM initialization failed:', error);
        }
    }

    /**
     * Initialize all application modules
     */
    async initModules() {
        const modulePromises = [
            this.initModule('navigation', () => new NavigationController()),
            this.initModule('theme', () => new ThemeController()),
            this.initModule('hero', () => new HeroController()),
            this.initModule('animations', () => new AnimationController()),
            this.initModule('projects', () => new ProjectController()),
            this.initModule('contact', () => new ContactController(this.config.apiBaseUrl)),
            this.initModule('testimonials', () => new TestimonialController(this.config.apiBaseUrl, this.config.testimonialAutoSlideInterval)),
            this.initModule('mobile', () => new MobileController())
        ];

        await Promise.allSettled(modulePromises);
    }

    /**
     * Initialize a single module with error handling
     */
    async initModule(name, factory) {
        try {
            const module = factory();
            this.modules.set(name, module);
            console.debug(`[PortfolioApp] Module '${name}' initialized`);
        } catch (error) {
            console.error(`[PortfolioApp] Failed to initialize module '${name}':`, error);
        }
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Global error handling
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        
        // Window events
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), this.config.debounceDelay));
        window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), this.config.throttleDelay));
        
        // Page visibility
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Load event
        window.addEventListener('load', this.handleWindowLoad.bind(this));
    }

    /**
     * Handle global errors
     */
    handleGlobalError(event) {
        console.error('[PortfolioApp] Global error:', event.error);
        // Could send to error tracking service
    }

    /**
     * Handle unhandled promise rejections
     */
    handleUnhandledRejection(event) {
        console.error('[PortfolioApp] Unhandled promise rejection:', event.reason);
        event.preventDefault();
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.modules.forEach((module, name) => {
            if (typeof module.handleResize === 'function') {
                try {
                    module.handleResize();
                } catch (error) {
                    console.error(`[PortfolioApp] Resize handler failed for ${name}:`, error);
                }
            }
        });
    }

    /**
     * Handle window scroll
     */
    handleScroll() {
        this.modules.forEach((module, name) => {
            if (typeof module.handleScroll === 'function') {
                try {
                    module.handleScroll();
                } catch (error) {
                    console.error(`[PortfolioApp] Scroll handler failed for ${name}:`, error);
                }
            }
        });
    }

    /**
     * Handle page visibility change
     */
    handleVisibilityChange() {
        const isVisible = !document.hidden;
        this.modules.forEach((module, name) => {
            if (typeof module.handleVisibilityChange === 'function') {
                try {
                    module.handleVisibilityChange(isVisible);
                } catch (error) {
                    console.error(`[PortfolioApp] Visibility handler failed for ${name}:`, error);
                }
            }
        });
    }

    /**
     * Handle window load
     */
    handleWindowLoad() {
        // Remove loading screen
        const loader = document.querySelector('.loading-screen');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }
        
        document.body.classList.add('loaded');
        console.debug('[PortfolioApp] Window loaded - Loading screen removed');
    }

    /**
     * Utility: Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Utility: Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Get module by name
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * Check if application is initialized
     */
    isReady() {
        return this.isInitialized;
    }
}

// Initialize the application
window.portfolioApp = new PortfolioApp();

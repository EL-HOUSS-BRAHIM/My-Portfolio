/**
 * Enhanced Portfolio Application
 * 
 * Modern, accessible, and performance-optimized JavaScript for the portfolio website.
 * Features: Error boundaries, performance monitoring, accessibility improvements,
 * and better user experience enhancements.
 */

class EnhancedPortfolioApp {
    constructor() {
        this.config = {
            apiBaseUrl: '/src/api',
            animationDelay: 100,
            testimonialAutoSlideInterval: 8000,
            debounceDelay: 300,
            retryAttempts: 3,
            retryDelay: 1000
        };
        
        this.modules = new Map();
        this.performance = new PerformanceMonitor();
        this.accessibility = new AccessibilityManager();
        this.errorHandler = new ErrorHandler();
        this.cache = new SimpleCache();
        
        this.init();
    }
    
    async init() {
        try {
            console.debug('[PortfolioApp] Initializing enhanced portfolio application...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                await this.initializeApp();
            }
            
        } catch (error) {
            this.errorHandler.handleError(error, 'Failed to initialize portfolio application');
        }
    }
    
    async initializeApp() {
        try {
            this.performance.mark('app-init-start');
            
            // Initialize error handling first
            this.setupGlobalErrorHandling();
            
            // Check for browser support
            if (!this.checkBrowserSupport()) {
                this.showBrowserUnsupportedMessage();
                return;
            }
            
            // Initialize core modules
            await this.initializeModules();
            
            // Setup event listeners
            this.setupGlobalEventListeners();
            
            // Initialize accessibility features
            this.accessibility.init();
            
            // Setup performance monitoring
            this.performance.init();
            
            // Initialize lazy loading
            this.initializeLazyLoading();
            
            // Setup service worker for caching (if supported)
            this.registerServiceWorker();
            
            this.performance.mark('app-init-end');
            this.performance.measure('app-initialization', 'app-init-start', 'app-init-end');
            
            console.debug('[PortfolioApp] Application initialized successfully');
            
        } catch (error) {
            this.errorHandler.handleError(error, 'Failed to initialize application modules');
        }
    }
    
    checkBrowserSupport() {
        const required = [
            'Promise',
            'fetch',
            'IntersectionObserver',
            'localStorage',
            'addEventListener'
        ];
        
        for (const feature of required) {
            if (!(feature in window)) {
                console.warn(`[PortfolioApp] Missing required feature: ${feature}`);
                return false;
            }
        }
        
        return true;
    }
    
    showBrowserUnsupportedMessage() {
        const message = document.createElement('div');
        message.className = 'browser-unsupported';
        message.innerHTML = `
            <div class="browser-unsupported__content">
                <h2>Browser Not Supported</h2>
                <p>Your browser doesn't support all the features required for this website.</p>
                <p>Please update your browser or try a modern browser like Chrome, Firefox, or Safari.</p>
            </div>
        `;
        document.body.insertBefore(message, document.body.firstChild);
    }
    
    async initializeModules() {
        const moduleInitializers = [
            { name: 'navigation', init: () => new NavigationManager(this.config) },
            { name: 'theme', init: () => new ThemeManager(this.config) },
            { name: 'animations', init: () => new AnimationManager(this.config) },
            { name: 'skills', init: () => new SkillsManager(this.config) },
            { name: 'projects', init: () => new ProjectsManager(this.config) },
            { name: 'contact', init: () => new ContactManager(this.config) },
            { name: 'testimonials', init: () => new TestimonialsManager(this.config) },
            { name: 'typewriter', init: () => new TypewriterManager(this.config) },
            { name: 'parallax', init: () => new ParallaxManager(this.config) },
            { name: 'mobile', init: () => new MobileManager(this.config) }
        ];
        
        for (const module of moduleInitializers) {
            try {
                this.performance.mark(`${module.name}-init-start`);
                this.modules.set(module.name, await module.init());
                this.performance.mark(`${module.name}-init-end`);
                this.performance.measure(`${module.name}-initialization`, `${module.name}-init-start`, `${module.name}-init-end`);
                
                console.debug(`[PortfolioApp] Module initialized: ${module.name}`);
            } catch (error) {
                this.errorHandler.handleError(error, `Failed to initialize ${module.name} module`);
            }
        }
    }
    
    setupGlobalErrorHandling() {
        // Global JavaScript errors
        window.addEventListener('error', (event) => {
            this.errorHandler.handleError(event.error, 'Global JavaScript error', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.errorHandler.handleError(event.reason, 'Unhandled promise rejection');
            event.preventDefault();
        });
        
        // Network errors
        window.addEventListener('online', () => {
            console.info('[PortfolioApp] Network connection restored');
            this.showNotification('Connection restored', 'success');
        });
        
        window.addEventListener('offline', () => {
            console.warn('[PortfolioApp] Network connection lost');
            this.showNotification('You are offline. Some features may not work.', 'warning');
        });
    }
    
    setupGlobalEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
        
        // Focus management
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
        document.addEventListener('focusout', this.handleFocusOut.bind(this));
        
        // Window events
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), this.config.debounceDelay));
        window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), 16)); // ~60fps
        
        // Page visibility
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    
    handleKeyboardNavigation(event) {
        // Skip navigation for form inputs
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
            return;
        }
        
        switch (event.key) {
            case 'Escape':
                this.closeModals();
                break;
            case 'Tab':
                this.accessibility.handleTabNavigation(event);
                break;
            case 'ArrowLeft':
            case 'ArrowRight':
                if (this.modules.has('testimonials')) {
                    this.modules.get('testimonials').handleKeyboardNavigation(event);
                }
                break;
        }
    }
    
    handleFocusIn(event) {
        this.accessibility.updateFocusIndicator(event.target);
    }
    
    handleFocusOut(event) {
        this.accessibility.clearFocusIndicator();
    }
    
    handleResize() {
        this.modules.forEach((module, name) => {
            if (typeof module.handleResize === 'function') {
                try {
                    module.handleResize();
                } catch (error) {
                    this.errorHandler.handleError(error, `Resize handler failed for ${name} module`);
                }
            }
        });
    }
    
    handleScroll() {
        this.modules.forEach((module, name) => {
            if (typeof module.handleScroll === 'function') {
                try {
                    module.handleScroll();
                } catch (error) {
                    this.errorHandler.handleError(error, `Scroll handler failed for ${name} module`);
                }
            }
        });
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden - pause animations, stop auto-sliders
            this.modules.forEach(module => {
                if (typeof module.pause === 'function') {
                    module.pause();
                }
            });
        } else {
            // Page is visible - resume animations, start auto-sliders
            this.modules.forEach(module => {
                if (typeof module.resume === 'function') {
                    module.resume();
                }
            });
        }
    }
    
    closeModals() {
        // Close any open modals/overlays
        document.querySelectorAll('.modal.is-open, .overlay.is-open').forEach(modal => {
            modal.classList.remove('is-open');
        });
        
        // Trigger custom close events
        document.dispatchEvent(new CustomEvent('modal:close-all'));
    }
    
    initializeLazyLoading() {
        if ('IntersectionObserver' in window) {
            const lazyImages = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                        
                        console.debug('[PortfolioApp] Image lazy-loaded:', img.src);
                    }
                });
            }, { threshold: 0.1 });
            
            lazyImages.forEach(img => imageObserver.observe(img));
        }
    }
    
    registerServiceWorker() {
        if ('serviceWorker' in navigator && location.protocol === 'https:') {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.debug('[PortfolioApp] Service worker registered:', registration);
                })
                .catch(error => {
                    console.warn('[PortfolioApp] Service worker registration failed:', error);
                });
        }
    }
    
    // Utility methods
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
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // Enhanced notification system
    showNotification(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        const icon = this.getNotificationIcon(type);
        notification.innerHTML = `
            <div class="notification__content">
                <span class="notification__icon">${icon}</span>
                <span class="notification__message">${message}</span>
                <button class="notification__close" aria-label="Close notification">&times;</button>
            </div>
        `;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            maxWidth: '400px',
            animation: 'slideInRight 0.3s ease-out',
            backgroundColor: this.getNotificationColor(type),
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        });
        
        // Add close handler
        const closeBtn = notification.querySelector('.notification__close');
        closeBtn.addEventListener('click', () => this.removeNotification(notification));
        
        document.body.appendChild(notification);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => this.removeNotification(notification), duration);
        }
        
        console.debug(`[PortfolioApp] Notification shown: ${message} (${type})`);
        
        return notification;
    }
    
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
    
    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }
    
    // Public API methods
    getModule(name) {
        return this.modules.get(name);
    }
    
    getPerformanceData() {
        return this.performance.getMetrics();
    }
    
    getAccessibilityStatus() {
        return this.accessibility.getStatus();
    }
    
    getErrorLog() {
        return this.errorHandler.getLog();
    }
}

/**
 * Performance Monitor
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = [];
    }
    
    init() {
        if ('PerformanceObserver' in window) {
            this.observeNavigationTiming();
            this.observeResourceTiming();
            this.observeLongTasks();
        }
    }
    
    mark(name) {
        if ('performance' in window && 'mark' in performance) {
            performance.mark(name);
        }
    }
    
    measure(name, startMark, endMark) {
        if ('performance' in window && 'measure' in performance) {
            try {
                performance.measure(name, startMark, endMark);
                const measure = performance.getEntriesByName(name)[0];
                this.metrics.set(name, measure.duration);
            } catch (error) {
                console.warn('[PerformanceMonitor] Failed to measure:', error);
            }
        }
    }
    
    observeNavigationTiming() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                this.metrics.set('navigation', {
                    domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                    loadComplete: entry.loadEventEnd - entry.loadEventStart,
                    ttfb: entry.responseStart - entry.requestStart
                });
            });
        });
        
        observer.observe({ entryTypes: ['navigation'] });
        this.observers.push(observer);
    }
    
    observeResourceTiming() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.initiatorType === 'img' && entry.duration > 1000) {
                    console.warn('[PerformanceMonitor] Slow image load:', entry.name, entry.duration + 'ms');
                }
            });
        });
        
        observer.observe({ entryTypes: ['resource'] });
        this.observers.push(observer);
    }
    
    observeLongTasks() {
        if ('PerformanceLongTaskTiming' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    console.warn('[PerformanceMonitor] Long task detected:', entry.duration + 'ms');
                    this.metrics.set('longTasks', (this.metrics.get('longTasks') || 0) + 1);
                });
            });
            
            observer.observe({ entryTypes: ['longtask'] });
            this.observers.push(observer);
        }
    }
    
    getMetrics() {
        return Object.fromEntries(this.metrics);
    }
    
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
    }
}

/**
 * Accessibility Manager
 */
class AccessibilityManager {
    constructor() {
        this.focusOutlineEnabled = true;
        this.highContrast = false;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    init() {
        this.setupFocusManagement();
        this.setupMediaQueryListeners();
        this.setupSkipLinks();
        this.announcePageLoad();
    }
    
    setupFocusManagement() {
        // Show focus outline only for keyboard navigation
        document.addEventListener('mousedown', () => {
            this.focusOutlineEnabled = false;
            document.body.classList.add('mouse-navigation');
        });
        
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                this.focusOutlineEnabled = true;
                document.body.classList.remove('mouse-navigation');
            }
        });
    }
    
    setupMediaQueryListeners() {
        // Listen for reduced motion preference changes
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        motionQuery.addListener((e) => {
            this.reducedMotion = e.matches;
            document.body.classList.toggle('reduced-motion', e.matches);
        });
        
        // Listen for high contrast preference
        const contrastQuery = window.matchMedia('(prefers-contrast: high)');
        contrastQuery.addListener((e) => {
            this.highContrast = e.matches;
            document.body.classList.toggle('high-contrast', e.matches);
        });
    }
    
    setupSkipLinks() {
        const skipLink = document.querySelector('.skip-link');
        if (!skipLink) {
            const link = document.createElement('a');
            link.className = 'skip-link';
            link.href = '#main';
            link.textContent = 'Skip to main content';
            link.style.cssText = `
                position: absolute;
                top: -40px;
                left: 6px;
                background: #000;
                color: #fff;
                padding: 8px;
                text-decoration: none;
                z-index: 10000;
                transition: top 0.3s;
            `;
            
            link.addEventListener('focus', () => {
                link.style.top = '6px';
            });
            
            link.addEventListener('blur', () => {
                link.style.top = '-40px';
            });
            
            document.body.insertBefore(link, document.body.firstChild);
        }
    }
    
    announcePageLoad() {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = 'Page loaded successfully';
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            announcement.remove();
        }, 1000);
    }
    
    handleTabNavigation(event) {
        // Trap focus in modals
        const modal = document.querySelector('.modal.is-open');
        if (modal) {
            this.trapFocus(modal, event);
        }
    }
    
    trapFocus(container, event) {
        const focusableElements = container.querySelectorAll(
            'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }
    
    updateFocusIndicator(element) {
        if (!this.focusOutlineEnabled) return;
        
        element.classList.add('focused');
    }
    
    clearFocusIndicator() {
        document.querySelectorAll('.focused').forEach(el => {
            el.classList.remove('focused');
        });
    }
    
    getStatus() {
        return {
            focusOutlineEnabled: this.focusOutlineEnabled,
            highContrast: this.highContrast,
            reducedMotion: this.reducedMotion
        };
    }
}

/**
 * Error Handler
 */
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
    }
    
    handleError(error, context = '', metadata = {}) {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            message: error.message || error,
            context,
            metadata,
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.logError(errorInfo);
        this.reportError(errorInfo);
        
        // Show user-friendly message for critical errors
        if (this.isCriticalError(error)) {
            this.showUserErrorMessage();
        }
    }
    
    logError(errorInfo) {
        console.error('[ErrorHandler]', errorInfo);
        
        this.errorLog.push(errorInfo);
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }
    }
    
    reportError(errorInfo) {
        // In production, send errors to monitoring service
        if (location.hostname !== 'localhost' && navigator.onLine) {
            fetch('/api/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorInfo)
            }).catch(() => {
                // Silently fail if error reporting fails
            });
        }
    }
    
    isCriticalError(error) {
        const criticalPatterns = [
            'Cannot read property',
            'is not a function',
            'Unexpected token',
            'ReferenceError',
            'TypeError'
        ];
        
        const message = error.message || error;
        return criticalPatterns.some(pattern => message.includes(pattern));
    }
    
    showUserErrorMessage() {
        const message = document.createElement('div');
        message.className = 'error-message';
        message.innerHTML = `
            <div class="error-message__content">
                <h3>Oops! Something went wrong</h3>
                <p>We've encountered an unexpected error. Please refresh the page or try again later.</p>
                <button onclick="location.reload()">Refresh Page</button>
            </div>
        `;
        
        Object.assign(message.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            zIndex: '10000',
            maxWidth: '400px',
            textAlign: 'center'
        });
        
        document.body.appendChild(message);
    }
    
    getLog() {
        return [...this.errorLog];
    }
}

/**
 * Simple Cache
 */
class SimpleCache {
    constructor(maxSize = 50) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    
    set(key, value, ttl = 300000) { // 5 minutes default
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            value,
            expires: Date.now() + ttl
        });
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    has(key) {
        return this.get(key) !== null;
    }
    
    delete(key) {
        return this.cache.delete(key);
    }
    
    clear() {
        this.cache.clear();
    }
}

// Initialize the enhanced application
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioApp = new EnhancedPortfolioApp();
    console.debug('[PortfolioApp] Enhanced portfolio application started');
});

// Add CSS for enhanced features
const enhancedStyles = `
    .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
    }
    
    .mouse-navigation *:focus {
        outline: none !important;
    }
    
    .focused {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
    }
    
    .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
    
    .high-contrast {
        filter: contrast(150%);
    }
    
    .notification {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .notification__content {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .notification__close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        margin-left: auto;
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .browser-unsupported {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .browser-unsupported__content {
        text-align: center;
        max-width: 500px;
        padding: 40px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
`;

// Inject enhanced styles
const styleSheet = document.createElement('style');
styleSheet.textContent = enhancedStyles;
document.head.appendChild(styleSheet);

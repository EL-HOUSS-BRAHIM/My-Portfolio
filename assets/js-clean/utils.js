/**
 * Utilities
 * 
 * Common utility functions and helpers used across the portfolio application.
 * 
 * @author Brahim El Houss
 */

class Utils {
    /**
     * Debounce function - limits function calls
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * Throttle function - limits function execution frequency
     */
    static throttle(func, limit) {
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
     * Get element by selector with error handling
     */
    static getElement(selector, context = document) {
        try {
            return context.querySelector(selector);
        } catch (error) {
            console.warn(`[Utils] Invalid selector: ${selector}`);
            return null;
        }
    }

    /**
     * Get elements by selector with error handling
     */
    static getElements(selector, context = document) {
        try {
            return Array.from(context.querySelectorAll(selector));
        } catch (error) {
            console.warn(`[Utils] Invalid selector: ${selector}`);
            return [];
        }
    }

    /**
     * Check if element is in viewport
     */
    static isInViewport(element, threshold = 0) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.top >= -threshold &&
            rect.left >= -threshold &&
            rect.bottom <= windowHeight + threshold &&
            rect.right <= windowWidth + threshold
        );
    }

    /**
     * Smooth scroll to element
     */
    static scrollToElement(element, offset = 0, behavior = 'smooth') {
        if (!element) return;
        
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: behavior
        });
    }

    /**
     * Format date for display
     */
    static formatDate(dateString, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
        } catch (error) {
            console.warn(`[Utils] Invalid date: ${dateString}`);
            return dateString;
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    static escapeHtml(text) {
        if (typeof text !== 'string') return text;
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Generate unique ID
     */
    static generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Check if device is mobile
     */
    static isMobile() {
        return window.innerWidth < 768;
    }

    /**
     * Check if device is tablet
     */
    static isTablet() {
        return window.innerWidth >= 768 && window.innerWidth < 1024;
    }

    /**
     * Check if device is desktop
     */
    static isDesktop() {
        return window.innerWidth >= 1024;
    }

    /**
     * Check if device supports touch
     */
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    /**
     * Check if browser supports feature
     */
    static supportsFeature(feature) {
        const features = {
            localStorage: () => {
                try {
                    const test = 'test';
                    localStorage.setItem(test, test);
                    localStorage.removeItem(test);
                    return true;
                } catch (e) {
                    return false;
                }
            },
            sessionStorage: () => {
                try {
                    const test = 'test';
                    sessionStorage.setItem(test, test);
                    sessionStorage.removeItem(test);
                    return true;
                } catch (e) {
                    return false;
                }
            },
            intersectionObserver: () => 'IntersectionObserver' in window,
            fetch: () => 'fetch' in window,
            promises: () => 'Promise' in window,
            webp: () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
            }
        };
        
        return features[feature] ? features[feature]() : false;
    }

    /**
     * Get URL parameters
     */
    static getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        
        for (let [key, value] of params) {
            result[key] = value;
        }
        
        return result;
    }

    /**
     * Set URL parameter without page reload
     */
    static setUrlParam(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.replaceState({}, '', url);
    }

    /**
     * Remove URL parameter without page reload
     */
    static removeUrlParam(key) {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.replaceState({}, '', url);
    }

    /**
     * Copy text to clipboard
     */
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const result = document.execCommand('copy');
                textArea.remove();
                return result;
            }
        } catch (error) {
            console.error('[Utils] Copy to clipboard failed:', error);
            return false;
        }
    }

    /**
     * Validate email address
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Sanitize string for use as CSS class or ID
     */
    static sanitizeForCSS(str) {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Get random number between min and max
     */
    static randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Get random item from array
     */
    static randomFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Shuffle array
     */
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Deep merge objects
     */
    static deepMerge(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();

        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }

        return this.deepMerge(target, ...sources);
    }

    /**
     * Check if value is object
     */
    static isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    /**
     * Wait for specified time
     */
    static wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retry function with exponential backoff
     */
    static async retry(fn, maxAttempts = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) {
                    throw error;
                }
                await this.wait(delay * Math.pow(2, attempt - 1));
            }
        }
    }

    /**
     * Get performance metrics
     */
    static getPerformanceMetrics() {
        if (!('performance' in window)) return null;
        
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
            domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
            loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
            firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime,
            firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime,
            memoryUsage: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }

    /**
     * Log performance metrics
     */
    static logPerformance() {
        const metrics = this.getPerformanceMetrics();
        if (metrics) {
            console.group('[Utils] Performance Metrics');
            console.log('DOM Content Loaded:', metrics.domContentLoaded + 'ms');
            console.log('Load Complete:', metrics.loadComplete + 'ms');
            console.log('First Paint:', metrics.firstPaint + 'ms');
            console.log('First Contentful Paint:', metrics.firstContentfulPaint + 'ms');
            if (metrics.memoryUsage) {
                console.log('Memory Usage:', 
                    Math.round(metrics.memoryUsage.used / 1024 / 1024) + 'MB / ' +
                    Math.round(metrics.memoryUsage.total / 1024 / 1024) + 'MB'
                );
            }
            console.groupEnd();
        }
    }
}

// Export for use in other modules
window.Utils = Utils;

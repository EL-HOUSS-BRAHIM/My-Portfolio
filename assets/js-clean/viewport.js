/**
 * Viewport Handler
 * 
 * Handles viewport-related functionality including hero section sizing,
 * scroll indicators, and responsive adjustments.
 * 
 * @author Brahim El Houss
 */

class ViewportHandler {
    constructor() {
        this.hero = document.querySelector('.hero');
        this.scrollIndicator = document.querySelector('.scroll-indicator');
        this.aboutSection = document.getElementById('about');
        this.header = document.querySelector('header');
        this.progressBar = null;
        
        this.init();
    }

    /**
     * Initialize viewport functionality
     */
    init() {
        this.setupHeroSizing();
        this.setupScrollIndicator();
        this.setupScrollProgress();
        this.setupEventListeners();
        
        console.debug('[ViewportHandler] Initialized');
    }

    /**
     * Setup hero section sizing
     */
    setupHeroSizing() {
        if (!this.hero) return;
        
        this.adjustViewportHeight();
        
        // Ensure about section positioning
        if (this.aboutSection) {
            this.aboutSection.style.marginTop = '0';
        }
    }

    /**
     * Setup scroll indicator functionality
     */
    setupScrollIndicator() {
        if (!this.scrollIndicator || !this.aboutSection) return;
        
        this.scrollIndicator.addEventListener('click', () => {
            this.aboutSection.scrollIntoView({ behavior: 'smooth' });
        });
        
        // Add keyboard support
        this.scrollIndicator.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.aboutSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        // Make it focusable
        this.scrollIndicator.setAttribute('tabindex', '0');
        this.scrollIndicator.setAttribute('role', 'button');
        this.scrollIndicator.setAttribute('aria-label', 'Scroll to about section');
    }

    /**
     * Setup scroll progress indicator
     */
    setupScrollProgress() {
        // Create progress bar
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'scroll-progress';
        
        // Add styles
        Object.assign(this.progressBar.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '0%',
            height: '3px',
            background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))',
            zIndex: '9999',
            transition: 'width 0.1s ease-out',
            transformOrigin: 'left'
        });
        
        document.body.appendChild(this.progressBar);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Scroll events
        window.addEventListener('scroll', () => this.handleScroll());
        
        // Orientation change (mobile)
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.adjustViewportHeight(), 200);
        });
    }

    /**
     * Adjust viewport height
     */
    adjustViewportHeight() {
        if (!this.hero || !this.header) return;
        
        const viewportHeight = window.innerHeight;
        const headerHeight = this.header.offsetHeight;
        const heroHeight = viewportHeight - headerHeight;
        
        // Set hero height
        this.hero.style.height = `${heroHeight}px`;
        this.hero.style.minHeight = `${heroHeight}px`;
        
        // Add CSS custom property for other elements to use
        document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
        document.documentElement.style.setProperty('--hero-height', `${heroHeight}px`);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.adjustViewportHeight();
    }

    /**
     * Handle window scroll
     */
    handleScroll() {
        const scrollPosition = window.scrollY;
        
        // Update scroll indicator opacity
        this.updateScrollIndicator(scrollPosition);
        
        // Update scroll progress
        this.updateScrollProgress();
    }

    /**
     * Update scroll indicator visibility
     */
    updateScrollIndicator(scrollPosition) {
        if (!this.scrollIndicator) return;
        
        let opacity = 1;
        
        if (scrollPosition > 50) {
            opacity = Math.max(0, 1 - (scrollPosition - 50) / 150);
        }
        
        this.scrollIndicator.style.opacity = opacity;
        
        // Hide completely when very far down
        if (scrollPosition > 300) {
            this.scrollIndicator.style.pointerEvents = 'none';
        } else {
            this.scrollIndicator.style.pointerEvents = 'auto';
        }
    }

    /**
     * Update scroll progress bar
     */
    updateScrollProgress() {
        if (!this.progressBar) return;
        
        const scrollPosition = window.scrollY;
        const totalHeight = document.body.scrollHeight - window.innerHeight;
        const progress = Math.min((scrollPosition / totalHeight) * 100, 100);
        
        this.progressBar.style.width = `${progress}%`;
        
        // Add glow effect when fully scrolled
        if (progress >= 99) {
            this.progressBar.style.boxShadow = '0 0 10px var(--primary-color)';
        } else {
            this.progressBar.style.boxShadow = 'none';
        }
    }

    /**
     * Get viewport info
     */
    getViewportInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollY: window.scrollY,
            scrollHeight: document.body.scrollHeight,
            isMobile: window.innerWidth < 768,
            isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
            isDesktop: window.innerWidth >= 1024
        };
    }

    /**
     * Check if element is in viewport
     */
    isInViewport(element, threshold = 0) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        
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
    scrollToElement(element, offset = 0) {
        if (!element) return;
        
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    /**
     * Handle page visibility change (called by main app)
     */
    handleVisibilityChange(isVisible) {
        if (isVisible) {
            // Recalculate viewport when page becomes visible
            setTimeout(() => this.adjustViewportHeight(), 100);
        }
    }

    /**
     * Add CSS for responsive viewport units
     */
    addResponsiveCSS() {
        if (document.querySelector('#viewport-styles')) return;
        
        const styles = `
            .scroll-progress {
                position: fixed;
                top: 0;
                left: 0;
                width: 0%;
                height: 3px;
                background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
                z-index: 9999;
                transition: width 0.1s ease-out;
                transform-origin: left;
            }
            
            @supports (height: 100dvh) {
                .hero {
                    height: 100dvh !important;
                    min-height: 100dvh !important;
                }
            }
            
            @supports (height: 100svh) {
                .hero {
                    height: 100svh !important;
                    min-height: 100svh !important;
                }
            }
            
            /* Mobile viewport fixes */
            @media (max-width: 767px) {
                .hero {
                    height: calc(100vh - var(--header-height, 80px)) !important;
                    min-height: calc(100vh - var(--header-height, 80px)) !important;
                }
            }
            
            /* Landscape mobile */
            @media (max-height: 500px) and (orientation: landscape) {
                .hero {
                    height: 100vh !important;
                    min-height: 100vh !important;
                }
                
                .scroll-indicator {
                    bottom: 10px;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'viewport-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    /**
     * Cleanup method
     */
    destroy() {
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('orientationchange', this.adjustViewportHeight);
        
        // Remove progress bar
        if (this.progressBar && this.progressBar.parentNode) {
            this.progressBar.parentNode.removeChild(this.progressBar);
        }
        
        // Remove styles
        const styles = document.getElementById('viewport-styles');
        if (styles) {
            styles.remove();
        }
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.viewportHandler = new ViewportHandler();
});

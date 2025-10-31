/**
 * Mobile Controller
 * 
 * Handles mobile navigation, responsive behavior, and touch interactions.
 * Includes accessibility features and smooth animations.
 * 
 * @author Brahim El Houss
 */

class MobileController {
    constructor() {
        this.navToggle = document.querySelector('.nav__toggle');
        this.navMenu = document.querySelector('.nav__menu');
        this.navLinks = document.querySelectorAll('.nav__link');
        this.body = document.body;
        this.isMenuOpen = false;
        this.breakpoint = 992; // Mobile breakpoint
        
        this.init();
    }

    /**
     * Initialize mobile functionality
     */
    init() {
        if (!this.navToggle || !this.navMenu) {
            console.warn('[MobileController] Navigation elements not found');
            return;
        }

        this.setupEventListeners();
        this.setupAccessibility();
        this.addToggleStyles();
        
        console.debug('[MobileController] Initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toggle navigation when burger is clicked
        this.navToggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleNavigation();
        });
        
        // Close navigation when a link is clicked
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (this.isMenuOpen) {
                    this.closeNavigation();
                }
            });
        });
        
        // Close navigation when clicking outside
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Handle escape key
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Handle touch events for better mobile UX
        this.setupTouchEvents();
    }

    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Set initial ARIA attributes
        this.updateAriaAttributes(false);
        
        // Add role and aria-label to toggle button
        this.navToggle.setAttribute('role', 'button');
        this.navToggle.setAttribute('aria-controls', 'nav-menu');
        
        // Add role to navigation menu
        this.navMenu.setAttribute('role', 'navigation');
        this.navMenu.id = 'nav-menu';
    }

    /**
     * Toggle the mobile navigation
     */
    toggleNavigation() {
        this.isMenuOpen = !this.isMenuOpen;
        
        // Toggle classes
        this.navMenu.classList.toggle('show-menu', this.isMenuOpen);
        this.body.classList.toggle('nav-open', this.isMenuOpen);
        
        // Create/remove overlay
        this.toggleOverlay(this.isMenuOpen);
        
        // Handle body scroll
        this.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
        
        // Update ARIA attributes
        this.updateAriaAttributes(this.isMenuOpen);
        
        // Announce to screen readers
        this.announceMenuState(this.isMenuOpen);
        
        // Focus management
        if (this.isMenuOpen) {
            this.trapFocus();
        } else {
            this.releaseFocus();
        }
        
        console.debug(`[MobileController] Navigation ${this.isMenuOpen ? 'opened' : 'closed'}`);
    }
    
    /**
     * Toggle mobile navigation overlay
     */
    toggleOverlay(show) {
        let overlay = document.querySelector('.mobile-nav-overlay');
        
        if (show && !overlay) {
            overlay = document.createElement('div');
            overlay.className = 'mobile-nav-overlay';
            document.body.appendChild(overlay);
            
            // Trigger reflow to enable transition
            overlay.offsetHeight;
            overlay.classList.add('active');
            
            // Close menu when clicking overlay
            overlay.addEventListener('click', () => this.closeNavigation());
        } else if (!show && overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        }
    }

    /**
     * Close the mobile navigation
     */
    closeNavigation() {
        if (!this.isMenuOpen) return;
        
        this.isMenuOpen = false;
        
        // Remove classes
        this.navMenu.classList.remove('show-menu');
        this.body.classList.remove('nav-open');
        
        // Remove overlay
        this.toggleOverlay(false);
        
        // Re-enable body scroll
        this.body.style.overflow = '';
        
        // Update ARIA attributes
        this.updateAriaAttributes(false);
        
        // Release focus
        this.releaseFocus();
        
        console.debug('[MobileController] Navigation closed');
    }

    /**
     * Handle clicks outside the navigation
     */
    handleOutsideClick(e) {
        if (!this.isMenuOpen) return;
        
        // Check if click is outside navigation and toggle button
        if (!this.navMenu.contains(e.target) && !this.navToggle.contains(e.target)) {
            this.closeNavigation();
        }
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        // Close navigation if screen becomes larger than mobile breakpoint
        if (window.innerWidth >= this.breakpoint && this.isMenuOpen) {
            this.closeNavigation();
        }
    }

    /**
     * Handle keyboard events
     */
    handleKeyDown(e) {
        if (e.key === 'Escape' && this.isMenuOpen) {
            this.closeNavigation();
            this.navToggle.focus();
        }
        
        // Handle tab navigation within mobile menu
        if (this.isMenuOpen && e.key === 'Tab') {
            this.handleTabNavigation(e);
        }
    }

    /**
     * Handle tab navigation within mobile menu
     */
    handleTabNavigation(e) {
        const focusableElements = this.navMenu.querySelectorAll(
            'a, button, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Trap focus within mobile menu
     */
    trapFocus() {
        const firstFocusable = this.navMenu.querySelector('a, button');
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
        }
    }

    /**
     * Release focus from mobile menu
     */
    releaseFocus() {
        this.navToggle.focus();
    }

    /**
     * Update ARIA attributes for accessibility
     */
    updateAriaAttributes(isOpen) {
        this.navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        this.navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        
        // Update menu visibility for screen readers
        this.navMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    }

    /**
     * Announce menu state to screen readers
     */
    announceMenuState(isOpen) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = isOpen ? 'Menu opened' : 'Menu closed';
        
        document.body.appendChild(announcement);
        
        // Remove announcement after screen reader reads it
        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
            }
        }, 1000);
    }

    /**
     * Setup touch events for better mobile UX
     */
    setupTouchEvents() {
        let startY = 0;
        let endY = 0;
        
        // Handle touch for closing menu on swipe up
        this.navMenu.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        this.navMenu.addEventListener('touchend', (e) => {
            endY = e.changedTouches[0].clientY;
            
            // Close menu on upward swipe
            if (startY - endY > 100) {
                this.closeNavigation();
            }
        });
        
        // Prevent body scrolling when menu is open
        this.navMenu.addEventListener('touchmove', (e) => {
            if (this.isMenuOpen) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * Add CSS styles for burger toggle animation
     */
    addToggleStyles() {
        if (document.querySelector('#mobile-nav-styles')) return;
        
        const styles = `
            .nav__toggle {
                display: flex;
                flex-direction: column;
                justify-content: center;
                width: 30px;
                height: 30px;
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 0;
                z-index: 1001;
                transition: transform 0.3s ease;
            }
            
            .nav__toggle:hover {
                transform: scale(1.1);
            }
            
            .nav__toggle-bar {
                width: 100%;
                height: 2px;
                background: var(--text-color);
                margin: 3px 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                transform-origin: center;
            }
            
            .nav__toggle.active .nav__toggle-bar:nth-child(1) {
                transform: rotate(45deg) translate(6px, 6px);
            }
            
            .nav__toggle.active .nav__toggle-bar:nth-child(2) {
                opacity: 0;
                transform: scale(0);
            }
            
            .nav__toggle.active .nav__toggle-bar:nth-child(3) {
                transform: rotate(-45deg) translate(6px, -6px);
            }
            
            @media (min-width: 992px) {
                .nav__toggle {
                    display: none;
                }
            }
            
            .nav__menu.active {
                transform: translateX(0);
                opacity: 1;
                visibility: visible;
            }
            
            @media (max-width: 991px) {
                .nav__menu {
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: 100%;
                    height: 100vh;
                    background: var(--bg-color);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    transform: translateX(100%);
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 1000;
                    padding: 2rem;
                }
                
                .nav__item {
                    margin: 1rem 0;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .nav__menu.active .nav__item {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .nav__menu.active .nav__item:nth-child(1) { transition-delay: 0.1s; }
                .nav__menu.active .nav__item:nth-child(2) { transition-delay: 0.2s; }
                .nav__menu.active .nav__item:nth-child(3) { transition-delay: 0.3s; }
                .nav__menu.active .nav__item:nth-child(4) { transition-delay: 0.4s; }
                .nav__menu.active .nav__item:nth-child(5) { transition-delay: 0.5s; }
                .nav__menu.active .nav__item:nth-child(6) { transition-delay: 0.6s; }
                
                .nav__link {
                    font-size: 1.5rem;
                    font-weight: 500;
                    text-align: center;
                    padding: 1rem;
                    display: block;
                    width: 100%;
                }
            }
            
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
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'mobile-nav-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    /**
     * Check if device is mobile
     */
    isMobile() {
        return window.innerWidth < this.breakpoint;
    }

    /**
     * Handle resize events (called by main app)
     */
    handleResize() {
        // Already handled in setupEventListeners
    }

    /**
     * Get menu state
     */
    isMenuOpen() {
        return this.isMenuOpen;
    }

    /**
     * Force close menu (for programmatic control)
     */
    forceClose() {
        if (this.isMenuOpen) {
            this.closeNavigation();
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        // Remove event listeners
        document.removeEventListener('click', this.handleOutsideClick);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Reset body overflow
        this.body.style.overflow = '';
        
        // Remove styles
        const styles = document.getElementById('mobile-nav-styles');
        if (styles) {
            styles.remove();
        }
    }
}

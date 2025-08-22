/**
 * Navigation Controller
 * 
 * Handles all navigation-related functionality including smooth scrolling,
 * active link updates, and navbar scroll effects.
 * 
 * @author Brahim El Houss
 */

class NavigationController {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.navLinks = document.querySelectorAll('.nav__link');
        this.sections = document.querySelectorAll('section[id]');
        this.scrollOffset = 100;
        
        this.init();
    }

    /**
     * Initialize navigation functionality
     */
    init() {
        if (!this.navbar || !this.navLinks.length) {
            console.warn('[NavigationController] Navbar or nav links not found');
            return;
        }

        this.setupSmoothScrolling();
        this.setupScrollEffects();
        this.setupBackToTop();
        
        console.debug('[NavigationController] Initialized');
    }

    /**
     * Setup smooth scrolling for navigation links
     */
    setupSmoothScrolling() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                    this.updateActiveNavLink(link);
                    console.debug(`[NavigationController] Scrolled to ${targetId}`);
                } else {
                    console.warn(`[NavigationController] Target section ${targetId} not found`);
                }
            });
        });

        // Setup smooth scrolling for all internal links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Setup scroll effects for navbar and active link updates
     */
    setupScrollEffects() {
        this.handleScroll = this.handleScroll.bind(this);
        window.addEventListener('scroll', this.handleScroll);
    }

    /**
     * Handle scroll events
     */
    handleScroll() {
        // Update navbar appearance
        if (window.scrollY > 50) {
            this.navbar.classList.add('nav--scrolled');
        } else {
            this.navbar.classList.remove('nav--scrolled');
        }

        // Update active navigation link
        this.updateActiveNavOnScroll();

        // Handle scroll indicator
        const scrollIndicator = document.querySelector('.scroll-indicator');
        if (scrollIndicator) {
            const opacity = window.scrollY > 100 ? 0 : Math.max(0, 1 - window.scrollY / 200);
            scrollIndicator.style.opacity = opacity;
        }
    }

    /**
     * Update active navigation link based on scroll position
     */
    updateActiveNavOnScroll() {
        const scrollPos = window.scrollY + this.scrollOffset;
        
        this.sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                const activeLink = document.querySelector(`.nav__link[href="#${sectionId}"]`);
                if (activeLink) {
                    this.updateActiveNavLink(activeLink);
                }
            }
        });
    }

    /**
     * Update active navigation link
     */
    updateActiveNavLink(activeLink) {
        this.navLinks.forEach(link => link.classList.remove('active'));
        activeLink.classList.add('active');
    }

    /**
     * Setup back to top button
     */
    setupBackToTop() {
        const backToTop = document.getElementById('backToTop');
        if (!backToTop) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.classList.add('show');
            } else {
                backToTop.classList.remove('show');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    /**
     * Cleanup method
     */
    destroy() {
        if (this.handleScroll) {
            window.removeEventListener('scroll', this.handleScroll);
        }
    }
}

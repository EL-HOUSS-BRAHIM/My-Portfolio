/**
 * Animation Controller
 * 
 * Handles scroll-based animations, typewriter effects, parallax scrolling,
 * and skill bar animations using Intersection Observer API.
 * 
 * @author Brahim El Houss
 */

class AnimationController {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.skillObserverOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };

        this.observers = new Map();
        
        this.init();
    }

    /**
     * Initialize animation functionality
     */
    init() {
        this.setupScrollAnimations();
        this.setupSkillBars();
        this.setupTypewriter();
        this.setupParallax();
        this.setupImageLazyLoading();
        
        console.debug('[AnimationController] Initialized');
    }

    /**
     * Setup scroll-based animations using Intersection Observer
     */
    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, this.observerOptions);

        // Add animation classes to elements
        this.addAnimationClasses();

        // Observe elements for animation
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });

        this.observers.set('scroll', observer);
    }

    /**
     * Add animation classes to relevant elements
     */
    addAnimationClasses() {
        const selectors = [
            '.hero__text > *',
            '.about__intro',
            '.detail-item',
            '.skill-item',
            '.project-card',
            '.timeline-item',
            '.contact-item'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.classList.add('animate-on-scroll');
            });
        });
    }

    /**
     * Setup animated skill bars
     */
    setupSkillBars() {
        const skillBars = document.querySelectorAll('.skill-bar');
        if (!skillBars.length) return;

        const skillObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateSkillBar(entry.target);
                    skillObserver.unobserve(entry.target);
                }
            });
        }, this.skillObserverOptions);

        skillBars.forEach(bar => {
            bar.style.width = '0%';
            skillObserver.observe(bar);
        });

        this.observers.set('skills', skillObserver);
    }

    /**
     * Animate individual skill bar
     */
    animateSkillBar(skillBar) {
        const skillItem = skillBar.closest('.skill-item');
        const level = skillItem?.getAttribute('data-level') || '0';
        
        setTimeout(() => {
            skillBar.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
            skillBar.style.width = level + '%';
            
            // Add a pulse effect when animation completes
            setTimeout(() => {
                skillBar.style.boxShadow = '0 0 20px rgba(var(--primary-color-rgb), 0.5)';
                setTimeout(() => {
                    skillBar.style.boxShadow = '';
                }, 500);
            }, 1500);
            
            console.debug(`[AnimationController] Skill bar animated to ${level}%`);
        }, 200);
    }

    /**
     * Setup typewriter effect for hero section
     */
    setupTypewriter() {
        const roleElement = document.querySelector('.hero__role');
        if (!roleElement) return;

        const roles = [
            'Full Stack Software Engineer',
            'Frontend Developer',
            'Backend Developer',
            'Problem Solver',
            'Tech Enthusiast'
        ];

        let currentRole = 0;
        let currentChar = 0;
        let isDeleting = false;
        
        const typeSpeed = 100;
        const deleteSpeed = 50;
        const pauseTime = 2000;

        const type = () => {
            const currentText = roles[currentRole];
            
            if (isDeleting) {
                roleElement.textContent = currentText.substring(0, currentChar - 1);
                currentChar--;
            } else {
                roleElement.textContent = currentText.substring(0, currentChar + 1);
                currentChar++;
            }

            if (!isDeleting && currentChar === currentText.length) {
                setTimeout(() => isDeleting = true, pauseTime);
            } else if (isDeleting && currentChar === 0) {
                isDeleting = false;
                currentRole = (currentRole + 1) % roles.length;
            }

            const speed = isDeleting ? deleteSpeed : typeSpeed;
            setTimeout(type, speed);
        };

        // Add cursor effect
        roleElement.style.borderRight = '2px solid var(--primary-color)';
        roleElement.style.animation = 'blink 1s infinite';
        
        setTimeout(type, 1000);
        console.debug('[AnimationController] Typewriter effect initialized');
    }

    /**
     * Setup parallax scrolling effect
     */
    setupParallax() {
        const parallaxElements = document.querySelectorAll('.floating-shapes .shape');
        if (!parallaxElements.length) return;

        let ticking = false;
        
        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;

            parallaxElements.forEach((element, index) => {
                const speed = (index + 1) * 0.1;
                const yPos = rate * speed;
                const rotation = scrolled * 0.02;
                
                element.style.transform = `translateY(${yPos}px) rotate(${rotation}deg)`;
            });
            
            ticking = false;
        };

        const handleParallaxScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleParallaxScroll);
        console.debug('[AnimationController] Parallax effect initialized');
    }

    /**
     * Setup lazy loading for images
     */
    setupImageLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        if (!images.length) return;

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    imageObserver.unobserve(entry.target);
                }
            });
        }, this.observerOptions);

        images.forEach(img => {
            img.classList.add('lazy');
            imageObserver.observe(img);
        });

        this.observers.set('images', imageObserver);
    }

    /**
     * Load image with fade-in effect
     */
    loadImage(img) {
        img.src = img.dataset.src;
        img.addEventListener('load', () => {
            img.classList.remove('lazy');
            img.classList.add('loaded');
        });
        img.addEventListener('error', () => {
            img.classList.add('error');
        });
    }

    /**
     * Handle scroll events (called by main app)
     */
    handleScroll() {
        // Parallax is handled by its own scroll listener for performance
        // Other scroll-based animations use Intersection Observer
    }

    /**
     * Handle resize events (called by main app)
     */
    handleResize() {
        // Reset parallax calculations if needed
        const parallaxElements = document.querySelectorAll('.floating-shapes .shape');
        if (parallaxElements.length) {
            // Could recalculate parallax positions here if needed
        }
    }

    /**
     * Add notification animation
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification__content">
                <span>${message}</span>
                <button class="notification__close" aria-label="Close notification">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            transform: 'translateX(100%)',
            opacity: '0',
            transition: 'all 0.3s ease-out',
            maxWidth: '400px',
            wordWrap: 'break-word',
            backgroundColor: this.getNotificationColor(type)
        });

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });

        // Setup close button
        const closeBtn = notification.querySelector('.notification__close');
        closeBtn.addEventListener('click', () => this.hideNotification(notification));

        // Auto-hide after 5 seconds
        setTimeout(() => this.hideNotification(notification), 5000);

        return notification;
    }

    /**
     * Hide notification with animation
     */
    hideNotification(notification) {
        if (!notification.parentNode) return;
        
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * Get notification color based on type
     */
    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

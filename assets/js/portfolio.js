// ========================================
// MODERN PORTFOLIO JAVASCRIPT (Refactored)
// Brahim El Houss - Full Stack Developer
// ========================================

class PortfolioApp {
    constructor() {
        this.init();
    }

    init() {
        console.debug('[PortfolioApp] Initializing...');
        this.setupNavigation();
        this.setupThemeToggle();
        this.setupScrollAnimations();
        this.setupSkillBars();
        this.setupProjectFilters();
        this.setupContactForm();
        this.setupTypewriter();
        this.setupParallax();
        this.setupMobileMenu();
    }

    // Navigation functionality
    setupNavigation() {
        const navbar = document.getElementById('navbar');
        const navLinks = document.querySelectorAll('.nav__link');
        if (!navbar || !navLinks.length) {
            console.warn('[PortfolioApp] Navbar or nav links not found.');
            return;
        }
        // Smooth scrolling for navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    console.debug(`[PortfolioApp] Scrolled to ${targetId}`);
                } else {
                    console.warn(`[PortfolioApp] Target section ${targetId} not found.`);
                }
                this.updateActiveNavLink(link);
            });
        });
        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navbar.classList.add('nav--scrolled');
            } else {
                navbar.classList.remove('nav--scrolled');
            }
            this.updateActiveNavOnScroll();
        });
    }

    updateActiveNavLink(activeLink) {
        document.querySelectorAll('.nav__link').forEach(link => link.classList.remove('active'));
        activeLink.classList.add('active');
        console.debug(`[PortfolioApp] Active nav link set: ${activeLink.getAttribute('href')}`);
    }

    updateActiveNavOnScroll() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                const activeLink = document.querySelector(`.nav__link[href="#${sectionId}"]`);
                if (activeLink) this.updateActiveNavLink(activeLink);
            }
        });
    }

    // Theme toggle functionality
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        if (!themeToggle) {
            console.warn('[PortfolioApp] Theme toggle button not found.');
            return;
        }
        const savedTheme = localStorage.getItem('theme') || (prefersDark.matches ? 'dark' : 'light');
        this.applyTheme(savedTheme);
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
            console.debug(`[PortfolioApp] Theme toggled to ${newTheme}`);
        });
        prefersDark.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
                console.debug(`[PortfolioApp] System theme changed to ${e.matches ? 'dark' : 'light'}`);
            }
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;
        const icon = themeToggle.querySelector('i');
        if (!icon) return;
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
        console.debug(`[PortfolioApp] Theme applied: ${theme}`);
    }

    // Scroll animations
    setupScrollAnimations() {
        const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    console.debug('[PortfolioApp] Animated:', entry.target);
                }
            });
        }, observerOptions);
        this.addAnimationClasses();
        document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    }

    addAnimationClasses() {
        const selectors = [
            '.hero__text > *',
            '.about__intro',
            '.detail-item',
            '.skill-item',
            '.project-card',
            '.timeline-item',
            '.contact-method'
        ];
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.classList.add('animate-on-scroll');
            });
        });
        console.debug('[PortfolioApp] Animation classes added.');
    }

    // Animated skill bars
    setupSkillBars() {
        const skillBars = document.querySelectorAll('.skill-bar');
        if (!skillBars.length) return;
        const skillObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const skillBar = entry.target;
                    const skillItem = skillBar.closest('.skill-item');
                    const level = skillItem?.getAttribute('data-level') || '0';
                    setTimeout(() => {
                        skillBar.style.width = level + '%';
                        console.debug(`[PortfolioApp] Skill bar animated to ${level}%`, skillBar);
                    }, 200);
                    skillObserver.unobserve(skillBar);
                }
            });
        });
        skillBars.forEach(bar => {
            bar.style.width = '0%';
            skillObserver.observe(bar);
        });
    }

    // Project filtering
    setupProjectFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');
        if (!filterButtons.length || !projectCards.length) return;
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.filterProjects(filter, projectCards);
                console.debug(`[PortfolioApp] Project filter applied: ${filter}`);
            });
        });
    }

    filterProjects(filter, projectCards) {
        projectCards.forEach(card => {
            const category = card.getAttribute('data-category');
            if (filter === 'all' || category === filter) {
                card.style.display = 'block';
                card.style.animation = 'fadeInUp 0.5s ease-out';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Contact form handling
    setupContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (!contactForm) {
            console.warn('[PortfolioApp] Contact form not found.');
            return;
        }
        contactForm.onsubmit = null;
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (contactForm.classList.contains('is-submitting')) return;
            contactForm.classList.add('is-submitting');
            this.handleFormSubmission(contactForm).finally(() => {
                contactForm.classList.remove('is-submitting');
            });
        });
    }

    async handleFormSubmission(form) {
        // Check if we're in development mode
        const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        
        if (isDevelopment) {
            console.log('[PortfolioApp] Development mode - simulating form submission');
            this.showNotification('⚠️ Development Mode: Contact form submission is disabled. This feature will work in production with proper email configuration.', 'warning');
            return;
        }
        
        const submitButton = form.querySelector('.form-submit, button[type="submit"]');
        if (!submitButton) {
            console.warn('[PortfolioApp] Submit button not found in form.');
            return;
        }
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        try {
            const formData = new FormData(form);
            let endpoint = form.action && form.action !== '#' ? form.action : '/src/api/contact.php';
            if (!endpoint.startsWith('http') && !endpoint.startsWith('/')) endpoint = '/' + endpoint;
            const response = await fetch(endpoint, { method: 'POST', body: formData });
            let data;
            let rawText = '';
            try {
                rawText = await response.text();
                data = JSON.parse(rawText);
            } catch (jsonErr) {
                console.error('[PortfolioApp] Raw server response:', rawText);
                throw new Error('Invalid server response. Please try again later.');
            }
            if (!response.ok) throw new Error(`Network response was not ok (status: ${response.status})`);
            if (data && data.success) {
                this.showNotification(data.message || 'Message sent successfully!', 'success');
                form.reset();
                console.debug('[PortfolioApp] Contact form submitted successfully.');
            } else {
                if (data && data.errors) {
                    Object.keys(data.errors).forEach(fieldName => {
                        const field = form.querySelector(`[name="${fieldName}"]`);
                        if (field) {
                            field.classList.add('error');
                            field.addEventListener('input', function handler() {
                                field.classList.remove('error');
                                field.removeEventListener('input', handler);
                            });
                        }
                    });
                }
                this.showNotification((data && data.message) || 'Failed to send message. Please try again.', 'error');
                console.warn('[PortfolioApp] Contact form submission failed.', data);
            }
        } catch (error) {
            console.error('[PortfolioApp] Form submission error:', error);
            this.showNotification(error.message || 'Failed to send message. Please try again.', 'error');
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        let backgroundColor;
        switch(type) {
            case 'success':
                backgroundColor = '#10b981';
                break;
            case 'warning':
                backgroundColor = '#f59e0b';
                break;
            case 'error':
            default:
                backgroundColor = '#ef4444';
                break;
        }
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '9999',
            animation: 'slideInRight 0.3s ease-out',
            backgroundColor: backgroundColor
        });
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 5000); // Longer timeout for warning messages
        console.debug(`[PortfolioApp] Notification shown: ${message} (${type})`);
    }

    // Typewriter effect for hero section
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
        let currentRole = 0, currentChar = 0, isDeleting = false;
        const typeSpeed = 100, deleteSpeed = 50, pauseTime = 2000;
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
        setTimeout(type, 1000);
        console.debug('[PortfolioApp] Typewriter effect initialized.');
    }

    // Parallax scrolling effect
    setupParallax() {
        const parallaxElements = document.querySelectorAll('.floating-shapes .shape');
        if (!parallaxElements.length) return;
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            parallaxElements.forEach((element, index) => {
                const speed = (index + 1) * 0.1;
                element.style.transform = `translateY(${rate * speed}px) rotate(${scrolled * 0.05}deg)`;
            });
        });
        console.debug('[PortfolioApp] Parallax effect initialized.');
    }

    // Mobile menu functionality
    setupMobileMenu() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (!navToggle || !navMenu) {
            console.warn('[PortfolioApp] Mobile nav toggle or menu not found.');
            return;
        }
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('show');
            document.body.classList.toggle('menu-open');
        });
        document.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('show');
                document.body.classList.remove('menu-open');
            });
        });
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('show');
                document.body.classList.remove('menu-open');
            }
        });
        console.debug('[PortfolioApp] Mobile menu initialized.');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioApp = new PortfolioApp();
    console.debug('[PortfolioApp] DOMContentLoaded - App initialized.');
});

// Add loading animation
window.addEventListener('load', () => {
    const loader = document.querySelector('.loading-screen');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }
    document.body.classList.add('loaded');
    console.debug('[PortfolioApp] Window loaded - Loader removed, entrance animations started.');
});

// ========================================
// Scroll to top button functionality
document.addEventListener('DOMContentLoaded', () => {
    const scrollToTopButton = document.getElementById('scroll-to-top');
    if (scrollToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollToTopButton.classList.add('visible');
            } else {
                scrollToTopButton.classList.remove('visible');
            }
        });
        scrollToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            console.debug('[PortfolioApp] Scroll to top triggered.');
        });
    }
});

// Performance optimization: Lazy loading for images
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img[data-src]');
    if (!images.length) return;
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
                console.debug('[PortfolioApp] Image lazy-loaded:', img);
            }
        });
    });
    images.forEach(img => imageObserver.observe(img));
});

// Add custom cursor effect for better UX
document.addEventListener('DOMContentLoaded', () => {
    if (window.matchMedia('(hover: hover)').matches) {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.innerHTML = '<div class="cursor-dot"></div><div class="cursor-outline"></div>';
        document.body.appendChild(cursor);
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
        const interactiveElements = document.querySelectorAll('a, button, .btn, .project-card, .skill-item');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });
        console.debug('[PortfolioApp] Custom cursor initialized.');
    }
});

// Testimonial functionality is now handled by the dedicated TestimonialSlider module
// in /assets/js/testimonials.js

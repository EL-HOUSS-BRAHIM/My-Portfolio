// ========================================
// MODERN PORTFOLIO JAVASCRIPT
// Brahim El Houss - Full Stack Developer
// ========================================

class PortfolioApp {
    constructor() {
        this.init();
    }

    init() {
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
        
        // Smooth scrolling for navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
                
                // Update active nav link
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
            
            // Update active nav link based on scroll position
            this.updateActiveNavOnScroll();
        });
    }

    updateActiveNavLink(activeLink) {
        document.querySelectorAll('.nav__link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
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
                if (activeLink) {
                    this.updateActiveNavLink(activeLink);
                }
            }
        });
    }

    // Theme toggle functionality
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        
        if (!themeToggle) return;
        
        // Load saved theme or default to system preference
        const savedTheme = localStorage.getItem('theme') || 
                          (prefersDark.matches ? 'dark' : 'light');
        
        this.applyTheme(savedTheme);
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            this.applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
        
        // Listen for system theme changes
        prefersDark.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;
        
        const icon = themeToggle.querySelector('i');
        
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // Scroll animations
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, observerOptions);

        // Observe elements with animation classes
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        animatedElements.forEach(el => observer.observe(el));

        // Add animation classes to relevant elements
        this.addAnimationClasses();
    }

    addAnimationClasses() {
        const elementsToAnimate = [
            '.hero__text > *',
            '.about__intro',
            '.detail-item',
            '.skill-item',
            '.project-card',
            '.timeline-item',
            '.contact-method'
        ];

        elementsToAnimate.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.classList.add('animate-on-scroll');
            });
        });
    }

    // Animated skill bars
    setupSkillBars() {
        const skillBars = document.querySelectorAll('.skill-bar');
        
        const skillObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const skillBar = entry.target;
                    const skillItem = skillBar.closest('.skill-item');
                    const level = skillItem.getAttribute('data-level');
                    
                    // Animate the skill bar
                    setTimeout(() => {
                        skillBar.style.width = level + '%';
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

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                
                // Update active filter button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filter projects
                this.filterProjects(filter, projectCards);
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
        
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission(contactForm);
            });
        }
    }

    async handleFormSubmission(form) {
        const submitButton = form.querySelector('.form-submit, button[type="submit"]');
        if (!submitButton) return;
        
        const originalText = submitButton.textContent;
        
        // Show loading state
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
        
        try {
            const formData = new FormData(form);
            
            // Use existing form action or simulate
            const response = await fetch(form.action || '#', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                this.showNotification('Message sent successfully!', 'success');
                form.reset();
            } else {
                throw new Error('Network response was not ok');
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showNotification('Failed to send message. Please try again.', 'error');
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        // Style the notification
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
            backgroundColor: type === 'success' ? '#10b981' : '#ef4444'
        });
        
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
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

        // Start typewriter effect after a delay
        setTimeout(type, 1000);
    }

    // Parallax scrolling effect
    setupParallax() {
        const parallaxElements = document.querySelectorAll('.floating-shapes .shape');
        
        if (parallaxElements.length === 0) return;

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;

            parallaxElements.forEach((element, index) => {
                const speed = (index + 1) * 0.1;
                element.style.transform = `translateY(${rate * speed}px) rotate(${scrolled * 0.05}deg)`;
            });
        });
    }

    // Mobile menu functionality
    setupMobileMenu() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (!navToggle || !navMenu) return;

        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('show');
            document.body.classList.toggle('menu-open');
        });

        // Close menu when clicking on nav links
        document.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('show');
                document.body.classList.remove('menu-open');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('show');
                document.body.classList.remove('menu-open');
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioApp();
});

// Add loading animation
window.addEventListener('load', () => {
    const loader = document.querySelector('.loading-screen');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }
    
    // Start entrance animations
    document.body.classList.add('loaded');
});

// ========================================
// Contact Form Enhancement Functions
// ========================================

// Enhanced contact form setup
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const submitButton = contactForm?.querySelector('.form-submit, button[type="submit"]');
    const responseMessage = document.getElementById('response-message') || createResponseElement();

    function createResponseElement() {
        const element = document.createElement('div');
        element.id = 'response-message';
        element.style.display = 'none';
        contactForm?.appendChild(element);
        return element;
    }
    
    if (!contactForm) {
        console.warn('Contact form not found');
        return;
    }

    // Add real-time validation
    const formInputs = contactForm.querySelectorAll('input, textarea');
    formInputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });

    contactForm.addEventListener('submit', handleContactFormSubmission);

    /**
     * Handle contact form submission
     */
    async function handleContactFormSubmission(event) {
        event.preventDefault();

        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        // Show loading state
        setLoadingState(true);
        hideResponseMessage();

        try {
            const formData = new FormData(contactForm);
            
            const response = await fetch('src/api/contact.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showSuccessMessage(data.message || 'Your message has been sent successfully!');
                contactForm.reset();
                clearAllFieldErrors();
            } else {
                // Handle validation errors or other API errors
                if (data.errors && typeof data.errors === 'object') {
                    showValidationErrors(data.errors);
                } else {
                    showErrorMessage(data.message || 'There was an error sending your message. Please try again.');
                }
            }
        } catch (error) {
            console.error('Contact form error:', error);
            showErrorMessage('An unexpected error occurred. Please try again later.');
        } finally {
            setLoadingState(false);
        }
    }

    /**
     * Validate entire form
     */
    function validateForm() {
        let isValid = true;
        const requiredFields = contactForm.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            if (!validateField({ target: field })) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Validate individual field
     */
    function validateField(event) {
        const field = event.target;
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Clear previous error
        clearFieldError(event);

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            errorMessage = `${getFieldLabel(field)} is required.`;
            isValid = false;
        }
        // Email validation
        else if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errorMessage = 'Please enter a valid email address.';
                isValid = false;
            }
        }
        // Name validation (no numbers or special characters)
        else if (field.name === 'name' && value) {
            const nameRegex = /^[a-zA-Z\s'-]+$/;
            if (!nameRegex.test(value)) {
                errorMessage = 'Name should only contain letters, spaces, hyphens, and apostrophes.';
                isValid = false;
            }
        }
        // Message length validation
        else if (field.name === 'message' && value && value.length < 10) {
            errorMessage = 'Message should be at least 10 characters long.';
            isValid = false;
        }

        if (!isValid) {
            showFieldError(field, errorMessage);
        }

        return isValid;
    }

    /**
     * Show field-specific error
     */
    function showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.color = 'red';
        errorElement.style.fontSize = '0.9em';
        errorElement.style.marginTop = '5px';
        
        field.parentNode.appendChild(errorElement);
    }

    /**
     * Clear field error
     */
    function clearFieldError(event) {
        const field = event.target;
        field.classList.remove('error');
        
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Clear all field errors
     */
    function clearAllFieldErrors() {
        const errorFields = contactForm.querySelectorAll('.error');
        const errorMessages = contactForm.querySelectorAll('.field-error');
        
        errorFields.forEach(field => field.classList.remove('error'));
        errorMessages.forEach(error => error.remove());
    }

    /**
     * Show validation errors from API
     */
    function showValidationErrors(errors) {
        Object.keys(errors).forEach(fieldName => {
            const field = contactForm.querySelector(`[name="${fieldName}"]`);
            if (field) {
                showFieldError(field, errors[fieldName]);
            }
        });
    }

    /**
     * Get field label for error messages
     */
    function getFieldLabel(field) {
        const label = contactForm.querySelector(`label[for="${field.id}"]`);
        return label ? label.textContent : field.name.charAt(0).toUpperCase() + field.name.slice(1);
    }

    /**
     * Set loading state
     */
    function setLoadingState(isLoading) {
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
            submitButton.style.opacity = '0.7';
        } else {
            submitButton.disabled = false;
            submitButton.textContent = 'Send';
            submitButton.style.opacity = '1';
        }
    }

    /**
     * Show success message
     */
    function showSuccessMessage(message) {
        responseMessage.textContent = message;
        responseMessage.style.display = 'block';
        responseMessage.style.color = 'green';
        responseMessage.style.backgroundColor = '#d4edda';
        responseMessage.style.border = '1px solid #c3e6cb';
        responseMessage.style.padding = '10px';
        responseMessage.style.borderRadius = '5px';
        responseMessage.style.marginTop = '15px';
        
        // Scroll to message
        responseMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Show error message
     */
    function showErrorMessage(message) {
        responseMessage.textContent = message;
        responseMessage.style.display = 'block';
        responseMessage.style.color = 'red';
        responseMessage.style.backgroundColor = '#f8d7da';
        responseMessage.style.border = '1px solid #f5c6cb';
        responseMessage.style.padding = '10px';
        responseMessage.style.borderRadius = '5px';
        responseMessage.style.marginTop = '15px';
        
        // Scroll to message
        responseMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Hide response message
     */
    function hideResponseMessage() {
        responseMessage.style.display = 'none';
    }
});

// ========================================
// Scroll to top button functionality

document.addEventListener('DOMContentLoaded', () => {
    const scrollToTopButton = document.getElementById('scroll-to-top');
    
    if (scrollToTopButton) {
        // Show/hide scroll to top button
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollToTopButton.classList.add('visible');
            } else {
                scrollToTopButton.classList.remove('visible');
            }
        });
        
        // Smooth scroll to top
        scrollToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});

// Performance optimization: Lazy loading for images
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
});

// Add custom cursor effect for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Only add custom cursor on non-touch devices
    if (window.matchMedia('(hover: hover)').matches) {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.innerHTML = '<div class="cursor-dot"></div><div class="cursor-outline"></div>';
        document.body.appendChild(cursor);

        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        // Add hover effects for interactive elements
        const interactiveElements = document.querySelectorAll('a, button, .btn, .project-card, .skill-item');
        
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });
    }
});

// Testimonial functionality is now handled by the dedicated TestimonialSlider module
// in /assets/js/testimonials.js

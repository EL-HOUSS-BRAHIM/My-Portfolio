/**
 * Testimonial Controller
 * 
 * Handles testimonial display, navigation, form submission, and responsive behavior.
 * Includes keyboard navigation, accessibility features, and smooth animations.
 * 
 * @author Brahim El Houss
 */

class TestimonialController {
    constructor(apiBaseUrl = './src/api', autoSlideInterval = 8000) {
        this.apiBaseUrl = apiBaseUrl;
        this.autoSlideInterval = autoSlideInterval;
        this.currentTestimonial = 0;
        this.testimonials = [];
        this.numVisibleCards = 3;
        this.autoSlideTimer = null;
        this.isAutoPaused = false;
        
        this.elements = {
            slider: document.querySelector('.testimonial-slider'),
            prevButton: document.getElementById('prevTestimonial'),
            nextButton: document.getElementById('nextTestimonial'),
            addButton: document.getElementById('addTestimonialBtn'),
            formContainer: document.getElementById('testimonialFormContainer'),
            form: document.getElementById('testimonialForm')
        };
        
        this.init();
    }

    /**
     * Initialize testimonial functionality
     */
    init() {
        if (!this.elements.slider) {
            console.warn('[TestimonialController] Testimonial slider not found');
            return;
        }
        
        this.setupEventListeners();
        this.setupResponsiveCards();
        this.fetchTestimonials();
        
        console.debug('[TestimonialController] Initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation buttons
        if (this.elements.prevButton) {
            this.elements.prevButton.addEventListener('click', () => this.showPrevTestimonial());
        }
        
        if (this.elements.nextButton) {
            this.elements.nextButton.addEventListener('click', () => this.showNextTestimonial());
        }
        
        // Add testimonial button
        if (this.elements.addButton) {
            this.elements.addButton.addEventListener('click', () => this.toggleForm());
        }
        
        // Form submission
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        // Window resize
        window.addEventListener('resize', this.debounce(() => {
            this.setupResponsiveCards();
            this.updateSliderPosition();
        }, 250));
        
        // Pause auto-slide on hover
        if (this.elements.slider) {
            this.elements.slider.addEventListener('mouseenter', () => this.pauseAutoSlide());
            this.elements.slider.addEventListener('mouseleave', () => this.resumeAutoSlide());
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
        
        // Touch/swipe support
        this.setupTouchSupport();
    }

    /**
     * Setup responsive card display
     */
    setupResponsiveCards() {
        const viewportWidth = window.innerWidth;
        
        if (viewportWidth < 768) {
            this.numVisibleCards = 1;
        } else if (viewportWidth < 1024) {
            this.numVisibleCards = 2;
        } else {
            this.numVisibleCards = 3;
        }
        
        this.updateSliderPosition();
    }

    /**
     * Fetch testimonials from API
     */
    async fetchTestimonials() {
        const isDevelopment = this.isDevMode();
        
        if (isDevelopment) {
            this.loadSampleTestimonials();
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/get_testimonials.php`);
        
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                if (data.data && Array.isArray(data.data.testimonials)) {
                    // New format with data wrapper
                    this.testimonials = data.data.testimonials;
                } else if (Array.isArray(data.testimonials)) {
                    // Fallback for old format
                    this.testimonials = data.testimonials;
                } else {
                    // No testimonials found
                    this.testimonials = [];
                }
                
                this.displayTestimonials();
                this.updateNavigationButtons();
                this.startAutoSlide();
                
                console.log('[TestimonialController] Successfully loaded', this.testimonials.length, 'testimonials');
            } else {
                throw new Error(data.message || 'API returned unsuccessful response');
            }
            
        } catch (error) {
            console.error('[TestimonialController] Fetch error:', error);
            this.showDatabaseError(error.message);
        }
    }

    /**
     * Check if running in development mode
     */
    isDevMode() {
        return location.hostname === 'localhost' || 
               location.hostname === '127.0.0.1' || 
               location.hostname === '';
    }

    /**
     * Load sample testimonials for development
     */
    loadSampleTestimonials() {
        this.testimonials = [
            {
                id: 1,
                name: "Sarah Johnson",
                image: "assets/images/testimonials/sarah.jpg",
                rating: 5,
                testimonial: "Brahim delivered exceptional work on our web application. His attention to detail and technical expertise made the project a huge success.",
                created_at: "2024-01-15"
            },
            {
                id: 2,
                name: "Michael Chen",
                image: "assets/images/testimonials/michael.jpg",
                rating: 5,
                testimonial: "Working with Brahim was a fantastic experience. He's professional, communicative, and delivers high-quality code on time.",
                created_at: "2024-02-01"
            },
            {
                id: 3,
                name: "Emily Rodriguez",
                image: "assets/images/testimonials/emily.jpg",
                rating: 5,
                testimonial: "Brahim's full-stack development skills are impressive. He transformed our ideas into a beautiful, functional website.",
                created_at: "2024-02-15"
            },
            {
                id: 4,
                name: "David Thompson",
                image: "assets/images/testimonials/david.jpg",
                rating: 4,
                testimonial: "Great developer with strong problem-solving skills. Would definitely recommend for any web development project.",
                created_at: "2024-03-01"
            }
        ];
        
        this.displayTestimonials();
        this.updateNavigationButtons();
        this.startAutoSlide();
    }

    /**
     * Display testimonials in the slider
     */
    displayTestimonials() {
        if (!this.elements.slider || this.testimonials.length === 0) {
            this.showEmptyState();
            return;
        }
        
        const testimonialsHTML = this.testimonials.map(testimonial => 
            this.createTestimonialHTML(testimonial)
        ).join('');
        
        this.elements.slider.innerHTML = testimonialsHTML;
        this.updateSliderPosition();
    }

    /**
     * Create HTML for a single testimonial
     */
    createTestimonialHTML(testimonial) {
        const stars = this.generateStars(testimonial.rating);
        const formattedDate = this.formatDate(testimonial.created_at);
        const escapedText = this.escapeHtml(testimonial.testimonial);
        const escapedName = this.escapeHtml(testimonial.name);
        
        // Use image_url if provided, otherwise fallback to image field
        const imageUrl = testimonial.image_url || testimonial.image || 'assets/images/placeholder-avatar.svg';
        
        return `
            <div class="testimonial-item" data-id="${testimonial.id}">
                <div class="testimonial-content">
                    <div class="testimonial-rating">
                        ${stars}
                    </div>
                    <blockquote class="testimonial-text">
                        "${escapedText}"
                    </blockquote>
                    <div class="testimonial-author">
                        <div class="testimonial-image">
                            <img src="${imageUrl}" alt="${escapedName}" loading="lazy" 
                                 onerror="this.src='assets/images/placeholder-avatar.svg'">
                        </div>
                        <div class="testimonial-details">
                            <h4 class="testimonial-name">${escapedName}</h4>
                            <time class="testimonial-date" datetime="${testimonial.created_at}">
                                ${formattedDate}
                            </time>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate star rating HTML
     */
    generateStars(rating) {
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }
        return starsHTML;
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Update slider position
     */
    updateSliderPosition() {
        if (!this.elements.slider || this.testimonials.length === 0) return;
        
        const slideWidth = 100 / this.numVisibleCards;
        const translateX = -this.currentTestimonial * slideWidth;
        
        this.elements.slider.style.transform = `translateX(${translateX}%)`;
        this.elements.slider.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    }

    /**
     * Show next testimonial
     */
    showNextTestimonial() {
        if (this.testimonials.length === 0) return;
        
        const maxIndex = Math.max(0, this.testimonials.length - this.numVisibleCards);
        this.currentTestimonial = Math.min(this.currentTestimonial + 1, maxIndex);
        
        this.updateSliderPosition();
        this.updateNavigationButtons();
    }

    /**
     * Show previous testimonial
     */
    showPrevTestimonial() {
        if (this.testimonials.length === 0) return;
        
        this.currentTestimonial = Math.max(this.currentTestimonial - 1, 0);
        
        this.updateSliderPosition();
        this.updateNavigationButtons();
    }

    /**
     * Update navigation button states
     */
    updateNavigationButtons() {
        if (!this.elements.prevButton || !this.elements.nextButton) return;
        
        const maxIndex = Math.max(0, this.testimonials.length - this.numVisibleCards);
        
        this.elements.prevButton.disabled = this.currentTestimonial === 0;
        this.elements.nextButton.disabled = this.currentTestimonial >= maxIndex;
        
        // Update ARIA labels
        this.elements.prevButton.setAttribute('aria-label', 
            `Previous testimonial (${this.currentTestimonial + 1} of ${this.testimonials.length})`);
        this.elements.nextButton.setAttribute('aria-label', 
            `Next testimonial (${this.currentTestimonial + 1} of ${this.testimonials.length})`);
    }

    /**
     * Start auto-slide functionality
     */
    startAutoSlide() {
        if (this.testimonials.length <= this.numVisibleCards) return;
        
        this.autoSlideTimer = setInterval(() => {
            if (!this.isAutoPaused) {
                const maxIndex = Math.max(0, this.testimonials.length - this.numVisibleCards);
                
                if (this.currentTestimonial >= maxIndex) {
                    this.currentTestimonial = 0;
                } else {
                    this.currentTestimonial++;
                }
                
                this.updateSliderPosition();
                this.updateNavigationButtons();
            }
        }, this.autoSlideInterval);
    }

    /**
     * Stop auto-slide
     */
    stopAutoSlide() {
        if (this.autoSlideTimer) {
            clearInterval(this.autoSlideTimer);
            this.autoSlideTimer = null;
        }
    }

    /**
     * Pause auto-slide
     */
    pauseAutoSlide() {
        this.isAutoPaused = true;
    }

    /**
     * Resume auto-slide
     */
    resumeAutoSlide() {
        this.isAutoPaused = false;
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(event) {
        // Only handle if testimonials are in focus
        const isTestimonialFocused = event.target.closest('.testimonials');
        if (!isTestimonialFocused) return;
        
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                this.showPrevTestimonial();
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.showNextTestimonial();
                break;
            case 'Home':
                event.preventDefault();
                this.currentTestimonial = 0;
                this.updateSliderPosition();
                this.updateNavigationButtons();
                break;
            case 'End':
                event.preventDefault();
                this.currentTestimonial = Math.max(0, this.testimonials.length - this.numVisibleCards);
                this.updateSliderPosition();
                this.updateNavigationButtons();
                break;
        }
    }

    /**
     * Setup touch/swipe support
     */
    setupTouchSupport() {
        if (!this.elements.slider) return;
        
        let startX = 0;
        let endX = 0;
        
        this.elements.slider.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        this.elements.slider.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            this.handleSwipe(startX, endX);
        });
    }

    /**
     * Handle swipe gestures
     */
    handleSwipe(startX, endX) {
        const threshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.showNextTestimonial();
            } else {
                this.showPrevTestimonial();
            }
        }
    }

    /**
     * Toggle testimonial form
     */
    toggleForm() {
        if (!this.elements.formContainer) return;
        
        const isHidden = this.elements.formContainer.classList.contains('hidden');
        
        if (isHidden) {
            this.elements.formContainer.classList.remove('hidden');
            this.elements.addButton.textContent = 'Cancel';
        } else {
            this.elements.formContainer.classList.add('hidden');
            this.elements.addButton.textContent = 'Add Your Testimonial';
        }
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        if (this.isDevMode()) {
            alert('Testimonial form submission is disabled in development mode.');
            return;
        }
        
        const formData = new FormData(this.elements.form);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/add_testimonial.php`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Thank you for your testimonial! It will be reviewed before being published.');
                this.elements.form.reset();
                this.toggleForm();
            } else {
                alert(data.message || 'Failed to submit testimonial. Please try again.');
            }
            
        } catch (error) {
            console.error('[TestimonialController] Form submission error:', error);
            alert('An error occurred. Please try again later.');
        }
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        if (!this.elements.slider) return;
        
        this.elements.slider.innerHTML = `
            <div class="testimonials-empty">
                <div class="empty-icon">
                    <i class="fas fa-comments"></i>
                </div>
                <h3>No testimonials yet</h3>
                <p>Be the first to share your experience!</p>
            </div>
        `;
    }

    /**
     * Show database error
     */
    showDatabaseError(message = 'Unable to load testimonials') {
        if (!this.elements.slider) return;
        
        this.elements.slider.innerHTML = `
            <div class="testimonials-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Testimonials Unavailable</h3>
                <p>${message}</p>
                <button onclick="window.location.reload()" class="btn btn--secondary">
                    Try Again
                </button>
            </div>
        `;
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
     * Handle resize events (called by main app)
     */
    handleResize() {
        this.setupResponsiveCards();
    }

    /**
     * Handle visibility change (called by main app)
     */
    handleVisibilityChange(isVisible) {
        if (isVisible) {
            this.resumeAutoSlide();
        } else {
            this.pauseAutoSlide();
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.stopAutoSlide();
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('keydown', this.handleKeyboardNavigation);
    }
}

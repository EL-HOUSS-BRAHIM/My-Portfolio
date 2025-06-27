/**
 * Testimonial Slider Module
 * 
 * Handles testimonial display, navigation, and form submission
 */

class TestimonialSlider {
    constructor(apiBaseUrl, autoSlideInterval = 8000) {
        this.apiBaseUrl = apiBaseUrl;
        this.autoSlideInterval = autoSlideInterval;
        this.currentTestimonial = 0;
        this.testimonials = [];
        this.numVisibleCards = 3;
        this.autoSlideTimer = null;
        
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
    
    init() {
        if (!this.elements.slider) {
            console.warn('Testimonial slider element not found');
            return;
        }
        
        this.setupEventListeners();
        this.fetchTestimonials();
        this.setupResponsiveCards();
    }
    
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
        window.addEventListener('resize', () => {
            this.setupResponsiveCards();
            this.updateSliderPosition();
        });
        
        // Pause auto-slide on hover
        if (this.elements.slider) {
            this.elements.slider.addEventListener('mouseenter', () => this.pauseAutoSlide());
            this.elements.slider.addEventListener('mouseleave', () => this.resumeAutoSlide());
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.showPrevTestimonial();
            if (e.key === 'ArrowRight') this.showNextTestimonial();
        });
    }
    
    setupResponsiveCards() {
        const viewportWidth = window.innerWidth;
        
        if (viewportWidth < 768) {
            this.numVisibleCards = 1;
        } else if (viewportWidth < 1024) {
            this.numVisibleCards = 2;
        } else {
            this.numVisibleCards = 3;
        }
    }
    
    async fetchTestimonials() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/get_testimonials.php`);
            
            // Check if response is ok
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.data && data.data.testimonials) {
                this.testimonials = data.data.testimonials;
                this.displayTestimonials();
                this.updateNavigationButtons();
                this.startAutoSlide();
                
                // Show navigation buttons if they were hidden due to previous errors
                if (this.elements.prevButton) this.elements.prevButton.style.display = '';
                if (this.elements.nextButton) this.elements.nextButton.style.display = '';
            } else {
                console.error('Failed to fetch testimonials:', data.message);
                this.showDatabaseError(data.message || 'Failed to load testimonials');
            }
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            
            // Check if it's a database connection error
            if (error.message.includes('500') || error.message.includes('Database')) {
                this.showDatabaseError('Database connection error. Check logs.');
            } else {
                this.showDatabaseError('Failed to load testimonials. Please try again later.');
            }
        }
    }
    
    displayTestimonials() {
        if (!this.elements.slider || this.testimonials.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.elements.slider.innerHTML = this.testimonials.map(testimonial => `
            <div class="testimonial-card" data-id="${testimonial.id}">
                <img src="${testimonial.image_url}" 
                     alt="${this.escapeHtml(testimonial.name)}'s profile picture"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'">
                <div class="name">${this.escapeHtml(testimonial.name)}</div>
                <div class="rating" aria-label="Rating: ${testimonial.rating} out of 5 stars">
                    ${this.generateStars(testimonial.rating)}
                </div>
                <p class="testimonial">${this.escapeHtml(testimonial.testimonial)}</p>
                <div class="date">${this.formatDate(testimonial.created_at)}</div>
            </div>
        `).join('');
        
        this.updateSliderPosition();
    }
    
    showEmptyState() {
        if (this.elements.slider) {
            this.elements.slider.innerHTML = `
                <div class="empty-state">
                    <p>No testimonials available yet.</p>
                    <p>Be the first to share your experience!</p>
                </div>
            `;
        }
    }
    
    showDatabaseError(message = 'Database error. Check logs.') {
        if (this.elements.slider) {
            this.elements.slider.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 2rem; color: #e74c3c;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                    <h3 style="margin-bottom: 1rem; color: #e74c3c;">Database Connection Error</h3>
                    <p style="margin-bottom: 0.5rem;">${this.escapeHtml(message)}</p>
                    <p style="font-size: 0.9rem; opacity: 0.8;">Please check the server logs for more details.</p>
                </div>
            `;
        }
        
        // Hide navigation buttons when there's an error
        if (this.elements.prevButton) this.elements.prevButton.style.display = 'none';
        if (this.elements.nextButton) this.elements.nextButton.style.display = 'none';
    }
    
    generateStars(rating) {
        const fullStars = '★'.repeat(Math.floor(rating));
        const emptyStars = '☆'.repeat(5 - Math.floor(rating));
        return fullStars + emptyStars;
    }
    
    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    updateSliderPosition() {
        if (!this.elements.slider || this.testimonials.length === 0) return;
        
        const card = this.elements.slider.querySelector('.testimonial-card');
        if (!card) return;
        
        const cardWidth = card.offsetWidth + 20; // Account for gap
        this.elements.slider.scrollTo({
            left: this.currentTestimonial * cardWidth,
            behavior: 'smooth'
        });
    }
    
    showNextTestimonial() {
        const maxIndex = Math.max(0, this.testimonials.length - this.numVisibleCards);
        
        if (this.currentTestimonial < maxIndex) {
            this.currentTestimonial++;
        } else {
            this.currentTestimonial = 0; // Loop back to start
        }
        
        this.updateSliderPosition();
        this.updateNavigationButtons();
    }
    
    showPrevTestimonial() {
        if (this.currentTestimonial > 0) {
            this.currentTestimonial--;
        } else {
            this.currentTestimonial = Math.max(0, this.testimonials.length - this.numVisibleCards);
        }
        
        this.updateSliderPosition();
        this.updateNavigationButtons();
    }
    
    updateNavigationButtons() {
        const maxIndex = Math.max(0, this.testimonials.length - this.numVisibleCards);
        
        if (this.elements.prevButton) {
            this.elements.prevButton.disabled = this.testimonials.length <= this.numVisibleCards;
        }
        
        if (this.elements.nextButton) {
            this.elements.nextButton.disabled = this.testimonials.length <= this.numVisibleCards;
        }
    }
    
    startAutoSlide() {
        this.stopAutoSlide();
        
        if (this.testimonials.length > this.numVisibleCards) {
            this.autoSlideTimer = setInterval(() => {
                this.showNextTestimonial();
            }, this.autoSlideInterval);
        }
    }
    
    stopAutoSlide() {
        if (this.autoSlideTimer) {
            clearInterval(this.autoSlideTimer);
            this.autoSlideTimer = null;
        }
    }
    
    pauseAutoSlide() {
        this.stopAutoSlide();
    }
    
    resumeAutoSlide() {
        this.startAutoSlide();
    }
    
    toggleForm() {
        if (!this.elements.formContainer) return;
        
        const isHidden = this.elements.formContainer.classList.contains('hidden');
        
        if (isHidden) {
            this.elements.formContainer.classList.remove('hidden');
            this.elements.addButton.textContent = 'Cancel';
            this.elements.addButton.setAttribute('aria-expanded', 'true');
        } else {
            this.elements.formContainer.classList.add('hidden');
            this.elements.addButton.textContent = 'Add Your Testimonial';
            this.elements.addButton.setAttribute('aria-expanded', 'false');
        }
    }
    
    async handleFormSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(this.elements.form);
        const submitButton = this.elements.form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        // Show loading state
        submitButton.textContent = 'Submitting...';
        submitButton.disabled = true;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/add_testimonial.php`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Thank you for your testimonial! It has been submitted successfully.');
                this.elements.form.reset();
                this.toggleForm();
                this.fetchTestimonials(); // Refresh testimonials
            } else {
                alert(data.message || 'Failed to submit testimonial. Please try again.');
            }
            
        } catch (error) {
            console.error('Testimonial submission error:', error);
            alert('An unexpected error occurred. Please try again later.');
        } finally {
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }
}

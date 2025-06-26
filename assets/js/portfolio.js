document.addEventListener('DOMContentLoaded', function () {
    // Initialize education items animation
    initializeEducationAnimation();
    
    // Initialize scroll animations
    initializeScrollAnimations();
    
    // Initialize contact form
    initializeContactForm();
});

/**
 * Initialize education items animation
 */
function initializeEducationAnimation() {
    const educationItems = document.querySelectorAll('.education-item');
    educationItems.forEach((item, index) => {
        item.style.setProperty('--item-index', index);
    });
}

/**
 * Initialize scroll-based animations
 */
function initializeScrollAnimations() {
    const animateOnScroll = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        threshold: 0.1
    });

    animateOnScroll.forEach(item => {
        observer.observe(item);
    });
}

/**
 * Initialize contact form with enhanced functionality
 */
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    const responseMessage = document.getElementById('responseMessage');
    const submitButton = contactForm.querySelector('button[type="submit"]');
    
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
}
// Testimonial functionality is now handled by the dedicated TestimonialSlider module
// in /assets/js/testimonials.js

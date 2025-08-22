/**
 * Contact Controller
 * 
 * Handles contact form submission with validation, error handling,
 * and user feedback. Includes security measures and accessibility features.
 * 
 * @author Brahim El Houss
 */

class ContactController {
    constructor(apiBaseUrl = './src/api') {
        this.apiBaseUrl = apiBaseUrl;
        this.form = document.getElementById('contactForm');
        this.submitButton = null;
        this.responseContainer = document.getElementById('responseMessage');
        this.isSubmitting = false;
        
        this.init();
    }

    /**
     * Initialize contact form functionality
     */
    init() {
        if (!this.form) {
            console.warn('[ContactController] Contact form not found');
            return;
        }

        this.submitButton = this.form.querySelector('button[type="submit"]');
        this.setupFormValidation();
        this.setupFormSubmission();
        this.setupFieldEvents();
        
        console.debug('[ContactController] Initialized');
    }

    /**
     * Setup form validation
     */
    setupFormValidation() {
        const fields = this.form.querySelectorAll('input, textarea');
        
        fields.forEach(field => {
            // Real-time validation on blur
            field.addEventListener('blur', () => this.validateField(field));
            
            // Clear errors on input
            field.addEventListener('input', () => this.clearFieldError(field));
        });
    }

    /**
     * Setup form submission handling
     */
    setupFormSubmission() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (this.isSubmitting) {
                console.debug('[ContactController] Form already submitting');
                return;
            }

            this.handleFormSubmission();
        });
    }

    /**
     * Setup field events for better UX
     */
    setupFieldEvents() {
        const fields = this.form.querySelectorAll('input, textarea');
        
        fields.forEach(field => {
            // Add focus/blur effects
            field.addEventListener('focus', () => {
                field.parentElement.classList.add('focused');
            });
            
            field.addEventListener('blur', () => {
                field.parentElement.classList.remove('focused');
                
                // Add filled class if field has value
                if (field.value.trim()) {
                    field.parentElement.classList.add('filled');
                } else {
                    field.parentElement.classList.remove('filled');
                }
            });

            // Initial state check
            if (field.value.trim()) {
                field.parentElement.classList.add('filled');
            }
        });
    }

    /**
     * Handle form submission
     */
    async handleFormSubmission() {
        try {
            this.isSubmitting = true;
            this.setSubmitButtonState(true);
            this.clearAllErrors();

            // Validate all fields
            if (!this.validateForm()) {
                this.showMessage('Please correct the errors below.', 'error');
                return;
            }

            // Prepare form data
            const formData = new FormData(this.form);
            const endpoint = this.form.action && this.form.action !== '#' 
                ? this.form.action 
                : `${this.apiBaseUrl}/contact.php`;

            // Submit form
            const response = await this.submitForm(endpoint, formData);
            await this.handleResponse(response);

        } catch (error) {
            console.error('[ContactController] Form submission error:', error);
            this.showMessage(
                error.message || 'An unexpected error occurred. Please try again.',
                'error'
            );
        } finally {
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
        }
    }

    /**
     * Submit form data to server
     */
    async submitForm(endpoint, formData) {
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`Network error: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('[ContactController] Invalid JSON response:', text);
            throw new Error('Invalid server response. Please try again later.');
        }
    }

    /**
     * Handle server response
     */
    async handleResponse(data) {
        if (data.success) {
            this.showMessage(
                data.message || 'Message sent successfully! I\'ll get back to you soon.',
                'success'
            );
            this.form.reset();
            this.clearAllFilledStates();
            
            // Focus first field for better UX
            const firstField = this.form.querySelector('input, textarea');
            if (firstField) firstField.focus();
            
        } else {
            // Handle field-specific errors
            if (data.errors) {
                this.displayFieldErrors(data.errors);
            }
            
            this.showMessage(
                data.message || 'Failed to send message. Please check your input and try again.',
                'error'
            );
        }
    }

    /**
     * Validate entire form
     */
    validateForm() {
        const fields = this.form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let message = '';

        // Required field validation
        if (field.required && !value) {
            isValid = false;
            message = 'This field is required.';
        }
        // Email validation
        else if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'Please enter a valid email address.';
            }
        }
        // Name validation
        else if (fieldName === 'name' && value) {
            if (value.length < 2) {
                isValid = false;
                message = 'Name must be at least 2 characters long.';
            }
        }
        // Message validation
        else if (fieldName === 'message' && value) {
            if (value.length < 10) {
                isValid = false;
                message = 'Message must be at least 10 characters long.';
            }
        }

        if (!isValid) {
            this.setFieldError(field, message);
        } else {
            this.clearFieldError(field);
        }

        return isValid;
    }

    /**
     * Set field error state
     */
    setFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.add('error');
        
        // Remove existing error message
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
        formGroup.appendChild(errorElement);

        // Focus field for accessibility
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', 'error-' + field.name);
        errorElement.id = 'error-' + field.name;
    }

    /**
     * Clear field error state
     */
    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.remove('error');
        
        const errorMessage = formGroup.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }

        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
    }

    /**
     * Clear all field errors
     */
    clearAllErrors() {
        const errorFields = this.form.querySelectorAll('.form-group.error');
        errorFields.forEach(formGroup => {
            const field = formGroup.querySelector('input, textarea');
            if (field) {
                this.clearFieldError(field);
            }
        });
    }

    /**
     * Clear all filled states
     */
    clearAllFilledStates() {
        const formGroups = this.form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('filled', 'focused');
        });
    }

    /**
     * Display field-specific errors from server
     */
    displayFieldErrors(errors) {
        Object.keys(errors).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                this.setFieldError(field, errors[fieldName]);
            }
        });
    }

    /**
     * Set submit button state
     */
    setSubmitButtonState(isLoading) {
        if (!this.submitButton) return;

        if (isLoading) {
            this.submitButton.disabled = true;
            this.submitButton.classList.add('loading');
            
            const originalText = this.submitButton.querySelector('span');
            if (originalText) {
                this.originalButtonText = originalText.textContent;
                originalText.textContent = 'Sending...';
            }
        } else {
            this.submitButton.disabled = false;
            this.submitButton.classList.remove('loading');
            
            const buttonText = this.submitButton.querySelector('span');
            if (buttonText && this.originalButtonText) {
                buttonText.textContent = this.originalButtonText;
            }
        }
    }

    /**
     * Show message to user
     */
    showMessage(message, type = 'info') {
        if (this.responseContainer) {
            this.responseContainer.textContent = message;
            this.responseContainer.className = `response-message response-message--${type}`;
            this.responseContainer.style.display = 'block';
            this.responseContainer.setAttribute('role', 'alert');

            // Auto-hide success messages
            if (type === 'success') {
                setTimeout(() => {
                    this.responseContainer.style.display = 'none';
                }, 5000);
            }
        } else {
            // Fallback to animation controller notification
            const animationController = window.portfolioApp?.getModule('animations');
            if (animationController && typeof animationController.showNotification === 'function') {
                animationController.showNotification(message, type);
            } else {
                // Final fallback to console
                console.info(`[ContactController] ${type.toUpperCase()}: ${message}`);
            }
        }
    }

    /**
     * Get form data as object
     */
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    /**
     * Reset form
     */
    resetForm() {
        this.form.reset();
        this.clearAllErrors();
        this.clearAllFilledStates();
    }
}

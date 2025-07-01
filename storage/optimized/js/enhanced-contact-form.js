/**
 * Enhanced Contact Form Manager
 * 
 * Provides advanced contact form functionality with validation,
 * accessibility, security features, and better user experience.
 */

class ContactManager {
    constructor(config) {
        this.config = config;
        this.form = null;
        this.submitButton = null;
        this.responseContainer = null;
        this.isSubmitting = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.validators = new Map();
        this.originalButtonText = '';
        
        this.init();
    }
    
    init() {
        this.form = document.getElementById('contactForm');
        if (!this.form) {
            console.warn('[ContactManager] Contact form not found');
            return;
        }
        
        this.submitButton = this.form.querySelector('button[type="submit"], input[type="submit"]');
        this.responseContainer = document.getElementById('contactResponse') || this.createResponseContainer();
        
        if (this.submitButton) {
            this.originalButtonText = this.submitButton.textContent || this.submitButton.value;
        }
        
        this.setupFormValidation();
        this.setupEventListeners();
        this.setupAccessibility();
        this.addHoneypot();
        
        console.debug('[ContactManager] Contact form initialized');
    }
    
    createResponseContainer() {
        const container = document.createElement('div');
        container.id = 'contactResponse';
        container.className = 'contact-response';
        container.setAttribute('aria-live', 'polite');
        this.form.insertBefore(container, this.form.firstChild);
        return container;
    }
    
    setupFormValidation() {
        // Email validation
        this.validators.set('email', {
            validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: 'Please enter a valid email address'
        });
        
        // Name validation
        this.validators.set('name', {
            validate: (value) => value.trim().length >= 2 && value.trim().length <= 100,
            message: 'Name must be between 2 and 100 characters'
        });
        
        // Message validation
        this.validators.set('message', {
            validate: (value) => value.trim().length >= 10 && value.trim().length <= 2000,
            message: 'Message must be between 10 and 2000 characters'
        });
        
        // Phone validation (optional)
        this.validators.set('phone', {
            validate: (value) => !value || /^\+?[\d\s\-\(\)]{10,}$/.test(value),
            message: 'Please enter a valid phone number'
        });
    }
    
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Real-time validation
        this.form.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });
        
        // Character counters
        this.form.querySelectorAll('textarea[maxlength]').forEach(textarea => {
            this.addCharacterCounter(textarea);
        });
        
        // Auto-resize textareas
        this.form.querySelectorAll('textarea').forEach(textarea => {
            this.setupAutoResize(textarea);
        });
    }
    
    setupAccessibility() {
        // Add proper labels and ARIA attributes
        this.form.querySelectorAll('input, textarea, select').forEach(field => {
            const label = this.form.querySelector(`label[for="${field.id}"]`);
            if (!label && field.id) {
                // Create label if it doesn't exist
                const labelElement = document.createElement('label');
                labelElement.setAttribute('for', field.id);
                labelElement.textContent = field.getAttribute('placeholder') || field.name;
                field.parentNode.insertBefore(labelElement, field);
            }
            
            // Add ARIA attributes
            field.setAttribute('aria-invalid', 'false');
            if (field.hasAttribute('required')) {
                field.setAttribute('aria-required', 'true');
            }
        });
        
        // Add form description
        const description = document.createElement('div');
        description.id = 'contact-form-description';
        description.className = 'sr-only';
        description.textContent = 'Contact form with required fields for name, email, and message';
        this.form.insertBefore(description, this.form.firstChild);
        this.form.setAttribute('aria-describedby', 'contact-form-description');
    }
    
    addHoneypot() {
        // Add honeypot field for bot detection
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = 'website';
        honeypot.id = 'website';
        honeypot.setAttribute('autocomplete', 'off');
        honeypot.setAttribute('tabindex', '-1');
        honeypot.style.cssText = 'position: absolute; left: -9999px; opacity: 0;';
        honeypot.setAttribute('aria-hidden', 'true');
        
        const label = document.createElement('label');
        label.setAttribute('for', 'website');
        label.textContent = 'Website (leave blank)';
        label.style.cssText = 'position: absolute; left: -9999px; opacity: 0;';
        
        this.form.appendChild(label);
        this.form.appendChild(honeypot);
    }
    
    addCharacterCounter(textarea) {
        const maxLength = parseInt(textarea.getAttribute('maxlength'));
        if (!maxLength) return;
        
        const counter = document.createElement('div');
        counter.className = 'character-counter';
        counter.setAttribute('aria-live', 'polite');
        
        const updateCounter = () => {
            const remaining = maxLength - textarea.value.length;
            counter.textContent = `${remaining} characters remaining`;
            counter.classList.toggle('warning', remaining < 50);
        };
        
        textarea.addEventListener('input', updateCounter);
        textarea.parentNode.appendChild(counter);
        updateCounter();
    }
    
    setupAutoResize(textarea) {
        const resize = () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };
        
        textarea.addEventListener('input', resize);
        textarea.addEventListener('focus', resize);
        
        // Initial resize
        resize();
    }
    
    async handleSubmit(event) {
        event.preventDefault();
        
        if (this.isSubmitting) {
            console.debug('[ContactManager] Form already submitting');
            return;
        }
        
        // Clear previous messages
        this.clearMessages();
        
        // Validate form
        const validation = this.validateForm();
        if (!validation.isValid) {
            this.displayValidationErrors(validation.errors);
            this.focusFirstError();
            return;
        }
        
        // Check honeypot
        const honeypot = this.form.querySelector('input[name="website"]');
        if (honeypot && honeypot.value) {
            console.warn('[ContactManager] Bot detected via honeypot');
            this.showMessage('Please try again.', 'error');
            return;
        }
        
        await this.submitForm();
    }
    
    validateForm() {
        const errors = new Map();
        const formData = new FormData(this.form);
        
        // Validate each field
        for (const [fieldName, validator] of this.validators) {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (!field) continue;
            
            const value = formData.get(fieldName) || '';
            const isRequired = field.hasAttribute('required');
            
            if (isRequired && !value.trim()) {
                errors.set(fieldName, `${this.getFieldLabel(field)} is required`);
                continue;
            }
            
            if (value && !validator.validate(value)) {
                errors.set(fieldName, validator.message);
            }
        }
        
        return {
            isValid: errors.size === 0,
            errors
        };
    }
    
    validateField(field) {
        const validator = this.validators.get(field.name);
        if (!validator) return true;
        
        const value = field.value;
        const isRequired = field.hasAttribute('required');
        
        if (isRequired && !value.trim()) {
            this.showFieldError(field, `${this.getFieldLabel(field)} is required`);
            return false;
        }
        
        if (value && !validator.validate(value)) {
            this.showFieldError(field, validator.message);
            return false;
        }
        
        this.clearFieldError(field);
        return true;
    }
    
    getFieldLabel(field) {
        const label = this.form.querySelector(`label[for="${field.id}"]`);
        return label ? label.textContent.replace('*', '').trim() : field.name;
    }
    
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
        
        field.classList.add('error');
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', `${field.id}-error`);
        errorElement.id = `${field.id}-error`;
        
        field.parentNode.appendChild(errorElement);
    }
    
    clearFieldError(field) {
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
        
        field.classList.remove('error');
        field.setAttribute('aria-invalid', 'false');
        field.removeAttribute('aria-describedby');
    }
    
    displayValidationErrors(errors) {
        const errorList = document.createElement('ul');
        errorList.className = 'validation-errors';
        errorList.setAttribute('role', 'alert');
        
        for (const [fieldName, message] of errors) {
            const listItem = document.createElement('li');
            listItem.textContent = message;
            errorList.appendChild(listItem);
            
            // Highlight the field
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                this.showFieldError(field, message);
            }
        }
        
        this.responseContainer.appendChild(errorList);
    }
    
    focusFirstError() {
        const firstErrorField = this.form.querySelector('.error');
        if (firstErrorField) {
            firstErrorField.focus();
        }
    }
    
    async submitForm() {
        this.isSubmitting = true;
        this.updateSubmitButton('Sending...', true);
        
        try {
            const formData = new FormData(this.form);
            
            // Add timestamp and session info for additional security
            formData.append('timestamp', Date.now().toString());
            formData.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
            
            const endpoint = this.form.action || `${this.config.apiBaseUrl}/contact.php`;
            
            const response = await this.fetchWithTimeout(endpoint, {
                method: 'POST',
                body: formData
            }, 30000); // 30 second timeout
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid response format from server');
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `Server error: ${response.status}`);
            }
            
            this.handleSubmitSuccess(data);
            
        } catch (error) {
            this.handleSubmitError(error);
        } finally {
            this.isSubmitting = false;
            this.updateSubmitButton(this.originalButtonText, false);
        }
    }
    
    async fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            throw error;
        }
    }
    
    handleSubmitSuccess(data) {
        this.retryCount = 0;
        
        this.showMessage(data.message || 'Thank you! Your message has been sent successfully.', 'success');
        
        // Reset form
        this.form.reset();
        
                // Reset textareas to original height
                this.form.querySelectorAll('textarea').forEach(textarea => {
                    textarea.style.height = 'auto';
                });
        
                // Update character counters
                this.form.querySelectorAll('.character-counter').forEach(counter => {
                    const textarea = counter.parentNode.querySelector('textarea[maxlength]');
                    if (textarea) {
                        const maxLength = parseInt(textarea.getAttribute('maxlength'));
                        counter.textContent = `${maxLength} characters remaining`;
                        counter.classList.remove('warning');
                    }
                });
        
                // Analytics tracking (if available)
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_submit', {
                        'event_category': 'engagement',
                        'event_label': 'contact_form'
                    });
                }
        
                console.debug('[ContactManager] Form submitted successfully');
            }
        
            handleSubmitError(error) {
                console.error('[ContactManager] Form submission error:', error);
        
                let message = 'Sorry, there was a problem sending your message. Please try again.';
        
                // Handle specific error types
                if (error.message.includes('timeout')) {
                    message = 'The request timed out. Please check your connection and try again.';
                } else if (error.message.includes('Failed to fetch')) {
                    message = 'Unable to connect to the server. Please check your internet connection.';
                } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
                    message = 'You\'ve sent too many messages. Please wait a moment before trying again.';
                } else if (error.message) {
                    message = error.message;
                }
        
                this.showMessage(message, 'error');
        
                // Retry logic for transient errors
                if (this.shouldRetry(error) && this.retryCount < this.maxRetries) {
                    this.scheduleRetry();
                }
            }
        
            shouldRetry(error) {
                const retryableErrors = [
                    'timeout',
                    'Failed to fetch',
                    'Network error',
                    '500',
                    '502',
                    '503',
                    '504'
                ];
        
                return retryableErrors.some(errorType =>
                    error.message.toLowerCase().includes(errorType.toLowerCase())
                );
            }
        
            scheduleRetry() {
                this.retryCount++;
                const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
        
                this.showMessage(
                    `Retrying in ${delay / 1000} seconds... (Attempt ${this.retryCount}/${this.maxRetries})`,
                    'info'
                );
        
                setTimeout(() => {
                    this.submitForm();
                }, delay);
            }
        
            updateSubmitButton(text, disabled) {
                if (!this.submitButton) return;
        
                if (this.submitButton.tagName === 'BUTTON') {
                    this.submitButton.textContent = text;
                } else {
                    this.submitButton.value = text;
                }
        
                this.submitButton.disabled = disabled;
                this.submitButton.classList.toggle('loading', disabled);
                this.submitButton.setAttribute('aria-busy', disabled.toString());
            }
        
            showMessage(message, type) {
                this.clearMessages();
        
                const messageElement = document.createElement('div');
                messageElement.className = `contact-message contact-message--${type}`;
                messageElement.setAttribute('role', type === 'error' ? 'alert' : 'status');
                messageElement.setAttribute('aria-live', 'polite');
        
                const icon = this.getMessageIcon(type);
                messageElement.innerHTML = `
                    <span class="contact-message__icon">${icon}</span>
                    <span class="contact-message__text">${message}</span>
                `;
        
                this.responseContainer.appendChild(messageElement);
        
                // Scroll message into view
                messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
                // Auto-hide success messages
                if (type === 'success') {
                    setTimeout(() => {
                        if (messageElement.parentNode) {
                            messageElement.remove();
                        }
                    }, 5000);
                }
            }
        
            getMessageIcon(type) {
                const icons = {
                    success: '✅',
                    error: '❌',
                    warning: '⚠️',
                    info: 'ℹ️'
                };
                return icons[type] || icons.info;
            }
        
            clearMessages() {
                this.responseContainer.innerHTML = '';
        
                // Clear field errors
                this.form.querySelectorAll('.field-error').forEach(error => error.remove());
                this.form.querySelectorAll('.error').forEach(field => {
                    field.classList.remove('error');
                    field.setAttribute('aria-invalid', 'false');
                    field.removeAttribute('aria-describedby');
                });
            }
        
            // Public API methods
            reset() {
                this.form.reset();
                this.clearMessages();
                this.retryCount = 0;
            }
        
            disable() {
                this.form.querySelectorAll('input, textarea, select, button').forEach(field => {
                    field.disabled = true;
                });
            }
        
            enable() {
                this.form.querySelectorAll('input, textarea, select, button').forEach(field => {
                    field.disabled = false;
                });
            }
        
            setFieldValue(fieldName, value) {
                const field = this.form.querySelector(`[name="${fieldName}"]`);
                if (field) {
                    field.value = value;
                    this.validateField(field);
                }
            }
        
            getFieldValue(fieldName) {
                const field = this.form.querySelector(`[name="${fieldName}"]`);
                return field ? field.value : null;
            }
        }
        
        // CSS for enhanced contact form styling
        const contactFormStyles = `
            .contact-response {
                margin-bottom: 1rem;
            }
            
            .contact-message {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                border-radius: 0.375rem;
                margin-bottom: 0.5rem;
                font-weight: 500;
            }
            
            .contact-message--success {
                background-color: #dcfce7;
                color: #166534;
                border: 1px solid #bbf7d0;
            }
            
            .contact-message--error {
                background-color: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
            }
            
            .contact-message--warning {
                background-color: #fefce8;
                color: #a16207;
                border: 1px solid #fde68a;
            }
            
            .contact-message--info {
                background-color: #eff6ff;
                color: #1d4ed8;
                border: 1px solid #dbeafe;
            }
            
            .field-error {
                color: #dc2626;
                font-size: 0.875rem;
                margin-top: 0.25rem;
            }
            
            .error {
                border-color: #dc2626 !important;
                box-shadow: 0 0 0 1px #dc2626 !important;
            }
            
            .character-counter {
                font-size: 0.75rem;
                color: #6b7280;
                text-align: right;
                margin-top: 0.25rem;
            }
            
            .character-counter.warning {
                color: #dc2626;
                font-weight: 600;
            }
            
            .validation-errors {
                background-color: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 0.375rem;
                padding: 1rem;
                margin-bottom: 1rem;
                list-style-type: disc;
                list-style-position: inside;
            }
            
            .validation-errors li {
                color: #dc2626;
                margin-bottom: 0.25rem;
            }
            
            button.loading {
                opacity: 0.7;
                cursor: not-allowed;
                position: relative;
            }
            
            button.loading::after {
                content: '';
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                width: 16px;
                height: 16px;
                border: 2px solid transparent;
                border-top: 2px solid currentColor;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: translateY(-50%) rotate(0deg); }
                100% { transform: translateY(-50%) rotate(360deg); }
            }
            
            textarea {
                resize: vertical;
                min-height: 100px;
                transition: height 0.2s ease;
            }
        `;
        
        // Inject contact form styles
        if (!document.getElementById('contact-form-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'contact-form-styles';
            styleSheet.textContent = contactFormStyles;
            document.head.appendChild(styleSheet);
        }

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
        
        // Reset textareas to original height\n        this.form.querySelectorAll('textarea').forEach(textarea => {\n            textarea.style.height = 'auto';\n        });\n        \n        // Update character counters\n        this.form.querySelectorAll('.character-counter').forEach(counter => {\n            const textarea = counter.parentNode.querySelector('textarea[maxlength]');\n            if (textarea) {\n                const maxLength = parseInt(textarea.getAttribute('maxlength'));\n                counter.textContent = `${maxLength} characters remaining`;\n                counter.classList.remove('warning');\n            }\n        });\n        \n        // Analytics tracking (if available)\n        if (typeof gtag !== 'undefined') {\n            gtag('event', 'form_submit', {\n                'event_category': 'engagement',\n                'event_label': 'contact_form'\n            });\n        }\n        \n        console.debug('[ContactManager] Form submitted successfully');\n    }\n    \n    handleSubmitError(error) {\n        console.error('[ContactManager] Form submission error:', error);\n        \n        let message = 'Sorry, there was a problem sending your message. Please try again.';\n        \n        // Handle specific error types\n        if (error.message.includes('timeout')) {\n            message = 'The request timed out. Please check your connection and try again.';\n        } else if (error.message.includes('Failed to fetch')) {\n            message = 'Unable to connect to the server. Please check your internet connection.';\n        } else if (error.message.includes('rate limit') || error.message.includes('too many')) {\n            message = 'You\\'ve sent too many messages. Please wait a moment before trying again.';\n        } else if (error.message) {\n            message = error.message;\n        }\n        \n        this.showMessage(message, 'error');\n        \n        // Retry logic for transient errors\n        if (this.shouldRetry(error) && this.retryCount < this.maxRetries) {\n            this.scheduleRetry();\n        }\n    }\n    \n    shouldRetry(error) {\n        const retryableErrors = [\n            'timeout',\n            'Failed to fetch',\n            'Network error',\n            '500',\n            '502',\n            '503',\n            '504'\n        ];\n        \n        return retryableErrors.some(errorType => \n            error.message.toLowerCase().includes(errorType.toLowerCase())\n        );\n    }\n    \n    scheduleRetry() {\n        this.retryCount++;\n        const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff\n        \n        this.showMessage(\n            `Retrying in ${delay / 1000} seconds... (Attempt ${this.retryCount}/${this.maxRetries})`,\n            'info'\n        );\n        \n        setTimeout(() => {\n            this.submitForm();\n        }, delay);\n    }\n    \n    updateSubmitButton(text, disabled) {\n        if (!this.submitButton) return;\n        \n        if (this.submitButton.tagName === 'BUTTON') {\n            this.submitButton.textContent = text;\n        } else {\n            this.submitButton.value = text;\n        }\n        \n        this.submitButton.disabled = disabled;\n        this.submitButton.classList.toggle('loading', disabled);\n        this.submitButton.setAttribute('aria-busy', disabled.toString());\n    }\n    \n    showMessage(message, type) {\n        this.clearMessages();\n        \n        const messageElement = document.createElement('div');\n        messageElement.className = `contact-message contact-message--${type}`;\n        messageElement.setAttribute('role', type === 'error' ? 'alert' : 'status');\n        messageElement.setAttribute('aria-live', 'polite');\n        \n        const icon = this.getMessageIcon(type);\n        messageElement.innerHTML = `\n            <span class=\"contact-message__icon\">${icon}</span>\n            <span class=\"contact-message__text\">${message}</span>\n        `;\n        \n        this.responseContainer.appendChild(messageElement);\n        \n        // Scroll message into view\n        messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });\n        \n        // Auto-hide success messages\n        if (type === 'success') {\n            setTimeout(() => {\n                if (messageElement.parentNode) {\n                    messageElement.remove();\n                }\n            }, 5000);\n        }\n    }\n    \n    getMessageIcon(type) {\n        const icons = {\n            success: '✅',\n            error: '❌',\n            warning: '⚠️',\n            info: 'ℹ️'\n        };\n        return icons[type] || icons.info;\n    }\n    \n    clearMessages() {\n        this.responseContainer.innerHTML = '';\n        \n        // Clear field errors\n        this.form.querySelectorAll('.field-error').forEach(error => error.remove());\n        this.form.querySelectorAll('.error').forEach(field => {\n            field.classList.remove('error');\n            field.setAttribute('aria-invalid', 'false');\n            field.removeAttribute('aria-describedby');\n        });\n    }\n    \n    // Public API methods\n    reset() {\n        this.form.reset();\n        this.clearMessages();\n        this.retryCount = 0;\n    }\n    \n    disable() {\n        this.form.querySelectorAll('input, textarea, select, button').forEach(field => {\n            field.disabled = true;\n        });\n    }\n    \n    enable() {\n        this.form.querySelectorAll('input, textarea, select, button').forEach(field => {\n            field.disabled = false;\n        });\n    }\n    \n    setFieldValue(fieldName, value) {\n        const field = this.form.querySelector(`[name=\"${fieldName}\"]`);\n        if (field) {\n            field.value = value;\n            this.validateField(field);\n        }\n    }\n    \n    getFieldValue(fieldName) {\n        const field = this.form.querySelector(`[name=\"${fieldName}\"]`);\n        return field ? field.value : null;\n    }\n}\n\n// CSS for enhanced contact form styling\nconst contactFormStyles = `\n    .contact-response {\n        margin-bottom: 1rem;\n    }\n    \n    .contact-message {\n        display: flex;\n        align-items: center;\n        gap: 0.5rem;\n        padding: 0.75rem 1rem;\n        border-radius: 0.375rem;\n        margin-bottom: 0.5rem;\n        font-weight: 500;\n    }\n    \n    .contact-message--success {\n        background-color: #dcfce7;\n        color: #166534;\n        border: 1px solid #bbf7d0;\n    }\n    \n    .contact-message--error {\n        background-color: #fef2f2;\n        color: #dc2626;\n        border: 1px solid #fecaca;\n    }\n    \n    .contact-message--warning {\n        background-color: #fefce8;\n        color: #a16207;\n        border: 1px solid #fde68a;\n    }\n    \n    .contact-message--info {\n        background-color: #eff6ff;\n        color: #1d4ed8;\n        border: 1px solid #dbeafe;\n    }\n    \n    .field-error {\n        color: #dc2626;\n        font-size: 0.875rem;\n        margin-top: 0.25rem;\n    }\n    \n    .error {\n        border-color: #dc2626 !important;\n        box-shadow: 0 0 0 1px #dc2626 !important;\n    }\n    \n    .character-counter {\n        font-size: 0.75rem;\n        color: #6b7280;\n        text-align: right;\n        margin-top: 0.25rem;\n    }\n    \n    .character-counter.warning {\n        color: #dc2626;\n        font-weight: 600;\n    }\n    \n    .validation-errors {\n        background-color: #fef2f2;\n        border: 1px solid #fecaca;\n        border-radius: 0.375rem;\n        padding: 1rem;\n        margin-bottom: 1rem;\n        list-style-type: disc;\n        list-style-position: inside;\n    }\n    \n    .validation-errors li {\n        color: #dc2626;\n        margin-bottom: 0.25rem;\n    }\n    \n    button.loading {\n        opacity: 0.7;\n        cursor: not-allowed;\n        position: relative;\n    }\n    \n    button.loading::after {\n        content: '';\n        position: absolute;\n        right: 10px;\n        top: 50%;\n        transform: translateY(-50%);\n        width: 16px;\n        height: 16px;\n        border: 2px solid transparent;\n        border-top: 2px solid currentColor;\n        border-radius: 50%;\n        animation: spin 1s linear infinite;\n    }\n    \n    @keyframes spin {\n        0% { transform: translateY(-50%) rotate(0deg); }\n        100% { transform: translateY(-50%) rotate(360deg); }\n    }\n    \n    textarea {\n        resize: vertical;\n        min-height: 100px;\n        transition: height 0.2s ease;\n    }\n`;\n\n// Inject contact form styles\nif (!document.getElementById('contact-form-styles')) {\n    const styleSheet = document.createElement('style');\n    styleSheet.id = 'contact-form-styles';\n    styleSheet.textContent = contactFormStyles;\n    document.head.appendChild(styleSheet);\n}

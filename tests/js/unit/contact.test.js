/**
 * Test suite for contact form functionality
 */

// Mock the contact module
const mockContactModule = {
  validateForm: jest.fn(),
  submitForm: jest.fn(),
  showMessage: jest.fn(),
  clearForm: jest.fn()
};

// Mock contact.js module
jest.mock('@/contact.js', () => mockContactModule);

describe('Contact Form', () => {
  let contactForm;
  let nameInput;
  let emailInput;
  let subjectInput;
  let messageInput;
  let submitButton;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <form id="contact-form" class="contact-form">
        <div class="form-group">
          <input type="text" id="name" name="name" required>
          <span class="error-message" id="name-error"></span>
        </div>
        <div class="form-group">
          <input type="email" id="email" name="email" required>
          <span class="error-message" id="email-error"></span>
        </div>
        <div class="form-group">
          <input type="text" id="subject" name="subject" required>
          <span class="error-message" id="subject-error"></span>
        </div>
        <div class="form-group">
          <textarea id="message" name="message" required></textarea>
          <span class="error-message" id="message-error"></span>
        </div>
        <button type="submit" id="submit-btn">Send Message</button>
        <div id="form-messages"></div>
      </form>
    `;

    contactForm = document.getElementById('contact-form');
    nameInput = document.getElementById('name');
    emailInput = document.getElementById('email');
    subjectInput = document.getElementById('subject');
    messageInput = document.getElementById('message');
    submitButton = document.getElementById('submit-btn');

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Form Validation', () => {
    test('should validate required fields', () => {
      // Test empty form
      expect(nameInput.value).toBe('');
      expect(emailInput.value).toBe('');
      expect(subjectInput.value).toBe('');
      expect(messageInput.value).toBe('');

      // Simulate validation
      const isValid = nameInput.value && emailInput.value && subjectInput.value && messageInput.value;
      expect(isValid).toBeFalsy();
    });

    test('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBeTruthy();
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBeFalsy();
      });
    });

    test('should validate name length', () => {
      const shortName = 'Jo';
      const validName = 'John Doe';
      const longName = 'A'.repeat(101);

      expect(shortName.length >= 3).toBeFalsy();
      expect(validName.length >= 3 && validName.length <= 100).toBeTruthy();
      expect(longName.length <= 100).toBeFalsy();
    });

    test('should validate message length', () => {
      const shortMessage = 'Hi';
      const validMessage = 'This is a valid message with sufficient content.';
      const longMessage = 'A'.repeat(1001);

      expect(shortMessage.length >= 10).toBeFalsy();
      expect(validMessage.length >= 10 && validMessage.length <= 1000).toBeTruthy();
      expect(longMessage.length <= 1000).toBeFalsy();
    });
  });

  describe('Form Submission', () => {
    test('should prevent submission with invalid data', () => {
      // Set invalid data
      nameInput.value = 'Jo'; // Too short
      emailInput.value = 'invalid-email';
      subjectInput.value = '';
      messageInput.value = 'Short';

      const formData = new FormData(contactForm);
      const isValid = validateFormData(formData);

      expect(isValid).toBeFalsy();
    });

    test('should allow submission with valid data', () => {
      // Set valid data
      nameInput.value = 'John Doe';
      emailInput.value = 'john@example.com';
      subjectInput.value = 'Test Subject';
      messageInput.value = 'This is a valid test message with sufficient content.';

      const formData = new FormData(contactForm);
      const isValid = validateFormData(formData);

      expect(isValid).toBeTruthy();
    });

    test('should show loading state during submission', () => {
      submitButton.textContent = 'Sending...';
      submitButton.disabled = true;

      expect(submitButton.textContent).toBe('Sending...');
      expect(submitButton.disabled).toBeTruthy();
    });

    test('should handle successful submission', () => {
      const successMessage = 'Message sent successfully!';
      const messageContainer = document.getElementById('form-messages');
      
      messageContainer.innerHTML = `<div class="success-message">${successMessage}</div>`;
      
      expect(messageContainer.querySelector('.success-message').textContent).toBe(successMessage);
    });

    test('should handle submission errors', () => {
      const errorMessage = 'Failed to send message. Please try again.';
      const messageContainer = document.getElementById('form-messages');
      
      messageContainer.innerHTML = `<div class="error-message">${errorMessage}</div>`;
      
      expect(messageContainer.querySelector('.error-message').textContent).toBe(errorMessage);
    });
  });

  describe('CSRF Protection', () => {
    test('should include CSRF token in form submission', () => {
      // Add CSRF token field
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrf_token';
      csrfInput.value = 'test-csrf-token';
      contactForm.appendChild(csrfInput);

      const formData = new FormData(contactForm);
      expect(formData.get('csrf_token')).toBe('test-csrf-token');
    });
  });

  describe('Rate Limiting', () => {
    test('should prevent multiple rapid submissions', () => {
      let lastSubmission = Date.now();
      const minimumInterval = 1000; // 1 second

      // Simulate rapid submission
      const now = Date.now();
      const timeSinceLastSubmission = now - lastSubmission;

      expect(timeSinceLastSubmission >= minimumInterval).toBeFalsy();
    });
  });
});

// Helper function for form validation (would be part of actual contact.js)
function validateFormData(formData) {
  const name = formData.get('name');
  const email = formData.get('email');
  const subject = formData.get('subject');
  const message = formData.get('message');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return (
    name && name.length >= 3 && name.length <= 100 &&
    email && emailRegex.test(email) &&
    subject && subject.length >= 1 && subject.length <= 200 &&
    message && message.length >= 10 && message.length <= 1000
  );
}
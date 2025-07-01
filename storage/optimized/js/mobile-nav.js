/**
 * Mobile Navigation Handler
 * Handles the burger toggle for mobile navigation
 * Author: Brahim El Houss
 * Last updated: June 27, 2025
 */

(function() {
  'use strict';

  // DOM elements
  const navToggle = document.querySelector('.nav__toggle');
  const navMenu = document.querySelector('.nav__menu');
  const navLinks = document.querySelectorAll('.nav__link');
  const body = document.body;
  let isMenuOpen = false;

  // Initialize the mobile navigation
  function init() {
    if (!navToggle || !navMenu) return;
    
    // Toggle navigation when burger is clicked
    navToggle.addEventListener('click', toggleNavigation);
    
    // Close navigation when a link is clicked
    navLinks.forEach(link => {
      link.addEventListener('click', closeNavigation);
    });
    
    // Close navigation when clicking outside
    document.addEventListener('click', handleOutsideClick);
    
    // Close navigation on resize if screen becomes larger
    window.addEventListener('resize', handleResize);
    
    // Apply initial state
    updateAriaAttributes(false);
  }

  // Toggle the mobile navigation
  function toggleNavigation(e) {
    if (e) e.stopPropagation();
    
    isMenuOpen = !isMenuOpen;
    
    // Toggle the active class on the menu
    navMenu.classList.toggle('active');
    
    // Toggle the active class on the burger button
    navToggle.classList.toggle('active');
    
    // Toggle body scroll
    body.style.overflow = isMenuOpen ? 'hidden' : '';
    
    // Update ARIA attributes
    updateAriaAttributes(isMenuOpen);
    
    // Announce to screen readers
    announceMenuState(isMenuOpen);
  }

  // Close the mobile navigation
  function closeNavigation() {
    if (!isMenuOpen) return;
    
    isMenuOpen = false;
    
    // Remove the active class from the menu
    navMenu.classList.remove('active');
    
    // Remove the active class from the burger button
    navToggle.classList.remove('active');
    
    // Re-enable body scroll
    body.style.overflow = '';
    
    // Update ARIA attributes
    updateAriaAttributes(false);
  }

  // Handle clicks outside the navigation
  function handleOutsideClick(e) {
    if (!isMenuOpen) return;
    
    // Check if the click is outside the navigation and the toggle button
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
      closeNavigation();
    }
  }

  // Handle window resize events
  function handleResize() {
    // Close the navigation if the screen is wider than mobile breakpoint
    if (window.innerWidth >= 992 && isMenuOpen) {
      closeNavigation();
    }
  }

  // Update ARIA attributes for accessibility
  function updateAriaAttributes(isOpen) {
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');

    // Accessibility fix: If closing menu, move focus to navToggle before hiding
    if (!isOpen) {
      // If any nav__link inside navMenu has focus, move it to navToggle
      const focused = document.activeElement;
      if (navMenu.contains(focused)) {
        navToggle.focus();
      }
    }

    // Use inert attribute if supported, fallback to aria-hidden
    if ('inert' in navMenu) {
      navMenu.inert = !isOpen;
    }
    navMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    // Note: inert prevents focus and interaction, and is preferred for accessibility
    // See: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert
  }

  // Announce menu state to screen readers
  function announceMenuState(isOpen) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.classList.add('sr-only');
    announcement.textContent = isOpen ? 'Menu opened' : 'Menu closed';
    
    document.body.appendChild(announcement);
    
    // Remove the announcement after it's been read
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Add styles for burger toggle animation
  function addToggleStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .nav__toggle {
        display: none;
        flex-direction: column;
        justify-content: space-between;
        width: 30px;
        height: 21px;
        cursor: pointer;
        z-index: 1001;
        position: relative;
      }
      
      @media (max-width: 991px) {
        .nav__toggle {
          display: flex;
        }
      }
      
      .nav__toggle span {
        display: block;
        width: 100%;
        height: 3px;
        background-color: var(--text-primary);
        border-radius: 3px;
        transition: all 0.3s ease;
      }
      
      .nav__toggle.active span:nth-child(1) {
        transform: translateY(9px) rotate(45deg);
      }
      
      .nav__toggle.active span:nth-child(2) {
        opacity: 0;
      }
      
      .nav__toggle.active span:nth-child(3) {
        transform: translateY(-9px) rotate(-45deg);
      }
      
      [data-theme="dark"] .nav__toggle span {
        background-color: var(--text-primary);
      }
      
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
      
      @media (max-width: 991px) {
        .nav__menu {
          position: fixed;
          top: 70px;
          right: -100%;
          width: 100%;
          height: calc(100vh - 70px);
          background: var(--bg-overlay);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--spacing-xl) 0;
          transition: right 0.3s ease;
          overflow-y: auto;
          z-index: 1000;
        }
        
        .nav__menu.active {
          right: 0;
        }
        
        .nav__item {
          margin: var(--spacing-md) 0;
        }
        
        .nav__link {
          font-size: 1.2rem;
          padding: var(--spacing-sm) var(--spacing-lg);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Run initialization when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    addToggleStyles();
    init();
  });
})();

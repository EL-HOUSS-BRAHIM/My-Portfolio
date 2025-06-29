/**
 * Viewport Handler
 * 
 * This script handles various functionality related to viewport sizing and scrolling:
 * - Makes the hero section fit perfectly in the viewport
 * - Handles the scroll indicator functionality
 * - Adjusts the layout on resize
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get relevant elements
    const hero = document.querySelector('.hero');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const aboutSection = document.getElementById('about');
    
    // Add click event to scroll indicator
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            aboutSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Function to adjust viewport height
    function adjustViewportHeight() {
        // Get viewport height
        const viewportHeight = window.innerHeight;
        // Get header height
        const headerHeight = document.querySelector('header').offsetHeight;
        
        // Set hero height to fill viewport minus header
        if (hero) {
            hero.style.height = `${viewportHeight - headerHeight}px`;
            hero.style.minHeight = `${viewportHeight - headerHeight}px`;
        }
    }
    
    // Adjust on page load
    adjustViewportHeight();
    
    // Adjust on window resize
    window.addEventListener('resize', adjustViewportHeight);
    
    // Handle scroll behavior
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;
        
        // Fade out scroll indicator as user scrolls down
        if (scrollIndicator) {
            if (scrollPosition > 50) {
                scrollIndicator.style.opacity = Math.max(0, 1 - scrollPosition / 200);
            } else {
                scrollIndicator.style.opacity = 1;
            }
        }
    });
    
    // Ensure content below hero is properly positioned
    if (aboutSection) {
        aboutSection.style.marginTop = '0';
    }
    
    // Add scroll progress indicator
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;
        const totalHeight = document.body.scrollHeight - window.innerHeight;
        const progress = (scrollPosition / totalHeight) * 100;
        
        progressBar.style.width = `${progress}%`;
    });
});

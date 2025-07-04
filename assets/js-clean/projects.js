/**
 * Project Controller
 * 
 * Handles project filtering, image loading, and hover effects
 * with smooth animations and performance optimization.
 * 
 * @author Brahim El Houss
 */

class ProjectController {
    constructor() {
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.projectCards = document.querySelectorAll('.project-card');
        this.activeFilter = 'all';
        
        this.init();
    }

    /**
     * Initialize project functionality
     */
    init() {
        if (!this.filterButtons.length || !this.projectCards.length) {
            console.warn('[ProjectController] Filter buttons or project cards not found');
            return;
        }

        this.setupFilters();
        this.setupImageLoading();
        this.setupHoverEffects();
        this.setupEntranceAnimations();
        
        console.debug('[ProjectController] Initialized');
    }

    /**
     * Setup project filtering functionality
     */
    setupFilters() {
        // Set initial active state
        const defaultActive = this.filterButtons[0];
        if (defaultActive) {
            defaultActive.classList.add('active');
        }

        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterClick(e, btn));
        });
    }

    /**
     * Handle filter button click
     */
    handleFilterClick(e, button) {
        e.preventDefault();
        
        const filter = button.dataset.filter;
        if (filter === this.activeFilter) return;

        // Update active button
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Filter projects
        this.filterProjects(filter);
        this.activeFilter = filter;

        console.debug(`[ProjectController] Filter applied: ${filter}`);
    }

    /**
     * Filter projects with smooth animations
     */
    filterProjects(filter) {
        this.projectCards.forEach((card, index) => {
            const category = card.dataset.category;
            const shouldShow = filter === 'all' || category === filter;

            if (shouldShow) {
                // Show card
                card.style.display = 'block';
                card.style.order = index; // Maintain original order
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0) scale(1)';
                }, 50 * index); // Staggered animation
            } else {
                // Hide card
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px) scale(0.95)';
                
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    }

    /**
     * Setup image loading with placeholders and error handling
     */
    setupImageLoading() {
        const placeholder = this.createPlaceholderSVG();
        
        document.querySelectorAll('.project-image img').forEach(img => {
            const parent = img.parentElement;
            
            // Add loading state
            parent.classList.add('loading');
            
            const handleLoad = () => {
                parent.classList.remove('loading');
                parent.classList.add('loaded');
                img.style.opacity = '1';
            };

            const handleError = () => {
                parent.classList.remove('loading');
                parent.classList.add('error');
                img.src = placeholder;
                console.warn(`[ProjectController] Failed to load image: ${img.src}`);
            };

            // Set up event listeners
            img.addEventListener('load', handleLoad);
            img.addEventListener('error', handleError);

            // Check if image is already loaded (cached)
            if (img.complete) {
                if (img.naturalWidth > 0) {
                    handleLoad();
                } else {
                    handleError();
                }
            }
        });
    }

    /**
     * Create placeholder SVG for failed image loads
     */
    createPlaceholderSVG() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDMyMCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMzIwIiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik0xNjAgMTEyQzEzOC45MSAxMTIgMTIyIDEyOC45MSAxMjIgMTUwQzEyMiAxNzEuMDkgMTM4LjkxIDE4OCAxNjAgMTg4QzE4MS4wOSAxODggMTk4IDE3MS4wOSAxOTggMTUwQzE5OCAxMjguOTEgMTgxLjA5IDExMiAxNjAgMTEyWk0xNjAgMTc0QzE0Ni43NSAxNzQgMTM2IDE2My4yNSAxMzYgMTUwQzEzNiAxMzYuNzUgMTQ2Ljc1IDEyNiAxNjAgMTI2QzE3My4yNSAxMjYgMTg0IDEzNi43NSAxODQgMTUwQzE4NCAxNjMuMjUgMTczLjI1IDE3NCAxNjAgMTc0WiIgZmlsbD0iIzc1NzU3NSIvPgo8L3N2Zz4K';
    }

    /**
     * Setup hover effects for project cards
     */
    setupHoverEffects() {
        this.projectCards.forEach(card => {
            const overlay = card.querySelector('.project-overlay');
            const image = card.querySelector('.project-image img');

            if (!overlay || !image) return;

            card.addEventListener('mouseenter', () => {
                overlay.style.opacity = '1';
                image.style.transform = 'scale(1.05)';
                card.style.transform = 'translateY(-5px)';
            });

            card.addEventListener('mouseleave', () => {
                overlay.style.opacity = '0';
                image.style.transform = 'scale(1)';
                card.style.transform = 'translateY(0)';
            });

            // Touch devices support
            card.addEventListener('touchstart', () => {
                overlay.style.opacity = '1';
            });

            card.addEventListener('touchend', () => {
                setTimeout(() => {
                    overlay.style.opacity = '0';
                }, 2000);
            });
        });
    }

    /**
     * Setup entrance animations for project cards
     */
    setupEntranceAnimations() {
        this.projectCards.forEach((card, index) => {
            // Initial state
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px) scale(0.95)';
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';

            // Animate in with delay
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
            }, 100 + index * 100);
        });
    }

    /**
     * Add project dynamically (for future use)
     */
    addProject(projectData) {
        const projectHTML = this.createProjectHTML(projectData);
        const projectsGrid = document.querySelector('.projects-grid');
        
        if (projectsGrid) {
            projectsGrid.insertAdjacentHTML('beforeend', projectHTML);
            
            // Initialize new card
            const newCard = projectsGrid.lastElementChild;
            this.setupCardEvents(newCard);
            
            console.debug('[ProjectController] Project added:', projectData.title);
        }
    }

    /**
     * Create HTML for a project card
     */
    createProjectHTML(data) {
        const techTags = data.technologies.map(tech => 
            `<span class="tech-tag">${tech}</span>`
        ).join('');

        const links = data.links.map(link => 
            `<a href="${link.url}" class="project-link" target="_blank" aria-label="${link.label}">
                <i class="${link.icon}"></i>
            </a>`
        ).join('');

        return `
            <article class="project-card" data-category="${data.category}">
                <div class="project-image">
                    <img src="${data.image}" alt="${data.title}" loading="lazy">
                    <div class="project-overlay">
                        <div class="project-links">
                            ${links}
                        </div>
                    </div>
                </div>
                <div class="project-content">
                    <h3 class="project-title">${data.title}</h3>
                    <p class="project-description">${data.description}</p>
                    <div class="project-tech">${techTags}</div>
                </div>
            </article>
        `;
    }

    /**
     * Setup events for a single card
     */
    setupCardEvents(card) {
        const overlay = card.querySelector('.project-overlay');
        const image = card.querySelector('.project-image img');

        if (overlay && image) {
            card.addEventListener('mouseenter', () => {
                overlay.style.opacity = '1';
                image.style.transform = 'scale(1.05)';
            });

            card.addEventListener('mouseleave', () => {
                overlay.style.opacity = '0';
                image.style.transform = 'scale(1)';
            });
        }
    }

    /**
     * Get current filter
     */
    getCurrentFilter() {
        return this.activeFilter;
    }

    /**
     * Set filter programmatically
     */
    setFilter(filter) {
        const button = document.querySelector(`[data-filter="${filter}"]`);
        if (button) {
            this.handleFilterClick(new Event('click'), button);
        }
    }

    /**
     * Handle resize events (called by main app)
     */
    handleResize() {
        // Could implement responsive grid adjustments here
    }
}

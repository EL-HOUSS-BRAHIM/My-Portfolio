/**
 * GitHub Projects Dynamic Loader
 * Fetches and displays all projects from github-projects.json
 */

class ProjectsManager {
    constructor() {
        this.projects = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        await this.loadProjects();
        this.renderProjects();
        this.setupFilterButtons();
    }

    async loadProjects() {
        try {
            const response = await fetch('data/github-projects.json');
            if (!response.ok) throw new Error('Failed to load projects');
            this.projects = await response.json();
        } catch (error) {
            console.error('Error loading projects:', error);
            this.projects = [];
        }
    }

    getFilteredProjects() {
        if (this.currentFilter === 'all') {
            return this.projects;
        }
        return this.projects.filter(project => project.category === this.currentFilter);
    }

    renderProjects() {
        const projectsGrid = document.getElementById('projects-grid');
        
        if (!projectsGrid) return;

        const filteredProjects = this.getFilteredProjects();

        // Render all projects equally
        projectsGrid.innerHTML = filteredProjects.map(project => this.createProjectCard(project)).join('');

        // Add animation
        this.animateCards();
    }

    createFeaturedCard(project) {
        const imageUrl = project.image || 'assets/images/default-project.jpg';
        const demoButton = project.demo 
            ? `<a href="${project.demo}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                 <i class="fas fa-external-link-alt"></i> Live Demo
               </a>`
            : '';

        return `
            <div class="featured-project-card">
                <div class="featured-project-badge">
                    <i class="fas fa-star"></i> Featured Project
                </div>
                <div class="featured-project-image">
                    <img src="${imageUrl}" alt="${project.name}" onerror="this.src='assets/images/default-project.jpg'">
                    <div class="featured-project-overlay">
                        <div class="featured-project-overlay-content">
                            <h3>${project.name}</h3>
                            <p>${project.description}</p>
                        </div>
                    </div>
                </div>
                <div class="featured-project-content">
                    <h3 class="featured-project-title">${project.name}</h3>
                    <p class="featured-project-description">${project.description}</p>
                    <div class="tech-stack">
                        ${project.tags.map(tag => `<span class="tech-tag">
                            <i class="fas fa-code"></i> ${tag}
                        </span>`).join('')}
                    </div>
                    <div class="project-links">
                        <a href="${project.github}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
                            <i class="fab fa-github"></i> View Code
                        </a>
                        ${demoButton}
                    </div>
                </div>
            </div>
        `;
    }

    createProjectCard(project) {
        const imageUrl = project.image || 'assets/images/default-project.jpg';
        const demoButton = project.demo 
            ? `<a href="${project.demo}" target="_blank" rel="noopener noreferrer" class="project-link">
                 <i class="fas fa-external-link-alt"></i> Live Demo
               </a>`
            : '';

        return `
            <div class="project-card" data-category="${project.category}">
                <div class="project-image">
                    <img src="${imageUrl}" alt="${project.name}" onerror="this.src='assets/images/default-project.jpg'">
                    <div class="project-overlay">
                        <div class="project-overlay-content">
                            <h4>${project.name}</h4>
                        </div>
                    </div>
                </div>
                <div class="project-content">
                    <h3 class="project-title">${project.name}</h3>
                    <p class="project-description">${project.description}</p>
                    <div class="tech-tags">
                        ${project.tags.slice(0, 4).map(tag => `<span class="tech-tag">${tag}</span>`).join('')}
                    </div>
                    <div class="project-links">
                        <a href="${project.github}" target="_blank" rel="noopener noreferrer" class="project-link">
                            <i class="fab fa-github"></i> Code
                        </a>
                        ${demoButton}
                    </div>
                </div>
            </div>
        `;
    }

    setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Update filter and re-render
                this.currentFilter = e.target.dataset.filter;
                this.renderProjects();
            });
        });
    }

    animateCards() {
        const cards = document.querySelectorAll('.project-card');
        
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProjectsManager();
});

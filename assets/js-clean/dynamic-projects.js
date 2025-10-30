/**
 * Dynamic Projects Loader
 * Loads projects from API and renders them dynamically
 */

async function loadProjects() {
    try {
        const response = await fetch('/src/api/projects.php?active=true');
        const data = await response.json();
        
        if (!data.success || !data.data.projects) {
            console.error('Failed to load projects');
            return;
        }
        
        const projects = data.data.projects;
        const container = document.querySelector('.additional-projects .projects-grid');
        
        if (!container) {
            console.error('Projects container not found');
            return;
        }
        
        // Clear existing project cards
        container.innerHTML = '';
        
        // Render each project
        projects.forEach(project => {
            const projectCard = createProjectCard(project);
            container.appendChild(projectCard);
        });
        
        // Trigger animations
        observeProjectAnimations();
        
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    // Parse technologies
    const technologies = project.technologies ? 
        project.technologies.split(/[,\n]/).map(t => t.trim()).filter(t => t) : [];
    
    card.innerHTML = `
        ${project.image_url ? `
            <div class="project-image">
                <img src="${project.image_url}" alt="${project.title}" loading="lazy" onerror="this.src='assets/images/project-placeholder.jpg'">
                ${project.featured ? '<div class="featured-badge"><i class="fas fa-star"></i> Featured</div>' : ''}
            </div>
        ` : ''}
        <div class="project-content">
            <h4>${project.title}</h4>
            ${project.category ? `<span class="project-category">${project.category}</span>` : ''}
            <p>${project.short_description || project.description}</p>
            ${technologies.length > 0 ? `
                <div class="project-tech">
                    ${technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                </div>
            ` : ''}
            <div class="project-links">
                ${project.demo_url ? `
                    <a href="${project.demo_url}" class="project-link" target="_blank" rel="noopener noreferrer">
                        <i class="fas fa-external-link-alt"></i> View Demo
                    </a>
                ` : ''}
                ${project.github_url ? `
                    <a href="${project.github_url}" class="project-link" target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-github"></i> View Code
                    </a>
                ` : ''}
            </div>
        </div>
    `;
    
    return card;
}

function observeProjectAnimations() {
    const projectCards = document.querySelectorAll('.project-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    projectCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

// Load projects when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProjects);
} else {
    loadProjects();
}

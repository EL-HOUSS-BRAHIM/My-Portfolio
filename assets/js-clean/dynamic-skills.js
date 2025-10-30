/**
 * Dynamic Skills Loader
 * Loads skills from API and renders them dynamically
 */

async function loadSkills() {
    try {
        const response = await fetch('/src/api/skills.php?active=true');
        const data = await response.json();
        
        if (!data.success || !data.data.grouped) {
            console.error('Failed to load skills');
            return;
        }
        
        const grouped = data.data.grouped;
        const container = document.querySelector('.skills__content');
        
        if (!container) {
            console.error('Skills container not found');
            return;
        }
        
        container.innerHTML = '';
        
        const categoryConfig = {
            'Frontend Development': {
                icon: 'fas fa-laptop-code',
                description: 'Creating engaging user experiences with modern frameworks and tools'
            },
            'Backend Development': {
                icon: 'fas fa-server',
                description: 'Building robust server-side applications and APIs'
            },
            'Tools & DevOps': {
                icon: 'fas fa-tools',
                description: 'Development tools and deployment technologies'
            }
        };
        
        for (const [category, skills] of Object.entries(grouped)) {
            const config = categoryConfig[category] || {
                icon: 'fas fa-code',
                description: 'Professional skills and expertise'
            };
            
            const categoryElement = document.createElement('div');
            categoryElement.className = 'skills-category';
            
            categoryElement.innerHTML = `
                <div class="category-header">
                    <div class="category-icon">
                        <i class="${config.icon}"></i>
                    </div>
                    <h3>${category}</h3>
                    <p>${config.description}</p>
                </div>
                <div class="skills-grid">
                    ${skills.map(skill => `
                        <div class="skill-item" data-level="${skill.level}">
                            <div class="skill-icon">
                                <i class="${skill.icon || 'fas fa-code'}"></i>
                            </div>
                            <div class="skill-info">
                                <h4>${skill.name}</h4>
                                <p>${skill.description || ''}</p>
                                <div class="skill-progress">
                                    <div class="skill-bar" style="width: ${skill.level}%"></div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            container.appendChild(categoryElement);
        }
        
        // Trigger animations
        observeSkillAnimations();
        
    } catch (error) {
        console.error('Error loading skills:', error);
    }
}

function observeSkillAnimations() {
    const skillItems = document.querySelectorAll('.skill-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    skillItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(item);
    });
}

// Load skills when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSkills);
} else {
    loadSkills();
}

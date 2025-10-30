/**
 * Dynamic Education Loader
 * Loads education entries from API and renders them dynamically
 */

async function loadEducation() {
    try {
        const response = await fetch('/src/api/education.php?active=true');
        const data = await response.json();
        
        if (!data.success || !data.data.education) {
            console.error('Failed to load education');
            return;
        }
        
        const education = data.data.education;
        const timeline = document.querySelector('.timeline');
        
        if (!timeline) {
            console.error('Timeline container not found');
            return;
        }
        
        // Clear existing items but keep certifications if they exist
        const timelineItems = timeline.querySelectorAll('.timeline-item');
        timelineItems.forEach(item => item.remove());
        
        education.forEach(edu => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            
            const startDate = new Date(edu.start_date);
            const endDate = edu.end_date ? new Date(edu.end_date) : null;
            const dateRange = formatDateRange(startDate, endDate, edu.is_current);
            
            // Parse skills into badges
            const skills = edu.skills ? edu.skills.split(',').map(s => s.trim()) : [];
            
            timelineItem.innerHTML = `
                <div class="timeline-marker">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h3>${edu.institution}</h3>
                        <span class="timeline-date">${dateRange}</span>
                    </div>
                    <div class="timeline-body">
                        <h4>${edu.degree}${edu.field_of_study ? ' - ' + edu.field_of_study : ''}</h4>
                        ${edu.description ? `<p>${edu.description}</p>` : ''}
                        ${edu.location ? `<p style="color: #666; font-size: 14px; margin-top: 0.5rem;"><i class="fas fa-map-marker-alt"></i> ${edu.location}</p>` : ''}
                        ${skills.length > 0 ? `
                            <div class="timeline-skills">
                                ${skills.map(skill => `<span class="skill-badge">${skill}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            timeline.appendChild(timelineItem);
        });
        
        // Trigger animations
        observeTimelineAnimations();
        
    } catch (error) {
        console.error('Error loading education:', error);
    }
}

function formatDateRange(startDate, endDate, isCurrent) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const startMonth = months[startDate.getMonth()];
    const startYear = startDate.getFullYear();
    
    if (isCurrent || !endDate) {
        return `${startMonth} ${startYear} - Present`;
    }
    
    const endMonth = months[endDate.getMonth()];
    const endYear = endDate.getFullYear();
    
    if (startYear === endYear) {
        return `${startMonth} - ${endMonth} ${startYear}`;
    }
    
    return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
}

function observeTimelineAnimations() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
            }
        });
    }, { threshold: 0.1 });
    
    timelineItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = index % 2 === 0 ? 'translateX(-50px)' : 'translateX(50px)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(item);
    });
}

// Load education when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadEducation);
} else {
    loadEducation();
}


// Modern, clean, and efficient project section JS
class ProjectSection {
    constructor() {
        this.filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
        this.projectCards = Array.from(document.querySelectorAll('.project-card'));
        this.init();
    }

    init() {
        if (!this.filterButtons.length || !this.projectCards.length) return;
        this.setupFilters();
        this.setupImageLoading();
        this.setupHoverEffects();
    }

    setupFilters() {
        // Set initial active state
        this.filterButtons[0].classList.add('active');
        this.filterButtons.forEach(btn =>
            btn.addEventListener('click', e => this.handleFilterClick(e, btn))
        );
    }

    handleFilterClick(e, button) {
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const filter = button.dataset.filter;
        this.projectCards.forEach(card => {
            if (filter === 'all' || card.dataset.category === filter) {
                card.style.display = 'flex';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 10);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    }

    setupImageLoading() {
        const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDMyMCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMzIwIiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik0xNjAgMTEyQzEzOC45MSAxMTIgMTIyIDEyOC45MSAxMjIgMTUwQzEyMiAxNzEuMDkgMTM4LjkxIDE4OCAxNjAgMTg4QzE4MS4wOSAxODggMTk4IDE3MS4wOSAxOTggMTUwQzE5OCAxMjguOTEgMTgxLjA5IDExMiAxNjAgMTEyWk0xNjAgMTc0QzE0Ni43NSAxNzQgMTM2IDE2My4yNSAxMzYgMTUwQzEzNiAxMzYuNzUgMTQ2Ljc1IDEyNiAxNjAgMTI2QzE3My4yNSAxMjYgMTg0IDEzNi43NSAxODQgMTUwQzE4NCAxNjMuMjUgMTczLjI1IDE3NCAxNjAgMTc0WiIgZmlsbD0iIzc1NzU3NSIvPgo8cGF0aCBkPSJNMTgwLjY0IDE2OS4zNkwyMTIgMjAwLjcyTDIwMC43MiAyMTJMMTY5LjM2IDE4MC42NEMxNjYuNDggMTgyLjQzIDE2My4zNSAxODMuNzUgMTYwIDE4NEMxNDYuNzUgMTg0IDEzNiAxNzMuMjUgMTM2IDE2MEMxMzYgMTQ2Ljc1IDE0Ni43NSAxMzYgMTYwIDEzNkMxNzMuMjUgMTM2IDE4NCAxNDYuNzUgMTg0IDE2MEMxODMuNzUgMTYzLjM1IDE4Mi40MyAxNjYuNDggMTgwLjY0IDE2OS4zNloiIGZpbGw9IiM3NTc1NzUiLz4KPC9zdmc+Cg==';
        document.querySelectorAll('.project-image img').forEach(img => {
            const parent = img.parentElement;
            parent.classList.add('loading');
            img.addEventListener('load', () => {
                parent.classList.remove('loading');
                parent.classList.add('loaded');
            });
            img.addEventListener('error', () => {
                parent.classList.remove('loading');
                parent.classList.add('error');
                img.src = placeholder;
                img.alt = 'Project image unavailable';
            });
            // If already loaded or failed
            if (img.complete) {
                if (img.naturalHeight === 0) {
                    img.dispatchEvent(new Event('error'));
                } else {
                    img.dispatchEvent(new Event('load'));
                }
            }
        });
    }

    setupHoverEffects() {
        this.projectCards.forEach((card, idx) => {
            // Entrance animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 300 + idx * 60);

            card.addEventListener('mouseenter', () => {
                card.querySelectorAll('.tech-tag').forEach((tag, i) => {
                    tag.style.transitionDelay = `${i * 50}ms`;
                    tag.classList.add('tech-tag-hover');
                });
            });
            card.addEventListener('mouseleave', () => {
                card.querySelectorAll('.tech-tag').forEach(tag => {
                    tag.style.transitionDelay = '0ms';
                    tag.classList.remove('tech-tag-hover');
                });
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new ProjectSection());

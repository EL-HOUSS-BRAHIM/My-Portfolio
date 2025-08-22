/**
 * Hero Section Controller
 * 
 * Handles hero section specific functionality including typing animation,
 * particle effects, scroll indicators, and interactive elements.
 * 
 * @author Brahim El Houss
 */

class HeroController {
    constructor() {
        this.hero = document.querySelector('.hero');
        this.roleElement = document.querySelector('.hero__role');
        this.statsElements = document.querySelectorAll('.stat__number');
        this.techItems = document.querySelectorAll('.tech-item');
        this.scrollIndicator = document.querySelector('.scroll-indicator');
        
        this.isTyping = false;
        this.typewriterTimeout = null;
        this.particleCanvas = null;
        this.particles = [];
        
        this.init();
    }

    /**
     * Initialize hero functionality
     */
    init() {
        this.setupTypewriterEffect();
        this.setupStatsCounter();
        this.setupTechStackHover();
        this.setupScrollIndicator();
        this.setupParticleBackground();
        this.setupImageEffects();
        this.setupHeroInteractions();
        
        console.debug('[HeroController] Initialized');
    }

    /**
     * Setup typewriter effect for hero role
     */
    setupTypewriterEffect() {
        if (!this.roleElement) return;

        const roles = [
            'Full Stack Software Engineer',
            'Frontend Developer',
            'Backend Developer',
            'Problem Solver',
            'Tech Enthusiast'
        ];

        let currentRoleIndex = 0;
        let currentCharIndex = 0;
        let isDeleting = false;
        
        const typeSpeed = 100;
        const deleteSpeed = 50;
        const pauseTime = 2000;

        const type = () => {
            const currentRole = roles[currentRoleIndex];
            
            if (isDeleting) {
                this.roleElement.textContent = currentRole.substring(0, currentCharIndex - 1);
                currentCharIndex--;
            } else {
                this.roleElement.textContent = currentRole.substring(0, currentCharIndex + 1);
                currentCharIndex++;
            }

            // Add cursor
            this.roleElement.style.borderRight = '2px solid var(--hero-accent)';

            if (!isDeleting && currentCharIndex === currentRole.length) {
                // Pause at the end
                this.typewriterTimeout = setTimeout(() => {
                    isDeleting = true;
                    this.typewriterTimeout = setTimeout(type, deleteSpeed);
                }, pauseTime);
                return;
            } else if (isDeleting && currentCharIndex === 0) {
                isDeleting = false;
                currentRoleIndex = (currentRoleIndex + 1) % roles.length;
                this.typewriterTimeout = setTimeout(type, typeSpeed);
                return;
            }

            const speed = isDeleting ? deleteSpeed : typeSpeed;
            this.typewriterTimeout = setTimeout(type, speed);
        };

        // Start typing effect after initial load
        setTimeout(() => {
            this.isTyping = true;
            type();
        }, 1500);
    }

    /**
     * Setup animated stats counter
     */
    setupStatsCounter() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateNumber(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        this.statsElements.forEach(stat => {
            observer.observe(stat);
        });
    }

    /**
     * Animate number counting
     */
    animateNumber(element) {
        const target = element.textContent;
        const isPercentage = target.includes('%');
        const hasPlus = target.includes('+');
        const number = parseInt(target.replace(/[^\d]/g, ''));
        
        let current = 0;
        const increment = Math.ceil(number / 50);
        const duration = 2000;
        const step = duration / (number / increment);

        const counter = setInterval(() => {
            current += increment;
            if (current >= number) {
                current = number;
                clearInterval(counter);
            }
            
            let displayValue = current;
            if (hasPlus) displayValue += '+';
            if (isPercentage) displayValue += '%';
            
            element.textContent = displayValue;
        }, step);
    }

    /**
     * Setup tech stack hover effects
     */
    setupTechStackHover() {
        this.techItems.forEach((item, index) => {
            // Add stagger animation
            item.style.animationDelay = `${2 + (index * 0.2)}s`;
            item.classList.add('animate-on-scroll');

            // Hover effects
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateX(15px) scale(1.2)';
                item.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.3)';
                this.showTechTooltip(item, index);
            });

            item.addEventListener('mouseleave', () => {
                item.style.transform = 'translateX(0) scale(1)';
                item.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                this.hideTechTooltip(item);
            });

            // Touch support for mobile
            item.addEventListener('touchstart', () => {
                item.style.transform = 'translateX(15px) scale(1.2)';
            });

            item.addEventListener('touchend', () => {
                setTimeout(() => {
                    item.style.transform = 'translateX(0) scale(1)';
                }, 200);
            });
        });
    }

    /**
     * Show tech tooltip
     */
    showTechTooltip(item, index) {
        const tooltips = [
            'JavaScript ES6+',
            'React.js',
            'Node.js',
            'Python',
            'Database Design'
        ];

        const tooltip = document.createElement('div');
        tooltip.className = 'tech-tooltip';
        tooltip.textContent = tooltips[index] || 'Technology';
        
        Object.assign(tooltip.style, {
            position: 'absolute',
            bottom: '120%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: '500',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            zIndex: '1000',
            opacity: '0',
            transition: 'opacity 0.3s ease'
        });

        item.appendChild(tooltip);
        setTimeout(() => tooltip.style.opacity = '1', 10);
    }

    /**
     * Hide tech tooltip
     */
    hideTechTooltip(item) {
        const tooltip = item.querySelector('.tech-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            setTimeout(() => tooltip.remove(), 300);
        }
    }

    /**
     * Setup scroll indicator
     */
    setupScrollIndicator() {
        if (!this.scrollIndicator) return;

        this.scrollIndicator.addEventListener('click', () => {
            const aboutSection = document.getElementById('about');
            if (aboutSection) {
                aboutSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });

        // Keyboard support
        this.scrollIndicator.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.scrollIndicator.click();
            }
        });

        // Make it focusable
        this.scrollIndicator.setAttribute('tabindex', '0');
    }

    /**
     * Setup particle background effect
     */
    setupParticleBackground() {
        if (!this.hero) return;

        // Create canvas
        this.particleCanvas = document.createElement('canvas');
        this.particleCanvas.className = 'hero-particles';
        Object.assign(this.particleCanvas.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '1',
            opacity: '0.6'
        });

        this.hero.appendChild(this.particleCanvas);
        
        this.initParticles();
        this.animateParticles();
    }

    /**
     * Initialize particles
     */
    initParticles() {
        const canvas = this.particleCanvas;
        const ctx = canvas.getContext('2d');
        
        canvas.width = this.hero.offsetWidth;
        canvas.height = this.hero.offsetHeight;

        // Create particles
        this.particles = [];
        const particleCount = Math.min(50, Math.floor((canvas.width * canvas.height) / 15000));

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.3
            });
        }
    }

    /**
     * Animate particles
     */
    animateParticles() {
        const canvas = this.particleCanvas;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.particles.forEach((particle, index) => {
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            // Wrap around edges
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;

            // Draw particle
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(102, 126, 234, ${particle.opacity})`;
            ctx.fill();

            // Draw connections
            this.particles.forEach((otherParticle, otherIndex) => {
                if (index !== otherIndex) {
                    const distance = Math.sqrt(
                        Math.pow(particle.x - otherParticle.x, 2) +
                        Math.pow(particle.y - otherParticle.y, 2)
                    );

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.strokeStyle = `rgba(102, 126, 234, ${0.1 * (100 - distance) / 100})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            });
        });

        requestAnimationFrame(() => this.animateParticles());
    }

    /**
     * Setup image effects
     */
    setupImageEffects() {
        const heroImage = document.querySelector('.hero__image');
        if (!heroImage) return;

        // Add mouse tracking effect
        heroImage.addEventListener('mousemove', (e) => {
            const rect = heroImage.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            heroImage.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        heroImage.addEventListener('mouseleave', () => {
            heroImage.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    }

    /**
     * Setup hero interactions
     */
    setupHeroInteractions() {
        // Hero badge click
        const heroBadge = document.querySelector('.hero__badge');
        if (heroBadge) {
            heroBadge.addEventListener('click', () => {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                }
            });

            heroBadge.style.cursor = 'pointer';
        }

        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' && window.scrollY === 0) {
                const aboutSection = document.getElementById('about');
                if (aboutSection) {
                    aboutSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    /**
     * Handle scroll events (called by main app)
     */
    handleScroll() {
        const scrollY = window.scrollY;
        
        // Parallax effect for hero elements
        if (this.hero && scrollY < window.innerHeight) {
            const heroText = this.hero.querySelector('.hero__text');
            const heroVisual = this.hero.querySelector('.hero__visual');
            
            if (heroText) {
                heroText.style.transform = `translateY(${scrollY * 0.3}px)`;
            }
            
            if (heroVisual) {
                heroVisual.style.transform = `translateY(${scrollY * 0.2}px)`;
            }
        }

        // Update scroll indicator opacity
        if (this.scrollIndicator) {
            const opacity = Math.max(0, 1 - scrollY / 300);
            this.scrollIndicator.style.opacity = opacity;
            this.scrollIndicator.style.visibility = opacity > 0.1 ? 'visible' : 'hidden';
        }
    }

    /**
     * Handle resize events (called by main app)
     */
    handleResize() {
        if (this.particleCanvas && this.hero) {
            this.particleCanvas.width = this.hero.offsetWidth;
            this.particleCanvas.height = this.hero.offsetHeight;
            this.initParticles();
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        if (this.typewriterTimeout) {
            clearTimeout(this.typewriterTimeout);
        }

        if (this.particleCanvas && this.particleCanvas.parentNode) {
            this.particleCanvas.parentNode.removeChild(this.particleCanvas);
        }
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.heroController = new HeroController();
});

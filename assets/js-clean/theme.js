/**
 * Theme Controller
 * 
 * Handles light/dark theme switching with system preference detection
 * and local storage persistence.
 * 
 * @author Brahim El Houss
 */

class ThemeController {
    constructor() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        this.themes = {
            LIGHT: 'light',
            DARK: 'dark'
        };
        
        this.init();
    }

    /**
     * Initialize theme functionality
     */
    init() {
        if (!this.themeToggle) {
            console.warn('[ThemeController] Theme toggle button not found');
            return;
        }

        this.setupInitialTheme();
        this.setupEventListeners();
        
        console.debug('[ThemeController] Initialized');
    }

    /**
     * Setup initial theme based on saved preference or system preference
     */
    setupInitialTheme() {
        const savedTheme = this.getSavedTheme();
        const systemTheme = this.getSystemTheme();
        const initialTheme = savedTheme || systemTheme;
        
        this.applyTheme(initialTheme);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Theme toggle click
        this.themeToggle.addEventListener('click', () => {
            const currentTheme = this.getCurrentTheme();
            const newTheme = currentTheme === this.themes.LIGHT ? this.themes.DARK : this.themes.LIGHT;
            
            this.applyTheme(newTheme);
            this.saveTheme(newTheme);
            
            console.debug(`[ThemeController] Theme toggled to ${newTheme}`);
        });

        // System theme change detection
        this.prefersDarkScheme.addEventListener('change', (e) => {
            if (!this.getSavedTheme()) {
                const systemTheme = e.matches ? this.themes.DARK : this.themes.LIGHT;
                this.applyTheme(systemTheme);
                console.debug(`[ThemeController] System theme changed to ${systemTheme}`);
            }
        });
    }

    /**
     * Apply theme to the document
     */
    applyTheme(theme) {
        if (theme === this.themes.LIGHT) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        
        this.updateThemeIcon(theme);
        this.updateAriaLabel(theme);
    }

    /**
     * Update theme toggle icon
     */
    updateThemeIcon(theme) {
        const icon = this.themeToggle.querySelector('i');
        if (!icon) return;

        if (theme === this.themes.LIGHT) {
            icon.className = 'fas fa-moon';
        } else {
            icon.className = 'fas fa-sun';
        }
    }

    /**
     * Update ARIA label for accessibility
     */
    updateAriaLabel(theme) {
        const label = theme === this.themes.LIGHT 
            ? 'Switch to dark theme' 
            : 'Switch to light theme';
        
        this.themeToggle.setAttribute('aria-label', label);
        this.themeToggle.setAttribute('aria-pressed', 'false');
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return document.documentElement.hasAttribute('data-theme') 
            ? this.themes.LIGHT 
            : this.themes.DARK;
    }

    /**
     * Get saved theme from localStorage
     */
    getSavedTheme() {
        try {
            return localStorage.getItem('theme');
        } catch (error) {
            console.warn('[ThemeController] Could not access localStorage:', error);
            return null;
        }
    }

    /**
     * Save theme to localStorage
     */
    saveTheme(theme) {
        try {
            localStorage.setItem('theme', theme);
        } catch (error) {
            console.warn('[ThemeController] Could not save to localStorage:', error);
        }
    }

    /**
     * Get system theme preference
     */
    getSystemTheme() {
        return this.prefersDarkScheme.matches ? this.themes.DARK : this.themes.LIGHT;
    }

    /**
     * Force set theme (useful for testing)
     */
    setTheme(theme) {
        if (Object.values(this.themes).includes(theme)) {
            this.applyTheme(theme);
            this.saveTheme(theme);
        } else {
            console.warn(`[ThemeController] Invalid theme: ${theme}`);
        }
    }

    /**
     * Toggle theme programmatically
     */
    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === this.themes.LIGHT ? this.themes.DARK : this.themes.LIGHT;
        this.setTheme(newTheme);
    }
}

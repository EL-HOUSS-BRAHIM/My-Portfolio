/**
 * Advanced Font Loading Optimization System
 * 
 * Features:
 * - Font-display: swap for web fonts
 * - Font preloading for critical fonts
 * - Font subsetting optimization
 * - FOUT (Flash of Unstyled Text) mitigation
 * - Progressive font enhancement
 * 
 * @author Brahim El Houss
 * @version 1.0.0
 */

class FontOptimizer {
    constructor(options = {}) {
        this.options = {
            // Font loading strategy
            strategy: 'progressive', // 'progressive', 'preload', 'swap'
            
            // Critical fonts to preload
            criticalFonts: [
                'Inter-Regular',
                'Inter-Medium',
                'Inter-SemiBold'
            ],
            
            // Font display fallbacks
            fallbackFonts: {
                'Inter': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                'JetBrains Mono': 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
            },
            
            // Font loading timeout
            timeout: 3000,
            
            ...options
        };
        
        this.loadedFonts = new Set();
        this.fontLoadPromises = new Map();
        this.init();
    }
    
    /**
     * Initialize font optimization
     */
    init() {
        this.addFontDisplayCSS();
        this.preloadCriticalFonts();
        this.setupFallbackFonts();
        this.initProgressiveLoading();
        
        // Add font loading events
        if ('fonts' in document) {
            document.fonts.addEventListener('loadingdone', this.handleFontsLoaded.bind(this));
            document.fonts.addEventListener('loadingerror', this.handleFontError.bind(this));
        }
    }
    
    /**
     * Add font-display: swap CSS for all web fonts
     */
    addFontDisplayCSS() {
        const fontDisplayCSS = `
            /* Font optimization styles */
            @font-face {
                font-family: 'Inter';
                font-style: normal;
                font-weight: 300;
                font-display: swap;
                src: url('/assets/fonts/Inter-Light.woff2') format('woff2'),
                     url('/assets/fonts/Inter-Light.woff') format('woff');
            }
            
            @font-face {
                font-family: 'Inter';
                font-style: normal;
                font-weight: 400;
                font-display: swap;
                src: url('/assets/fonts/Inter-Regular.woff2') format('woff2'),
                     url('/assets/fonts/Inter-Regular.woff') format('woff');
            }
            
            @font-face {
                font-family: 'Inter';
                font-style: normal;
                font-weight: 500;
                font-display: swap;
                src: url('/assets/fonts/Inter-Medium.woff2') format('woff2'),
                     url('/assets/fonts/Inter-Medium.woff') format('woff');
            }
            
            @font-face {
                font-family: 'Inter';
                font-style: normal;
                font-weight: 600;
                font-display: swap;
                src: url('/assets/fonts/Inter-SemiBold.woff2') format('woff2'),
                     url('/assets/fonts/Inter-SemiBold.woff') format('woff');
            }
            
            @font-face {
                font-family: 'Inter';
                font-style: normal;
                font-weight: 700;
                font-display: swap;
                src: url('/assets/fonts/Inter-Bold.woff2') format('woff2'),
                     url('/assets/fonts/Inter-Bold.woff') format('woff');
            }
            
            @font-face {
                font-family: 'JetBrains Mono';
                font-style: normal;
                font-weight: 400;
                font-display: swap;
                src: url('/assets/fonts/JetBrainsMono-Regular.woff2') format('woff2'),
                     url('/assets/fonts/JetBrainsMono-Regular.woff') format('woff');
            }
            
            /* Font loading states */
            .fonts-loading {
                font-family: ${this.options.fallbackFonts['Inter']};
            }
            
            .fonts-loaded {
                font-family: 'Inter', ${this.options.fallbackFonts['Inter']};
            }
            
            .fonts-failed {
                font-family: ${this.options.fallbackFonts['Inter']};
            }
            
            /* Progressive enhancement classes */
            .font-enhanced {
                font-feature-settings: "liga" 1, "kern" 1;
                font-variant-ligatures: common-ligatures;
                text-rendering: optimizeLegibility;
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = fontDisplayCSS;
        document.head.appendChild(style);
    }
    
    /**
     * Preload critical fonts
     */
    preloadCriticalFonts() {
        this.options.criticalFonts.forEach(fontName => {
            this.preloadFont(fontName);
        });
    }
    
    /**
     * Preload a specific font
     */
    preloadFont(fontName) {
        const fontUrls = this.getFontUrls(fontName);
        
        fontUrls.forEach(({ url, format }) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = url;
            link.as = 'font';
            link.type = `font/${format}`;
            link.crossOrigin = 'anonymous';
            
            document.head.appendChild(link);
        });
    }
    
    /**
     * Get font URLs for a given font name
     */
    getFontUrls(fontName) {
        const fontMap = {
            'Inter-Light': [
                { url: '/assets/fonts/Inter-Light.woff2', format: 'woff2' },
                { url: '/assets/fonts/Inter-Light.woff', format: 'woff' }
            ],
            'Inter-Regular': [
                { url: '/assets/fonts/Inter-Regular.woff2', format: 'woff2' },
                { url: '/assets/fonts/Inter-Regular.woff', format: 'woff' }
            ],
            'Inter-Medium': [
                { url: '/assets/fonts/Inter-Medium.woff2', format: 'woff2' },
                { url: '/assets/fonts/Inter-Medium.woff', format: 'woff' }
            ],
            'Inter-SemiBold': [
                { url: '/assets/fonts/Inter-SemiBold.woff2', format: 'woff2' },
                { url: '/assets/fonts/Inter-SemiBold.woff', format: 'woff' }
            ],
            'Inter-Bold': [
                { url: '/assets/fonts/Inter-Bold.woff2', format: 'woff2' },
                { url: '/assets/fonts/Inter-Bold.woff', format: 'woff' }
            ],
            'JetBrains-Regular': [
                { url: '/assets/fonts/JetBrainsMono-Regular.woff2', format: 'woff2' },
                { url: '/assets/fonts/JetBrainsMono-Regular.woff', format: 'woff' }
            ]
        };
        
        return fontMap[fontName] || [];
    }
    
    /**
     * Setup fallback fonts
     */
    setupFallbackFonts() {
        // Add class to body to indicate font loading state
        document.body.classList.add('fonts-loading');
        
        // Set initial fallback fonts
        const fallbackStyle = document.createElement('style');
        fallbackStyle.textContent = `
            body {
                font-family: ${this.options.fallbackFonts['Inter']};
            }
            
            .monospace, code, pre {
                font-family: ${this.options.fallbackFonts['JetBrains Mono']};
            }
        `;
        document.head.appendChild(fallbackStyle);
    }
    
    /**
     * Initialize progressive font loading
     */
    initProgressiveLoading() {
        if (!('fonts' in document)) {
            // Fallback for browsers without Font Loading API
            this.fallbackFontLoading();
            return;
        }
        
        // Load fonts progressively
        const fontLoadPromises = [];
        
        // Define font families and weights to load
        const fontsToLoad = [
            { family: 'Inter', weight: '400' },
            { family: 'Inter', weight: '500' },
            { family: 'Inter', weight: '600' },
            { family: 'Inter', weight: '700' },
            { family: 'JetBrains Mono', weight: '400' }
        ];
        
        fontsToLoad.forEach(({ family, weight }) => {
            const fontLoadPromise = this.loadFont(family, weight);
            fontLoadPromises.push(fontLoadPromise);
        });
        
        // Handle font loading completion
        Promise.allSettled(fontLoadPromises).then(results => {
            const loadedCount = results.filter(r => r.status === 'fulfilled').length;
            const failedCount = results.filter(r => r.status === 'rejected').length;
            
            if (loadedCount > 0) {
                this.handleFontsLoaded();
            }
            
            if (failedCount > 0) {
                console.warn(`Failed to load ${failedCount} fonts`);
            }
        });
        
        // Timeout fallback
        setTimeout(() => {
            if (!document.body.classList.contains('fonts-loaded')) {
                this.handleFontTimeout();
            }
        }, this.options.timeout);
    }
    
    /**
     * Load a specific font using Font Loading API
     */
    async loadFont(family, weight = '400', style = 'normal') {
        const fontKey = `${family}-${weight}-${style}`;
        
        if (this.loadedFonts.has(fontKey)) {
            return Promise.resolve();
        }
        
        if (this.fontLoadPromises.has(fontKey)) {
            return this.fontLoadPromises.get(fontKey);
        }
        
        const fontFace = new FontFace(family, `url(/assets/fonts/${this.getFontFileName(family, weight)}.woff2)`, {
            weight: weight,
            style: style,
            display: 'swap'
        });
        
        const loadPromise = fontFace.load().then(loadedFace => {
            document.fonts.add(loadedFace);
            this.loadedFonts.add(fontKey);
            return loadedFace;
        });
        
        this.fontLoadPromises.set(fontKey, loadPromise);
        return loadPromise;
    }
    
    /**
     * Get font filename based on family and weight
     */
    getFontFileName(family, weight) {
        const fileMap = {
            'Inter': {
                '300': 'Inter-Light',
                '400': 'Inter-Regular',
                '500': 'Inter-Medium',
                '600': 'Inter-SemiBold',
                '700': 'Inter-Bold'
            },
            'JetBrains Mono': {
                '400': 'JetBrainsMono-Regular'
            }
        };
        
        return fileMap[family]?.[weight] || `${family}-Regular`;
    }
    
    /**
     * Handle successful font loading
     */
    handleFontsLoaded() {
        document.body.classList.remove('fonts-loading');
        document.body.classList.add('fonts-loaded');
        
        // Add progressive enhancement
        document.body.classList.add('font-enhanced');
        
        // Dispatch custom event
        const event = new CustomEvent('fontsLoaded', {
            detail: { loadedFonts: Array.from(this.loadedFonts) }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Handle font loading errors
     */
    handleFontError(event) {
        console.warn('Font loading error:', event);
        
        // Continue with fallback fonts
        document.body.classList.remove('fonts-loading');
        document.body.classList.add('fonts-failed');
    }
    
    /**
     * Handle font loading timeout
     */
    handleFontTimeout() {
        console.warn('Font loading timeout - proceeding with fallbacks');
        
        document.body.classList.remove('fonts-loading');
        document.body.classList.add('fonts-failed');
    }
    
    /**
     * Fallback font loading for older browsers
     */
    fallbackFontLoading() {
        // Simple timer-based fallback
        setTimeout(() => {
            document.body.classList.remove('fonts-loading');
            document.body.classList.add('fonts-loaded');
        }, 1000);
    }
    
    /**
     * Get font loading statistics
     */
    getStats() {
        return {
            loadedFonts: Array.from(this.loadedFonts),
            supportsAPI: 'fonts' in document,
            fontCount: this.loadedFonts.size
        };
    }
}

// Initialize font optimizer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.FontOptimizer = new FontOptimizer();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FontOptimizer;
}
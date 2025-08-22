/**
 * Advanced Asset Loader
 * Handles efficient loading of CSS/JS with fallbacks
 */
class AssetLoader {
    constructor() {
        this.loadedAssets = new Set();
        this.loadingPromises = new Map();
    }
    
    async loadCSS(href, media = 'all') {
        if (this.loadedAssets.has(href)) {
            return Promise.resolve();
        }
        
        if (this.loadingPromises.has(href)) {
            return this.loadingPromises.get(href);
        }
        
        const promise = new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.media = media;
            
            link.onload = () => {
                this.loadedAssets.add(href);
                resolve();
            };
            
            link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
            
            document.head.appendChild(link);
        });
        
        this.loadingPromises.set(href, promise);
        return promise;
    }
    
    async loadJS(src) {
        if (this.loadedAssets.has(src)) {
            return Promise.resolve();
        }
        
        if (this.loadingPromises.has(src)) {
            return this.loadingPromises.get(src);
        }
        
        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                this.loadedAssets.add(src);
                resolve();
            };
            
            script.onerror = () => reject(new Error(`Failed to load JS: ${src}`));
            
            document.head.appendChild(script);
        });
        
        this.loadingPromises.set(src, promise);
        return promise;
    }
    
    preloadAsset(href, as = 'style') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        document.head.appendChild(link);
    }
    
    async loadCriticalCSS() {
        const criticalCSS = await fetch('/storage/optimized/assets/critical.css');
        const css = await criticalCSS.text();
        
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }
}

// Initialize asset loader
window.AssetLoader = new AssetLoader();

// Load critical CSS immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.AssetLoader.loadCriticalCSS();
    });
} else {
    window.AssetLoader.loadCriticalCSS();
}

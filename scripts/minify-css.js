#!/usr/bin/env node

/**
 * CSS Minification Script
 * Minifies all CSS files in the assets/css directory
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Simple CSS minifier
 * @param {string} css - CSS content to minify
 * @returns {string} - Minified CSS
 */
function minifyCSS(css) {
    return css
        // Remove comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove whitespace
        .replace(/\s+/g, ' ')
        // Remove spaces around special characters
        .replace(/\s*([{}:;,>+~])\s*/g, '$1')
        // Remove trailing semicolons
        .replace(/;}/g, '}')
        // Remove leading/trailing whitespace
        .trim();
}

/**
 * Minify a single CSS file
 * @param {string} filePath - Path to CSS file
 */
async function minifyFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const minified = minifyCSS(content);
        
        // Write minified content back to the same file
        await fs.writeFile(filePath, minified, 'utf8');
        
        const originalSize = content.length;
        const minifiedSize = minified.length;
        const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
        
        console.log(`✓ ${path.basename(filePath)}: ${originalSize}B → ${minifiedSize}B (${savings}% smaller)`);
    } catch (error) {
        console.error(`✗ Error minifying ${filePath}:`, error.message);
    }
}

/**
 * Recursively find all CSS files
 * @param {string} dir - Directory to search
 * @returns {Promise<string[]>} - Array of CSS file paths
 */
async function findCSSFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            // Skip minified directories
            if (!entry.name.includes('minified') && !entry.name.includes('optimized')) {
                files.push(...await findCSSFiles(fullPath));
            }
        } else if (entry.isFile() && entry.name.endsWith('.css') && !entry.name.endsWith('.min.css')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

/**
 * Main function
 */
async function main() {
    const cssDir = path.join(__dirname, '..', 'assets', 'css');
    
    console.log('🎨 Starting CSS minification...\n');
    
    try {
        const cssFiles = await findCSSFiles(cssDir);
        
        if (cssFiles.length === 0) {
            console.log('No CSS files found to minify.');
            return;
        }
        
        console.log(`Found ${cssFiles.length} CSS files to minify:\n`);
        
        for (const file of cssFiles) {
            await minifyFile(file);
        }
        
        console.log('\n✨ CSS minification complete!');
    } catch (error) {
        console.error('Error during minification:', error);
        process.exit(1);
    }
}

// Run the script
main();

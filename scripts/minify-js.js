#!/usr/bin/env node

/**
 * JavaScript Minification Script
 * Minifies all JS files from assets/js-clean/ to assets/js/minified/
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const JS_SOURCE_DIR = path.join(__dirname, '..', 'assets', 'js-clean');
const JS_OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'js', 'minified');

// Ensure output directory exists
if (!fs.existsSync(JS_OUTPUT_DIR)) {
    fs.mkdirSync(JS_OUTPUT_DIR, { recursive: true });
}

async function minifyFile(filePath, outputPath) {
    try {
        const code = fs.readFileSync(filePath, 'utf8');
        const result = await minify(code, {
            compress: {
                drop_console: false,
                dead_code: true,
                unused: true,
            },
            mangle: {
                toplevel: false,
            },
            format: {
                comments: false,
            },
        });

        if (result.code) {
            fs.writeFileSync(outputPath, result.code);
            const originalSize = fs.statSync(filePath).size;
            const minifiedSize = fs.statSync(outputPath).size;
            const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
            console.log(`✓ ${path.basename(filePath)} → ${path.basename(outputPath)} (${savings}% smaller)`);
            return true;
        }
    } catch (error) {
        console.error(`✗ Error minifying ${filePath}:`, error.message);
        return false;
    }
}

async function minifyAllFiles() {
    console.log('🔧 Minifying JavaScript files...\n');

    const files = fs.readdirSync(JS_SOURCE_DIR)
        .filter(file => file.endsWith('.js') && !file.endsWith('.min.js'));

    let successCount = 0;
    for (const file of files) {
        const sourcePath = path.join(JS_SOURCE_DIR, file);
        const outputPath = path.join(JS_OUTPUT_DIR, file.replace('.js', '.min.js'));
        
        if (await minifyFile(sourcePath, outputPath)) {
            successCount++;
        }
    }

    console.log(`\n✅ Minified ${successCount}/${files.length} files successfully`);
}

minifyAllFiles().catch(console.error);

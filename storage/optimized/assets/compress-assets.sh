#!/bin/bash
# Compress assets with gzip and brotli

find . -type f \( -name "*.css" -o -name "*.js" \) | while read -r file; do
    # Gzip compression
    if command -v gzip &> /dev/null; then
        gzip -k -9 "$file"
    fi
    
    # Brotli compression (if available)
    if command -v brotli &> /dev/null; then
        brotli -k -q 11 "$file"
    fi
done

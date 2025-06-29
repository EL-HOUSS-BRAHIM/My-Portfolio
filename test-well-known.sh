#!/bin/bash

# Script to verify .well-known files are working properly
# Author: Brahim El Houss
# Date: June 27, 2025

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Testing .well-known files accessibility..."

# Test security.txt
if curl -s --head "http://localhost/.well-known/security.txt" | grep "200 OK" > /dev/null; then
  echo -e "${GREEN}✓${NC} security.txt is accessible"
else
  echo -e "${RED}✗${NC} security.txt is NOT accessible"
fi

# Test Chrome DevTools JSON
if curl -s --head "http://localhost/.well-known/appspecific/com.chrome.devtools.json" | grep "200 OK" > /dev/null; then
  echo -e "${GREEN}✓${NC} com.chrome.devtools.json is accessible"
else
  echo -e "${RED}✗${NC} com.chrome.devtools.json is NOT accessible"
fi

echo "Done!"

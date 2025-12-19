#!/bin/bash

# Fix all relative imports in TypeScript files to include .js extensions
# This is required for ES modules to work correctly at runtime

cd "$(dirname "$0")/apps/api/src"

# Find all .ts files and add .js extensions to relative imports
find . -name "*.ts" -type f -exec sed -i '' \
  -e 's|from "\(\.\.\/[^"]*\)"|from "\1.js"|g' \
  -e "s|from '\(\.\.\/[^']*\)'|from '\1.js'|g" \
  -e 's|from "\(\.\/[^"]*\)"|from "\1.js"|g' \
  -e "s|from '\(\.\/[^']*\)'|from '\1.js'|g" \
  {} \;

# Fix double .js.js extensions that might have been created
find . -name "*.ts" -type f -exec sed -i '' \
  -e 's|\.js\.js"|.js"|g' \
  -e "s|\.js\.js'|.js'|g" \
  {} \;

echo "✅ Fixed all import paths to include .js extensions"

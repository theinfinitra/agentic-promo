#!/bin/bash

# Package Lambda function with proper src directory structure
set -e

echo "📦 Packaging Lambda function with flattened structure..."

# Create build directory
BUILD_DIR="build"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# Copy src contents to root level (flatten structure)
echo "📋 Copying src contents to root level..."
cp -r src/* $BUILD_DIR/

# Copy functions directory to root level
echo "📋 Copying functions contents to root level..."
if [ -d "functions" ]; then
    cp -r functions/* $BUILD_DIR/
    echo "✅ Functions directory included"
else
    echo "⚠️  Functions directory not found, skipping..."
fi

cd $BUILD_DIR

# Clean up
echo "🧹 Cleaning up package..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true
find . -name "*.pyo" -delete 2>/dev/null || true

# Create deployment package
echo "📦 Creating deployment package..."
zip -r ../agentic-promo-lambda.zip . -q

cd ..
echo "✅ Lambda package created: agentic-promo-lambda.zip"
echo "📊 Package size: $(du -h agentic-promo-lambda.zip | cut -f1)"

# Clean up build directory
rm -rf $BUILD_DIR

echo "🚀 Ready to deploy!"

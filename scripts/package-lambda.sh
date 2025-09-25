#!/bin/bash

# Package Lambda function with Strands Agents dependencies + Streaming
# Usage: ./package-lambda.sh

set -e

echo "📦 Packaging Streaming Lambda function for x86_64 architecture..."

# Create build directory
BUILD_DIR="build"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# Copy source code
echo "📋 Copying source code..."
cp -r src/* $BUILD_DIR/

# Install dependencies for x86_64 architecture
echo "🔧 Using existing Lambda layer for dependencies..."
cd $BUILD_DIR

# Copy only the source code - dependencies come from layer
echo "✅ Source code copied, using layer for dependencies"

# Remove unnecessary files to reduce package size
echo "🧹 Cleaning up package..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true
find . -name "*.pyo" -delete 2>/dev/null || true
find . -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true

# Create deployment package
echo "📦 Creating deployment package..."
zip -r ../agentic-promo-lambda.zip . -q

cd ..
echo "✅ Lambda package created: agentic-promo-lambda.zip"
echo "📊 Package size: $(du -h agentic-promo-lambda.zip | cut -f1)"
echo "🔧 Using existing Lambda layer for dependencies"
echo "🔧 Package contains only source code"

# Clean up build directory
rm -rf $BUILD_DIR

echo "🚀 Ready to deploy to Lambda with layer dependencies!"

#!/bin/bash

# Create Lambda layer with Strands Agents SDK
# Usage: ./create-layer.sh

set -e

echo "📦 Creating Lambda layer with Strands Agents SDK..."

# Create layer directory structure
LAYER_DIR="layer"
rm -rf $LAYER_DIR
mkdir -p $LAYER_DIR/python

# Install dependencies to layer
echo "🔧 Installing Strands Agents SDK..."
pip install strands-agents boto3 -t $LAYER_DIR/python/

# Remove unnecessary files
echo "🧹 Cleaning up layer..."
cd $LAYER_DIR/python
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true
find . -name "*.pyo" -delete 2>/dev/null || true
find . -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true
find . -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true

cd ../..

# Create layer zip
echo "📦 Creating layer package..."
cd $LAYER_DIR
zip -r ../strands-agents-layer.zip . -q
cd ..

echo "✅ Layer created: strands-agents-layer.zip"
echo "📊 Layer size: $(du -h strands-agents-layer.zip | cut -f1)"

# Clean up
rm -rf $LAYER_DIR

echo "🚀 Ready to deploy layer!"

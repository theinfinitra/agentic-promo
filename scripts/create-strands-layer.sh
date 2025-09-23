#!/bin/bash

# Create proper Strands Agents Lambda layer following official documentation
# Based on: https://strandsagents.com/latest/documentation/docs/user-guide/deploy/deploy_to_aws_lambda/

set -e

echo "📦 Creating Strands Agents Lambda layer (ARM64)..."

# Clean up previous attempts
rm -rf packaging
rm -f strands-agents-layer-arm64.zip

# Create proper directory structure
mkdir -p packaging/_dependencies

# Install dependencies with correct architecture for Lambda ARM64
echo "🔧 Installing Strands Agents SDK for ARM64..."
pip install strands-agents boto3 \
    --python-version 3.11 \
    --platform manylinux2014_aarch64 \
    --target ./packaging/_dependencies \
    --only-binary=:all:

# Create layer zip with proper structure
echo "📦 Creating layer package..."
cd packaging

# Create the layer zip with python/ directory structure
zip -r ../strands-agents-layer-arm64.zip . -q

cd ..

echo "✅ Layer created: strands-agents-layer-arm64.zip"
echo "📊 Layer size: $(du -h strands-agents-layer-arm64.zip | cut -f1)"

# Clean up
rm -rf packaging

echo "🚀 Ready to deploy ARM64 layer!"

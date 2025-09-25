#!/bin/bash

# Create proper Strands Agents Lambda layer following official documentation
# Based on: https://strandsagents.com/latest/documentation/docs/user-guide/deploy/deploy_to_aws_lambda/

set -e

echo "📦 Creating Strands Agents Lambda layer (x86_64)..."

# Clean up previous attempts
rm -rf packaging
rm -f strands-agents-layer-x86_64.zip

# Create proper directory structure
mkdir -p packaging/python

# Install dependencies with correct architecture for Lambda x86_64
echo "🔧 Installing Strands Agents SDK for x86_64..."
pip3 install strands-agents boto3 \
    --python-version 3.11 \
    --platform manylinux2014_x86_64 \
    --target ./packaging/python \
    --only-binary=:all:

# Create layer zip with proper structure
echo "📦 Creating layer package..."
cd packaging

# Create the layer zip with python/ directory structure
zip -r ../strands-agents-layer-x86_64.zip . -q

cd ..

echo "✅ Layer created: strands-agents-layer-x86_64.zip"
echo "📊 Layer size: $(du -h strands-agents-layer-x86_64.zip | cut -f1)"

# Clean up
rm -rf packaging

echo "🚀 Ready to deploy x86_64 layer!"

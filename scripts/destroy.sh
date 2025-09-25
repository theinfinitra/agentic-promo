#!/bin/bash

# Destroy Agentic Promotion Engine CloudFormation stack
# Usage: ./destroy.sh [stack-name] [profile] [region]

set -e

STACK_NAME=${1:-agentic-promo-dev}
PROFILE=${2:-infinitra-dev}
REGION=${3:-us-east-1}

echo "🗑️  Destroying stack: $STACK_NAME (profile: $PROFILE, region: $REGION)"

# Check if stack exists
if aws cloudformation describe-stacks --stack-name $STACK_NAME --profile $PROFILE --region $REGION >/dev/null 2>&1; then
    echo "📋 Stack found. Initiating deletion..."
    
    # Delete the CloudFormation stack
    aws cloudformation delete-stack \
        --stack-name $STACK_NAME \
        --profile $PROFILE \
        --region $REGION
    
    echo "⏳ Waiting for stack deletion to complete..."
    aws cloudformation wait stack-delete-complete \
        --stack-name $STACK_NAME \
        --profile $PROFILE \
        --region $REGION
    
    echo "✅ Stack $STACK_NAME deleted successfully!"
else
    echo "❌ Stack $STACK_NAME not found in region $REGION"
    exit 1
fi

echo "🧹 Cleanup complete!"

#!/bin/bash

# Agentic Promotion Engine - Deployment Script
# Usage: ./deploy.sh [stack-name] [environment]

set -e

STACK_NAME=${1:-agentic-promo-dev}
ENVIRONMENT=${2:-dev}
PROFILE="infinitra-dev"
REGION="us-east-1"

echo "🚀 Deploying Agentic Promotion Engine"
echo "Stack Name: $STACK_NAME"
echo "Environment: $ENVIRONMENT"
echo "Profile: $PROFILE"
echo "Region: $REGION"

# Package Lambda function
echo "📦 Packaging Lambda function..."
./scripts/package-lambda.sh

# Validate CloudFormation template
echo "📋 Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body file://infrastructure/cloudformation/main.yaml \
    --profile $PROFILE \
    --region $REGION

# Deploy the stack
echo "🏗️  Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file infrastructure/cloudformation/main.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides Environment=$ENVIRONMENT \
    --capabilities CAPABILITY_IAM \
    --profile $PROFILE \
    --region $REGION

# Update Lambda function code
echo "🔄 Updating Lambda function code..."
aws lambda update-function-code \
    --function-name $STACK_NAME-orchestrator \
    --zip-file fileb://agentic-promo-lambda.zip \
    --profile $PROFILE \
    --region $REGION

# Get outputs
echo "📤 Stack outputs:"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --profile $PROFILE \
    --region $REGION \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

echo "✅ Deployment complete!"
echo "🧪 Test your WebSocket endpoint with: scripts/test-websocket.html"

#!/bin/bash

# Agentic Promotion Engine - Deployment Script
# Usage: ./deploy.sh [stack-name] [profile] [region] [db-password]

set -e

STACK_NAME=${1:-agentic-promo}
PROFILE=${2:-infinitra-noone}
REGION=${3:-us-east-1}
DB_PASSWORD=${4}

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Error: Database password is required"
    echo "Usage: ./deploy.sh [stack-name] [profile] [region] [db-password]"
    echo "Example: ./deploy.sh agentic-promo infinitra-noone us-east-1 MySecurePassword123"
    exit 1
fi

echo "🚀 Deploying Agentic Promotion Engine with Aurora"
echo "Stack Name: $STACK_NAME"
echo "Profile: $PROFILE"
echo "Region: $REGION"

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
    --parameter-overrides Environment=prod DBPassword=$DB_PASSWORD \
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

# aws lambda update-function-code \
#     --function-name agentic-promo-orchestrator \
#     --zip-file fileb://agentic-promo-lambda.zip \
#     --profile infinitra-noone \
#     --region us-east-1

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

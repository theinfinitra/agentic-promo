#!/bin/bash

# Seed mock data for Agentic Promotion Engine
# Usage: ./seed-data.sh [stack-name]

set -e

STACK_NAME=${1:-agentic-promo-dev}
PROFILE="infinitra-dev"
REGION="us-east-1"

echo "🌱 Seeding mock data for $STACK_NAME"

# Get table names from CloudFormation outputs
PROMOTIONS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --profile $PROFILE \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`PromotionsTableName`].OutputValue' \
    --output text)

CUSTOMERS_TABLE="$STACK_NAME-customers"
ORDERS_TABLE="$STACK_NAME-orders"

echo "Tables: $PROMOTIONS_TABLE, $CUSTOMERS_TABLE, $ORDERS_TABLE"

# Seed Customers
echo "👥 Seeding customers..."
aws dynamodb put-item \
    --table-name $CUSTOMERS_TABLE \
    --item '{
        "id": {"S": "cust-001"},
        "name": {"S": "John Doe"},
        "email": {"S": "john@example.com"},
        "segment": {"S": "VIP"},
        "join_date": {"S": "2023-01-15"},
        "total_spent": {"N": "2500"}
    }' \
    --profile $PROFILE --region $REGION

aws dynamodb put-item \
    --table-name $CUSTOMERS_TABLE \
    --item '{
        "id": {"S": "cust-002"},
        "name": {"S": "Jane Smith"},
        "email": {"S": "jane@example.com"},
        "segment": {"S": "Premium"},
        "join_date": {"S": "2023-06-20"},
        "total_spent": {"N": "1200"}
    }' \
    --profile $PROFILE --region $REGION

aws dynamodb put-item \
    --table-name $CUSTOMERS_TABLE \
    --item '{
        "id": {"S": "cust-003"},
        "name": {"S": "Bob Wilson"},
        "email": {"S": "bob@example.com"},
        "segment": {"S": "Regular"},
        "join_date": {"S": "2024-01-10"},
        "total_spent": {"N": "450"}
    }' \
    --profile $PROFILE --region $REGION

# Seed Orders
echo "📦 Seeding orders..."
aws dynamodb put-item \
    --table-name $ORDERS_TABLE \
    --item '{
        "id": {"S": "order-001"},
        "customer_id": {"S": "cust-001"},
        "amount": {"N": "299.99"},
        "items": {"SS": ["laptop", "mouse"]},
        "date": {"S": "2024-01-15"},
        "status": {"S": "completed"}
    }' \
    --profile $PROFILE --region $REGION

aws dynamodb put-item \
    --table-name $ORDERS_TABLE \
    --item '{
        "id": {"S": "order-002"},
        "customer_id": {"S": "cust-002"},
        "amount": {"N": "89.99"},
        "items": {"SS": ["headphones"]},
        "date": {"S": "2024-01-20"},
        "status": {"S": "completed"}
    }' \
    --profile $PROFILE --region $REGION

# Seed Promotions
echo "🎯 Seeding promotions..."
aws dynamodb put-item \
    --table-name $PROMOTIONS_TABLE \
    --item '{
        "id": {"S": "promo-001"},
        "name": {"S": "VIP Customer Discount"},
        "description": {"S": "20% off for VIP customers"},
        "discount_percent": {"N": "20"},
        "status": {"S": "active"},
        "type": {"S": "batch"},
        "target_segment": {"S": "VIP"},
        "created_date": {"S": "2024-01-01"},
        "expiry_date": {"S": "2024-12-31"}
    }' \
    --profile $PROFILE --region $REGION

aws dynamodb put-item \
    --table-name $PROMOTIONS_TABLE \
    --item '{
        "id": {"S": "promo-002"},
        "name": {"S": "Cart Value Bonus"},
        "description": {"S": "Free shipping on orders over $100"},
        "status": {"S": "active"},
        "type": {"S": "realtime"},
        "min_cart_value": {"N": "100"},
        "benefit": {"S": "free_shipping"},
        "created_date": {"S": "2024-01-01"}
    }' \
    --profile $PROFILE --region $REGION

echo "✅ Mock data seeded successfully!"

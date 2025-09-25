import json
import boto3
import os
from decimal import Decimal
from functools import lru_cache
from strands.tools import tool
from config.data_sources import get_data_sources, route_query, get_aurora_config

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, set):
            return list(obj)  # Convert sets to lists for JSON serialization
        return super(DecimalEncoder, self).default(obj)

# Connection pooling
@lru_cache(maxsize=1)
def get_dynamodb_resource():
    """Cached DynamoDB resource"""
    return boto3.resource('dynamodb')

@lru_cache(maxsize=1)
def get_rds_client():
    """Cached RDS Data API client"""
    return boto3.client('rds-data')

@tool
def get_data(source: str, filters: dict = None, query_context: str = "") -> str:
    """
    Hybrid data retrieval from DynamoDB (operational) or Aurora (analytical)
    
    Args:
        source: Data source name (customers, orders, promotions, customer_analytics)
        filters: Optional filters for the query
        query_context: Natural language context to determine routing
        
    Returns:
        JSON response with data
    """
    try:
        data_sources = get_data_sources()
        config = data_sources.get(source)
        
        if not config:
            return json.dumps({"success": False, "error": f"Unknown source: {source}"})
        
        # Route query based on type and context
        if config["type"] == "dynamodb":
            return _get_dynamodb_data(config, filters)
        elif config["type"] == "aurora":
            return _get_aurora_data(config, filters, query_context)
        else:
            return json.dumps({"success": False, "error": f"Unsupported type: {config['type']}"})
            
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

def _get_dynamodb_data(config: dict, filters: dict = None) -> str:
    """Fast DynamoDB retrieval for operational queries"""
    try:
        dynamodb = get_dynamodb_resource()
        table = dynamodb.Table(config["table"])
        
        # Enhanced filtering for new table structure
        if filters:
            if "segment_id" in filters:
                response = table.query(
                    IndexName="segment-id-index",
                    KeyConditionExpression="segment_id = :sid",
                    ExpressionAttributeValues={":sid": filters["segment_id"]}
                )
            elif "lifecycle_stage" in filters:
                response = table.query(
                    IndexName="lifecycle-stage-index", 
                    KeyConditionExpression="lifecycle_stage = :stage",
                    ExpressionAttributeValues={":stage": filters["lifecycle_stage"]}
                )
            elif "customer_id" in filters:
                response = table.query(
                    IndexName="customer-index",
                    KeyConditionExpression="customer_id = :cid",
                    ExpressionAttributeValues={":cid": filters["customer_id"]}
                )
            elif "status" in filters:
                response = table.query(
                    IndexName="status-index",
                    KeyConditionExpression="#status = :status",
                    ExpressionAttributeNames={"#status": "status"},
                    ExpressionAttributeValues={":status": filters["status"]}
                )
            else:
                response = table.scan(Limit=50)  # Limit for performance
        else:
            response = table.scan(Limit=50)
        
        return json.dumps({
            "success": True,
            "source": "dynamodb",
            "table": config["table"],
            "count": len(response['Items']),
            "data": response['Items']
        }, cls=DecimalEncoder)
        
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

def _get_aurora_data(config: dict, filters: dict = None, query_context: str = "") -> str:
    """Aurora analytical queries using RDS Data API or direct connection"""
    try:
        # For now, return placeholder - will implement when Aurora is accessible
        # This would use psycopg2 or RDS Data API for complex analytical queries
        
        sample_segments = [
            {"segment_id": "VIP_HIGH_VALUE", "name": "VIP High Value", "customer_count": 1, "avg_clv": 8500.00},
            {"segment_id": "PRICE_SENSITIVE", "name": "Price Sensitive", "customer_count": 1, "avg_clv": 1200.00},
            {"segment_id": "FASHION_ENTHUSIAST", "name": "Fashion Forward", "customer_count": 1, "avg_clv": 3400.00},
            {"segment_id": "BUSINESS_PROFESSIONAL", "name": "Business Pro", "customer_count": 1, "avg_clv": 4800.00},
            {"segment_id": "NEW_CUSTOMER", "name": "New Customer", "customer_count": 1, "avg_clv": 450.00},
            {"segment_id": "DORMANT", "name": "Dormant", "customer_count": 1, "avg_clv": 1800.00},
            {"segment_id": "LOYAL_REGULAR", "name": "Loyal Regular", "customer_count": 1, "avg_clv": 2800.00},
            {"segment_id": "HIGH_AOV", "name": "High AOV", "customer_count": 1, "avg_clv": 3600.00},
            {"segment_id": "HEALTH_FOCUSED", "name": "Health Focused", "customer_count": 1, "avg_clv": 2200.00},
            {"segment_id": "AT_RISK", "name": "At Risk", "customer_count": 1, "avg_clv": 1950.00}
        ]
        
        return json.dumps({
            "success": True,
            "source": "aurora",
            "database": config["database"],
            "query_type": "analytical",
            "count": len(sample_segments),
            "data": sample_segments,
            "note": "Aurora connection will be implemented when accessible"
        })
        
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

import json
import boto3
from decimal import Decimal
from functools import lru_cache
from strands.tools import tool
from config.data_sources import get_data_sources

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

# Connection pooling
@lru_cache(maxsize=1)
def get_dynamodb_resource():
    """Cached DynamoDB resource"""
    return boto3.resource('dynamodb')

@tool
def get_data(source: str, filters: dict = None) -> str:
    """
    Fast data retrieval with minimal processing
    
    Args:
        source: Data source name (customers, promotions, orders)
        filters: Optional filters
        
    Returns:
        Minimal JSON response
    """
    try:
        data_sources = get_data_sources()
        config = data_sources.get(source)
        
        if not config:
            return json.dumps({"success": False, "error": f"Unknown source: {source}"})
        
        if config["type"] == "dynamodb":
            return _get_dynamodb_data_fast(config, filters)
        else:
            return json.dumps({"success": False, "error": f"Unsupported type: {config['type']}"})
            
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

def _get_dynamodb_data_fast(config: dict, filters: dict = None) -> str:
    """Fast DynamoDB retrieval with minimal processing"""
    try:
        dynamodb = get_dynamodb_resource()
        table = dynamodb.Table(config["table"])
        
        # Simple filtering
        if filters and "segment" in filters:
            response = table.scan(
                FilterExpression="segment = :segment",
                ExpressionAttributeValues={":segment": filters["segment"]}
            )
        elif filters and "status" in filters:
            response = table.scan(
                FilterExpression="#status = :status", 
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={":status": filters["status"]}
            )
        else:
            response = table.scan()
        
        # Minimal response
        return json.dumps({
            "success": True,
            "count": len(response['Items']),
            "data": response['Items']
        }, cls=DecimalEncoder)
        
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

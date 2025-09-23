import json
import boto3
import os
from decimal import Decimal
from datetime import datetime
from functools import lru_cache
from strands.tools import tool

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

@lru_cache(maxsize=1)
def get_dynamodb_resource():
    """Cached DynamoDB resource"""
    return boto3.resource('dynamodb')

@tool
def create_promotion(name: str, description: str, discount_percent: int, target_segment: str = "all") -> str:
    """
    Create a new promotion in the database
    
    Args:
        name: Promotion name (e.g., "VIP Summer Sale")
        description: Promotion description (e.g., "20% off for VIP customers")
        discount_percent: Discount percentage (e.g., 20)
        target_segment: Customer segment (e.g., "VIP", "Premium", "all")
        
    Returns:
        JSON string with creation result
    """
    try:
        dynamodb = get_dynamodb_resource()
        table = dynamodb.Table(os.environ['PROMOTIONS_TABLE'])
        
        promotion_id = f"promo-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Determine promotion type based on segment
        promo_type = "batch" if target_segment != "all" else "realtime"
        
        item = {
            'id': promotion_id,
            'name': name,
            'description': description,
            'discount_percent': discount_percent,
            'target_segment': target_segment,
            'type': promo_type,
            'status': 'active',
            'created_date': datetime.now().isoformat()
        }
        
        table.put_item(Item=item)
        
        return json.dumps({
            "success": True,
            "promotion_id": promotion_id,
            "created": item
        }, cls=DecimalEncoder)
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        })

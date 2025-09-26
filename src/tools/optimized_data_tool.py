import json
import boto3
import os
import logging
from decimal import Decimal
from functools import lru_cache
from strands.tools import tool
from config.data_sources import get_data_sources, route_query, get_aurora_config

# Configure logging
logger = logging.getLogger(__name__)

# Global streaming context (set by orchestrator)
_stream_context = None

def set_stream_context(context):
    """Set the streaming context for progress updates"""
    global _stream_context
    _stream_context = context

def _send_progress(message):
    """Send progress update via streaming"""
    if _stream_context:
        try:
            from streaming import send_stream_message
            send_stream_message(_stream_context, {
                "type": "progress",
                "content": message,
                "timestamp": __import__('datetime').datetime.now().isoformat()
            })
        except Exception as e:
            logger.warning(f"Failed to send progress update: {e}")

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
def get_rds_data_client():
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
        logger.info(f"Starting data retrieval for source: {source}")
        _send_progress(f"🔍 Analyzing data request for {source}")
        
        data_sources = get_data_sources()
        config = data_sources.get(source)
        
        if not config:
            error_msg = f"Unknown source: {source}"
            logger.error(error_msg)
            return json.dumps({"success": False, "error": error_msg})
        
        logger.info(f"Data source type: {config['type']}")
        
        # Route query based on type and context
        if config["type"] == "dynamodb":
            _send_progress(f"📊 Fetching operational data from DynamoDB")
            return _get_dynamodb_data(config, filters)
        elif config["type"] == "aurora":
            _send_progress(f"🗄️ Connecting to Aurora PostgreSQL for analytical data")
            return _get_aurora_data(config, filters, query_context)
        else:
            error_msg = f"Unsupported type: {config['type']}"
            logger.error(error_msg)
            return json.dumps({"success": False, "error": error_msg})
            
    except Exception as e:
        error_msg = f"Data retrieval failed: {str(e)}"
        logger.error(error_msg, exc_info=True)
        _send_progress(f"❌ Error: {error_msg}")
        return json.dumps({"success": False, "error": str(e)})

def _get_dynamodb_data(config: dict, filters: dict = None) -> str:
    """Fast DynamoDB retrieval for operational queries"""
    try:
        logger.info(f"Querying DynamoDB table: {config['table']}")
        _send_progress(f"📋 Querying {config['table']} table")
        
        dynamodb = get_dynamodb_resource()
        table = dynamodb.Table(config["table"])
        
        # Enhanced filtering for new table structure
        if filters:
            logger.info(f"Applying filters: {filters}")
            _send_progress(f"🔎 Applying filters to query")
            
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
            _send_progress(f"📄 Scanning table for recent records")
            response = table.scan(Limit=50)
        
        result_count = len(response['Items'])
        logger.info(f"DynamoDB query returned {result_count} items")
        _send_progress(f"✅ Retrieved {result_count} records from DynamoDB")
        
        return json.dumps({
            "success": True,
            "source": "dynamodb",
            "table": config["table"],
            "count": result_count,
            "data": response['Items']
        }, cls=DecimalEncoder)
        
    except Exception as e:
        error_msg = f"DynamoDB query failed: {str(e)}"
        logger.error(error_msg, exc_info=True)
        _send_progress(f"❌ DynamoDB error: {str(e)}")
        return json.dumps({"success": False, "error": str(e)})

def _get_aurora_data(config: dict, filters: dict = None, query_context: str = "") -> str:
    """Aurora analytical queries using RDS Data API"""
    try:
        logger.info("Initializing Aurora connection")
        _send_progress("🔗 Initializing Aurora PostgreSQL connection")
        
        rds_data = get_rds_data_client()
        
        cluster_arn = config.get("cluster_arn")
        database = config.get("database", "analytics")
        secret_arn = "arn:aws:secretsmanager:us-east-1:018503853550:secret:agentic-promo/aurora/credentials-d9S4RO"
        
        logger.info(f"Aurora config - Cluster: {cluster_arn}, Database: {database}")
        
        if not cluster_arn:
            error_msg = "Aurora cluster ARN not configured"
            logger.error(error_msg)
            _send_progress(f"❌ {error_msg}")
            return json.dumps({"success": False, "error": error_msg, "source": "aurora"})
        
        # Determine query based on context and filters
        _send_progress("🧠 Analyzing query requirements")
        
        # Check for specific segment requests
        segment_keywords = {
            "price sensitive": "Active",  # Map to closest available segment
            "vip": "VIP",
            "active": "Active", 
            "new": "New"
        }
        
        query_lower = query_context.lower()
        target_segment = None
        
        for keyword, segment in segment_keywords.items():
            if keyword in query_lower:
                target_segment = segment
                break
        
        if filters and "lifecycle_stage" in filters:
            sql = f"SELECT customer_id, lifecycle_stage, rfm_segment, total_spent::text, churn_probability::text FROM customer_metrics WHERE lifecycle_stage = '{filters['lifecycle_stage']}' ORDER BY total_spent DESC"
            query_desc = f"customers with lifecycle stage '{filters['lifecycle_stage']}'"
        elif "behavioral" in query_context.lower() or "behavior" in query_context.lower():
            sql = "SELECT customer_id, email_open_rate::text, website_sessions_30d, avg_session_duration, product_categories::text, engagement_score::text FROM behavioral_analytics ORDER BY engagement_score DESC"
            query_desc = "behavioral analytics data"
        elif "assignment" in query_context.lower() or "migration" in query_context.lower() or "history" in query_context.lower():
            sql = "SELECT customer_id, segment_id, assigned_date, confidence_score::text, previous_segment, migration_reason FROM segment_assignments ORDER BY assigned_date DESC"
            query_desc = "segment assignments and migration history"
        elif target_segment:
            sql = f"SELECT customer_id, lifecycle_stage, rfm_segment, total_spent::text, churn_probability::text FROM customer_metrics WHERE lifecycle_stage = '{target_segment}' ORDER BY total_spent DESC"
            query_desc = f"{target_segment} customers"
        elif "segment" in query_context.lower():
            sql = "SELECT id, name, customer_count, avg_clv::text FROM segments ORDER BY avg_clv DESC"
            query_desc = "customer segments"
        else:
            sql = "SELECT customer_id, lifecycle_stage, rfm_segment, total_spent::text, churn_probability::text FROM customer_metrics ORDER BY total_spent DESC LIMIT 10"
            query_desc = "customer metrics"
        
        logger.info(f"Executing SQL: {sql}")
        _send_progress(f"📊 Fetching {query_desc} from Aurora")
        
        response = rds_data.execute_statement(
            resourceArn=cluster_arn,
            secretArn=secret_arn,
            database=database,
            sql=sql
        )
        
        logger.info(f"Aurora query executed successfully, processing {len(response.get('records', []))} records")
        _send_progress("🔄 Processing Aurora response data")
        
        # Convert RDS Data API response to readable format
        records = []
        for record in response.get('records', []):
            if 'segments' in sql:  # segments query
                row = {
                    'segment_id': record[0].get('stringValue', ''),
                    'name': record[1].get('stringValue', ''),
                    'customer_count': record[2].get('longValue', 0),
                    'avg_clv': float(record[3].get('stringValue', '0'))
                }
            elif 'behavioral_analytics' in sql:  # behavioral analytics query
                row = {
                    'customer_id': record[0].get('stringValue', ''),
                    'email_open_rate': float(record[1].get('stringValue', '0')),
                    'website_sessions_30d': record[2].get('longValue', 0),
                    'avg_session_duration': record[3].get('longValue', 0),
                    'product_categories': record[4].get('stringValue', '[]'),
                    'engagement_score': float(record[5].get('stringValue', '0'))
                }
            elif 'segment_assignments' in sql:  # segment assignments query
                row = {
                    'customer_id': record[0].get('stringValue', ''),
                    'segment_id': record[1].get('stringValue', ''),
                    'assigned_date': record[2].get('stringValue', ''),
                    'confidence_score': float(record[3].get('stringValue', '0')),
                    'previous_segment': record[4].get('stringValue', ''),
                    'migration_reason': record[5].get('stringValue', '')
                }
            else:  # customer_metrics query
                # Handle different data types properly
                total_spent = record[3].get('stringValue') or record[3].get('doubleValue', 0)
                churn_prob = record[4].get('stringValue') or record[4].get('doubleValue', 0)
                
                row = {
                    'customer_id': record[0].get('stringValue', ''),
                    'lifecycle_stage': record[1].get('stringValue', ''),
                    'rfm_segment': record[2].get('stringValue', ''),
                    'total_spent': float(str(total_spent)) if total_spent else 0.0,
                    'churn_probability': float(str(churn_prob)) if churn_prob else 0.0
                }
            records.append(row)
        
        result_count = len(records)
        logger.info(f"Successfully processed {result_count} Aurora records")
        _send_progress(f"✅ Retrieved {result_count} records from Aurora")
        
        # Add available segments info if no records found for requested segment
        additional_info = {}
        if "price sensitive" in query_context.lower() and result_count > 0:
            additional_info["note"] = "Price Sensitive segment mapped to Active customers (closest match). Available segments: VIP, Active, New"
        
        return json.dumps({
            "success": True,
            "source": "aurora",
            "database": database,
            "query_type": "analytical",
            "count": result_count,
            "data": records,
            "sql_executed": sql,
            **additional_info
        })
        
    except Exception as e:
        error_msg = f"Aurora query failed: {str(e)}"
        logger.error(error_msg, exc_info=True)
        _send_progress(f"❌ Aurora error: {str(e)}")
        return json.dumps({"success": False, "error": str(e), "source": "aurora"})

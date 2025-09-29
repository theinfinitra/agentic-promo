import json
import boto3
import os
from decimal import Decimal
from functools import lru_cache
from strands.tools import tool
from strands.agent import Agent
from config.data_sources import get_data_agent_metadata, get_data_source_context, route_query

# Global streaming context (set by orchestrator)
_stream_context = None

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
            print(f"WARNING: Failed to send progress update: {e}")

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, set):
            return list(obj)
        return super(DecimalEncoder, self).default(obj)

@lru_cache(maxsize=1)
def get_dynamodb_resource():
    """Cached DynamoDB resource"""
    return boto3.resource('dynamodb')

@lru_cache(maxsize=1) 
def get_rds_data_client():
    """Cached RDS Data API client"""
    return boto3.client('rds-data')

# Data Agent - Intelligent multi-database orchestrator
class DataAgent:
    def __init__(self):
        self.metadata = get_data_agent_metadata()
        self.agent = Agent(
            model="us.anthropic.claude-sonnet-4-20250514-v1:0",
            system_prompt=self._get_system_prompt(),
            tools=[execute_dynamodb_query, execute_aurora_query]
        )
    
    def _get_system_prompt(self):
        context = get_data_source_context()
        return f"""You are a Data Agent responsible for intelligent data orchestration across DynamoDB and Aurora databases.

{context}

Your responsibilities:
1. Analyze user requests to understand data requirements
2. Plan multi-database query execution strategy
3. Execute queries sequentially across data sources
4. Consolidate results with business insights
5. Handle partial failures gracefully

Always stream progress updates and call out any errors or limitations in your response.
"""

    def process_request(self, user_request: str, stream_context=None) -> dict:
        """Main entry point for data agent processing"""
        global _stream_context
        _stream_context = stream_context
        
        try:
            _send_progress("🤖 Data Agent analyzing request")
            
            # Use Claude Sonnet 4 for intelligent analysis and execution
            response = self.agent(
                f"Analyze this data request and execute the necessary queries: {user_request}",
                stream=True if stream_context else False
            )
            
            return {
                "success": True,
                "agent_response": response,
                "source": "data_agent"
            }
            
        except Exception as e:
            error_msg = f"Data Agent processing failed: {str(e)}"
            _send_progress(f"❌ {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "source": "data_agent"
            }

    
    

# Global data agent instance
_data_agent = None

def get_data_agent():
    """Get or create data agent instance"""
    global _data_agent
    if _data_agent is None:
        _data_agent = DataAgent()
    return _data_agent

@tool
def execute_dynamodb_query(table_name: str, filters: dict = None, operation: str = "scan") -> str:
        """Execute DynamoDB query with intelligent routing"""
        try:
            _send_progress(f"📊 Executing DynamoDB {operation} on {table_name}")
            
            dynamodb = get_dynamodb_resource()
            table = dynamodb.Table(table_name)
            
            if operation == "scan":
                response = table.scan(Limit=50)
            elif operation == "query" and filters:
                # Intelligent index selection based on filters
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
                else:
                    response = table.scan(Limit=50)
            else:
                response = table.scan(Limit=50)
            
            result_count = len(response['Items'])
            _send_progress(f"✅ Retrieved {result_count} records from DynamoDB")
            
            return json.dumps({
                "success": True,
                "source": "dynamodb",
                "table": table_name,
                "count": result_count,
                "data": response['Items']
            }, cls=DecimalEncoder)
            
        except Exception as e:
            error_msg = f"DynamoDB query failed: {str(e)}"
            _send_progress(f"❌ DynamoDB error: {str(e)}")
            return json.dumps({"success": False, "error": error_msg, "source": "dynamodb"})


@tool
def execute_aurora_query(sql: str, description: str = "") -> str:
        """Execute Aurora SQL query with error handling"""
        try:
            _send_progress(f"🗄️ Executing Aurora query: {description}")
            metadata = get_data_agent_metadata()
            rds_data = get_rds_data_client()
            cluster_arn = metadata["connection_info"]["aurora"]["cluster_arn"]
            secret_arn = metadata["connection_info"]["aurora"]["secret_arn"]
            database = metadata["connection_info"]["aurora"]["database"]
            
            response = rds_data.execute_statement(
                resourceArn=cluster_arn,
                secretArn=secret_arn,
                database=database,
                sql=sql
            )
            
            # Convert RDS Data API response to readable format
            records = []
            for record in response.get('records', []):
                row = {}
                for i, field in enumerate(record):
                    if 'stringValue' in field:
                        row[f'col_{i}'] = field['stringValue']
                    elif 'longValue' in field:
                        row[f'col_{i}'] = field['longValue']
                    elif 'doubleValue' in field:
                        row[f'col_{i}'] = field['doubleValue']
                records.append(row)
            
            result_count = len(records)
            _send_progress(f"✅ Retrieved {result_count} records from Aurora")
            
            return json.dumps({
                "success": True,
                "source": "aurora",
                "count": result_count,
                "data": records,
                "sql": sql
            })
            
        except Exception as e:
            error_msg = f"Aurora query failed: {str(e)}"
            _send_progress(f"❌ Aurora error: {str(e)}")
            return json.dumps({"success": False, "error": error_msg, "source": "aurora"})

@tool
def process_data_request(user_request: str) -> str:
    """
    Data Agent Tool - Intelligent multi-database data orchestration
    
    Args:
        user_request: Natural language data request
        
    Returns:
        JSON response with consolidated data and analysis
    """
    try:
        _send_progress("🤖 Data Agent initializing")
        
        data_agent = get_data_agent()
        result = data_agent.process_request(user_request, _stream_context)
        
        return json.dumps(str(result), cls=DecimalEncoder)
        
    except Exception as e:
        error_msg = f"Data Agent Tool failed: {str(e)}"
        _send_progress(f"❌ {error_msg}")
        return json.dumps({
            "success": False,
            "error": error_msg,
            "source": "data_agent_tool"
        })

# Legacy compatibility function (deprecated)
@tool
def get_data(source: str, filters: dict = None, query_context: str = "") -> str:
    """
    DEPRECATED: Use process_data_request instead
    Legacy compatibility for existing orchestrator
    """
    return process_data_request(f"Get data from {source} with context: {query_context}")

def set_stream_context(context):
    """Set the streaming context for progress updates"""
    global _stream_context
    _stream_context = context

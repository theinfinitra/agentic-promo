import json
import boto3
import os
from decimal import Decimal
from functools import lru_cache
from strands.tools import tool
from strands.agent import Agent
from config.data_sources import get_data_agent_metadata, get_data_source_context, route_query

_stream_context = None
_global_callback = None

def set_global_callback(callback):
    """Set global callback handler for data agent"""
    global _global_callback
    _global_callback = callback

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
    def __init__(self, callback_handler=None):
        self.metadata = get_data_agent_metadata()
        self.agent = Agent(
            model="us.anthropic.claude-sonnet-4-20250514-v1:0",
            system_prompt=self._get_system_prompt(),
            tools=[execute_dynamodb_query, execute_aurora_query],
            callback_handler=callback_handler
        )
    
    def _get_system_prompt(self):
        context = get_data_source_context()
        return f"""You are a specialized Data Agent - the pure data operations expert of the system.

        {context}

        YOUR CORE EXPERTISE:
        - Multi-database query orchestration (DynamoDB + Aurora)
        - Data retrieval and consolidation
        - Query optimization and performance
        - Error handling and data validation

        YOUR RESPONSIBILITIES:
        1. Parse data requirements from user requests
        2. Generate optimal database queries
        3. Execute queries across multiple data sources
        4. Consolidate raw data from different sources
        5. Return clean, structured data output

        AVAILABLE TOOLS:
        - execute_dynamodb_query: For operational data queries
        - execute_aurora_query: For analytical data queries

        QUERY STRATEGY:
        - Use DynamoDB for real-time operational data (customers, promotions, orders)
        - Use Aurora for analytical queries (aggregations, joins, complex filtering)
        - Combine results when cross-database data consolidation is needed

        OUTPUT FORMAT:
        Always return structured JSON with:
        - success: boolean
        - data: array of raw results
        - source: data source information
        - count: number of records
        - metadata: query execution details

        YOU ARE RESPONSIBLE FOR:
        - Data retrieval and query execution
        - Data validation and error handling
        - Performance optimization
        - Raw data consolidation

        YOU ARE NOT RESPONSIBLE FOR:
        - Business analysis or insights generation
        - Data interpretation or recommendations
        - UI components or HTML generation
        - Business decisions or actions

        FOCUS: Be the fastest, most reliable data provider. Let specialized analysis agents handle interpretation.
        """

    def process_request(self, user_request: str, stream_context=None) -> dict:
        """Main entry point for data agent processing"""
        global _stream_context
        _stream_context = stream_context
        
        try:
            # Real LLM streaming from data agent - use agent's built-in streaming
            response = self.agent(
                f"Analyze this data request and execute the necessary queries: {user_request}",
                stream=True
            )
            
            return {
                "success": True,
                "agent_response": response,
                "source": "data_agent"
            }
            
        except Exception as e:
            error_msg = f"Data Agent processing failed: {str(e)}"
            return {
                "success": False,
                "error": error_msg,
                "source": "data_agent"
            }

    
    

# Global data agent instance
_data_agent = None
_current_callback = None

def get_data_agent(callback_handler=None):
    """Get or create data agent instance"""
    global _data_agent, _current_callback
    if _data_agent is None or _current_callback != callback_handler:
        _data_agent = DataAgent(callback_handler)
        _current_callback = callback_handler
    return _data_agent

@tool
def execute_dynamodb_query(table_name: str, filters: dict = None, operation: str = "scan") -> str:
        """Execute DynamoDB query with intelligent routing"""
        try:
            # Connection phase
            dynamodb = get_dynamodb_resource()
            table = dynamodb.Table(table_name)
            
            # Query execution with specific details
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
            
            return json.dumps({
                "success": True,
                "source": "dynamodb",
                "table": table_name,
                "count": result_count,
                "data": response['Items']
            }, cls=DecimalEncoder)
            
        except Exception as e:
            error_msg = f"DynamoDB query failed: {str(e)}"
            return json.dumps({"success": False, "error": error_msg, "source": "dynamodb"})


@tool
def execute_aurora_query(sql: str, description: str = "") -> str:
        """Execute Aurora SQL query with error handling"""
        try:
            # Connection phase
            metadata = get_data_agent_metadata()
            rds_data = get_rds_data_client()
            cluster_arn = metadata["connection_info"]["aurora"]["cluster_arn"]
            secret_arn = metadata["connection_info"]["aurora"]["secret_arn"]
            database = metadata["connection_info"]["aurora"]["database"]
            
            # Query execution phase
            response = rds_data.execute_statement(
                resourceArn=cluster_arn,
                secretArn=secret_arn,
                database=database,
                sql=sql
            )
            
            # Processing phase
            record_count = len(response.get('records', []))
            
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
            
            return json.dumps({
                "success": True,
                "source": "aurora",
                "count": result_count,
                "data": records,
                "sql": sql
            })
            
        except Exception as e:
            error_msg = f"Aurora query failed: {str(e)}"
            return json.dumps({"success": False, "error": error_msg, "source": "aurora"})

@tool
def process_data_request(user_request: str, callback_handler=None) -> str:
    """
    Data Agent Tool - Intelligent multi-database data orchestration
    
    Args:
        user_request: Natural language data request
        
    Returns:
        JSON response with consolidated data and analysis
    """
    try:
        # Phase 1: Initialize and analyze request
        request_lower = user_request.lower()
        
        data_agent = get_data_agent(callback_handler=_global_callback)
        result = data_agent.process_request(user_request, _stream_context)
        
        return json.dumps(str(result), cls=DecimalEncoder)
        
    except Exception as e:
        error_msg = f"Data Agent Tool failed: {str(e)}"
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

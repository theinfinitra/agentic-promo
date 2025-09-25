"""Strands-native streaming infrastructure using callback handlers"""

import json
import boto3
from datetime import datetime
from functools import lru_cache
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

@lru_cache(maxsize=1)
def get_websocket_client(endpoint_url):
    """Cached WebSocket client"""
    return boto3.client('apigatewaymanagementapi', endpoint_url=endpoint_url)

def send_stream_message(stream_context, message):
    """Send streaming message via WebSocket"""
    try:
        endpoint_url = f"https://{stream_context['domain_name']}/{stream_context['stage']}"
        client = get_websocket_client(endpoint_url)
        
        client.post_to_connection(
            ConnectionId=stream_context['connection_id'],
            Data=json.dumps(message, cls=DecimalEncoder)
        )
        return True
    except Exception as e:
        print(f"Error sending stream message: {e}")
        return False

def create_streaming_callback(stream_context):
    """Create Strands-native callback handler for streaming"""
    error_count = 0
    max_errors = 5  # Allow more errors before stopping
    
    def callback_handler(**kwargs):
        nonlocal error_count
        
        # Stop sending if too many errors
        if error_count >= max_errors:
            return
        
        success = True  # Default to success to avoid stopping on unknown events
        
        try:
            # Handle text generation (most common)
            if "data" in kwargs and isinstance(kwargs.get("data"), str):
                text_content = kwargs["data"]
                if text_content.strip():  # Only send non-empty content
                    success = send_stream_message(stream_context, {
                        "type": "text_chunk",
                        "content": text_content,
                        "timestamp": datetime.now().isoformat()
                    })
            
            # Handle tool usage
            elif "current_tool_use" in kwargs and kwargs["current_tool_use"]:
                tool_info = kwargs["current_tool_use"]
                if isinstance(tool_info, dict) and tool_info.get("name"):
                    success = send_stream_message(stream_context, {
                        "type": "tool_progress",
                        "tool": tool_info["name"],
                        "status": "executing",
                        "timestamp": datetime.now().isoformat()
                    })
            
            # Handle completion events
            elif "result" in kwargs or ("message" in kwargs and kwargs["message"]):
                success = send_stream_message(stream_context, {
                    "type": "message_complete",
                    "timestamp": datetime.now().isoformat()
                })
            
            # Track errors only for actual send attempts
            if not success:
                error_count += 1
            else:
                error_count = 0  # Reset on success
                
        except Exception as e:
            print(f"🔄 Callback error: {str(e)}")
            error_count += 1
    
    return callback_handler

import json
import boto3
import os
from decimal import Decimal
from functools import lru_cache
from strands.agent import Agent
from config.data_sources import get_data_source_context

# Import modular tools
from tools.optimized_data_tool import get_data
from tools.promotion_tool import create_promotion
from tools.email_tool import send_email
from tools.ui_agent_tool import generate_ui_component

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

@lru_cache(maxsize=1)
def get_websocket_client(endpoint_url):
    """Cached WebSocket client"""
    return boto3.client('apigatewaymanagementapi', endpoint_url=endpoint_url)

def send_websocket_message(connection_id, domain_name, stage, message):
    try:
        endpoint_url = f"https://{domain_name}/{stage}"
        client = get_websocket_client(endpoint_url)
        
        client.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(message, cls=DecimalEncoder)
        )
        return True
    except Exception as e:
        print(f"Error sending WebSocket message: {e}")
        return False

@lru_cache(maxsize=1)
def create_modular_agent():
    """Create agent with modular tools"""
    
    data_context = get_data_source_context()
    
    system_prompt = f"""
    Data and UI assistant with multiple capabilities.
    
    {data_context}
    
    AVAILABLE TOOLS:
    - get_data: Retrieve data from sources (customers, promotions, orders)
    - create_promotion: Create new promotions with name, description, discount
    - send_email: Send emails to customers or staff
    - generate_ui_component: Create UI configurations for optimal user experience
    
    WORKFLOW FOR DATA REQUESTS:
    1. Get requested data using get_data tool
    2. Generate UI component using generate_ui_component tool with output_format="html"
    3. Combine data + UI HTML in response
    
    WORKFLOW FOR CREATION REQUESTS:
    1. Generate form UI using generate_ui_component tool with output_format="html"
    2. When user submits form, use create_promotion tool
    3. Generate confirmation UI using generate_ui_component tool
    
    EXAMPLES:
    - "Show VIP customers" → get_data + generate_ui_component(output_format="html") for table
    - "Create promotion" → generate_ui_component(output_format="html") for form
    - "Email sent" → generate_ui_component(output_format="html") for notification
    
    Always use generate_ui_component to create rich UI configurations.
    Be concise and focus on user experience.
    """
    
    agent = Agent(
        model="us.amazon.nova-premier-v1:0",
        system_prompt=system_prompt,
        tools=[get_data, create_promotion, send_email, generate_ui_component]  # Added UI agent
    )
    
    return agent

def extract_structured_data_fast(response_text):
    """Fast structured data extraction with UI agent support"""
    try:
        # Look for HTML content in markdown blocks first
        import re
        
        # Extract HTML from ```html blocks
        html_block_pattern = r'```html\s*([\s\S]*?)\s*```'
        html_match = re.search(html_block_pattern, response_text, re.IGNORECASE)
        
        if html_match:
            html_content = html_match.group(1).strip()
            if html_content:
                return {
                    "type": "html",
                    "content": html_content
                }
        
        # Look for direct HTML tags
        html_tag_pattern = r'<(form|div|table|section|article)[^>]*>[\s\S]*?</\1>'
        html_tag_match = re.search(html_tag_pattern, response_text, re.IGNORECASE)
        
        if html_tag_match:
            html_content = html_tag_match.group(0).strip()
            return {
                "type": "html", 
                "content": html_content
            }
        
        # Look for UI component configuration JSON
        if '{' not in response_text:
            return None
            
        ui_start = response_text.find('{"type":')
        if ui_start >= 0:
            # Try to extract UI component JSON
            start = ui_start
            bracket_count = 1
            pos = start + 1
            
            while pos < len(response_text) and bracket_count > 0:
                if response_text[pos] == '{':
                    bracket_count += 1
                elif response_text[pos] == '}':
                    bracket_count -= 1
                pos += 1
            
            if bracket_count == 0:
                json_part = response_text[start:pos]
                try:
                    ui_config = json.loads(json_part)
                    if ui_config.get('type'):
                        return ui_config  # Return UI agent configuration directly
                except:
                    pass
        
        # Fallback to original data extraction
        start = response_text.find('{')
        end = response_text.rfind('}') + 1
        if start < 0 or end <= start:
            return None
            
        json_part = response_text[start:end]
        parsed_data = json.loads(json_part)
        
        if not parsed_data.get('success'):
            return None
            
        # Handle different data types (legacy support)
        if 'data' in parsed_data and parsed_data['data']:
            data = parsed_data['data']
            if len(data) > 0:
                first_item = data[0]
                if 'email' in first_item:
                    return {
                        "type": "table",
                        "data": data,
                        "columns": ["name", "email", "segment", "total_spent"]
                    }
                elif 'description' in first_item:
                    return {
                        "type": "table",
                        "data": data,
                        "columns": ["name", "description", "discount_percent", "target_segment", "type", "status"]
                    }
        elif 'created' in parsed_data:
            return {
                "type": "form",
                "data": parsed_data['created']
            }
        elif 'message_id' in parsed_data:
            return {
                "type": "notification",
                "data": {
                    "message": f"Email sent successfully to {parsed_data.get('sent_to')}",
                    "message_id": parsed_data['message_id']
                }
            }
        
        return None
    except Exception as e:
        print(f"Error extracting structured data: {e}")
        return None

def lambda_handler(event, context):
    """Modular agent Lambda handler"""
    try:
        connection_id = event['requestContext']['connectionId']
        domain_name = event['requestContext']['domainName']
        stage = event['requestContext']['stage']
        
        body = json.loads(event.get('body', '{}'))
        user_input = body.get('input', '')
        
        print(f"🔧 Modular Agent - Processing: {user_input}")
        
        # Use cached agent with modular tools
        agent = create_modular_agent()
        
        # Send acknowledgment
        send_websocket_message(connection_id, domain_name, stage, {
            "type": "acknowledgment",
            "message": "🔧 Modular agent with multiple tools processing..."
        })
        
        # Ensure user input is not empty and properly formatted
        if not user_input or not user_input.strip():
            user_input = "Hello, I need help with data analysis."
        
        # Execute agent with proper user message
        response = agent(user_input.strip())
        response_text = str(response)
        
        # Fast structured data extraction
        structured_data = extract_structured_data_fast(response_text)
        
        # Send final response
        final_response = {
            "type": "response",
            "chat_response": response_text,
            "structured_data": structured_data
        }
        
        send_websocket_message(connection_id, domain_name, stage, final_response)
        
        return {"statusCode": 200}
        
    except Exception as e:
        print(f"Error: {e}")
        
        error_response = {
            "type": "error",
            "message": f"🔧 Modular agent error: {str(e)}"
        }
        
        try:
            send_websocket_message(connection_id, domain_name, stage, error_response)
        except:
            pass
            
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}

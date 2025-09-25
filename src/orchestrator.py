import json
import boto3
import os
from decimal import Decimal
from functools import lru_cache
from strands.agent import Agent
from config.data_sources import get_data_source_context

# Import Strands tools directly (these are DecoratedFunctionTool objects)
from tools.optimized_data_tool import get_data
from tools.promotion_tool import create_promotion  
from tools.email_tool import send_email
from tools.ui_agent_tool import generate_ui_component
from tools.segmentation_tool import analyze_customer_segments, calculate_rfm_scores, get_segment_insights
from streaming import create_streaming_callback, send_stream_message

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def create_streaming_agent(stream_context):
    """Create agent with Strands-native streaming"""
    
    # Create streaming callback handler
    callback_handler = create_streaming_callback(stream_context)
    
    # Generate dynamic system prompt
    data_context = get_data_source_context()
    
    system_prompt = f"""
    Advanced promotion engine with hybrid data architecture and customer segmentation.
    
    {data_context}
    
    AVAILABLE TOOLS:
    - get_data: Hybrid data retrieval (DynamoDB operational + Aurora analytical)
    - analyze_customer_segments: Advanced segmentation analysis with RFM, behavioral insights
    - calculate_rfm_scores: RFM (Recency, Frequency, Monetary) scoring for customers
    - get_segment_insights: Actionable insights and recommendations for specific segments
    - create_promotion: Create targeted promotions with business logic
    - send_email: Send personalized emails via AWS SES
    - generate_ui_component: Generate UI component configurations (JSON) for frontend integration
    
    RESPONSE FORMATTING RULES:
    - NEVER return raw JSON to users
    - For "show/list/display" queries: Create HTML tables with proper styling
    - Use markdown for simple text responses
    - Make responses visually appealing and human-friendly
    
    HTML TABLE FORMAT FOR DATA DISPLAY:
    ```html
    <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
    <tr><th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Column</th></tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
    <tr><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Data</td></tr>
    </tbody>
    </table>
    </div>
    ```
    
    DATA MODIFICATION WORKFLOW (CRITICAL):
    - NEVER execute create/update/delete operations immediately
    - Always present a detailed plan first
    - Required details: amount, dates, target audience, conditions
    - Ask "Shall I proceed? Please confirm (yes/no)"
    - Only execute after explicit user confirmation
    
    INTENT DETECTION:
    - "show/list/display/view" → Get data + Format as HTML table
    - "create/update/delete/modify" → Plan + confirmation workflow
    - "analyze/insights/segments" → Analysis + HTML formatting
    - Use generate_ui_component only for interactive frontend components
    
    CONFIRMATION PATTERN FOR DATA CHANGES:
    1. "I understand you want to [action]"
    2. "Here's what I'll create/update:"
    3. "Details: [specific parameters needed]"
    4. "Shall I proceed? Please confirm."
    
    Always provide actionable insights with properly formatted, visually appealing responses.
    """
    
    agent = Agent(
        model="us.amazon.nova-premier-v1:0",
        system_prompt=system_prompt,
        tools=[get_data, create_promotion, send_email, generate_ui_component, 
               analyze_customer_segments, calculate_rfm_scores, get_segment_insights],  # Enhanced with segmentation tools
        callback_handler=callback_handler       # Strands-native streaming
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
    """Streaming modular agent Lambda handler"""
    try:
        connection_id = event['requestContext']['connectionId']
        domain_name = event['requestContext']['domainName']
        stage = event['requestContext']['stage']
        
        body = json.loads(event.get('body', '{}'))
        user_input = body.get('input', '')
        
        print(f"🔧 Streaming Agent - Processing: {user_input}")
        
        # Create streaming context
        stream_context = {
            'connection_id': connection_id,
            'domain_name': domain_name,
            'stage': stage
        }
        
        # Send acknowledgment
        send_stream_message(stream_context, {
            "type": "acknowledgment",
            "message": f"🔧 Starting workflow with 4 tools..."
        })
        
        # Ensure user input is not empty
        if not user_input or not user_input.strip():
            user_input = "Hello, I need help with data analysis."
        
        # Create streaming agent
        agent = create_streaming_agent(stream_context)
        
        print(f"🚀 Executing agent with streaming enabled...")
        
        # Execute agent with streaming
        response = agent(user_input.strip())
        response_text = str(response)
        
        print(f"✅ Agent execution complete. Response length: {len(response_text)}")
        
        # Fast structured data extraction
        structured_data = extract_structured_data_fast(response_text)
        
        # Send final response
        send_stream_message(stream_context, {
            "type": "response",
            "chat_response": response_text,
            "structured_data": structured_data
        })
        
        return {"statusCode": 200}
        
    except Exception as e:
        print(f"Error: {e}")
        
        error_response = {
            "type": "error",
            "message": f"🔧 Streaming agent error: {str(e)}"
        }
        
        try:
            send_stream_message(stream_context, error_response)
        except:
            pass
            
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}

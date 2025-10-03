import json
import os
from datetime import datetime
from decimal import Decimal
from strands.agent import Agent
from strands.agent.conversation_manager import SlidingWindowConversationManager
from strands.session.s3_session_manager import S3SessionManager

# from config.data_sources import get_data_source_context

# Import Strands tools directly (these are DecoratedFunctionTool objects)
from tools.data_agent_tool import process_data_request
from tools.promotion_tool import create_promotion  
from tools.email_tool import send_email
from tools.ui_agent_tool import generate_ui_component
from streaming import send_stream_message
# from utils.progress_manager import ProgressManager
from tools.data_agent_tool import set_global_callback as set_data_callback
from tools.ui_agent_tool import set_global_callback as set_ui_callback


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def create_streaming_agent(connection_id, stream_context, user_input="", callback_handler=None):
    """Create agent with Strands-native streaming and progress management"""
    
    # Initialize progress manager
    # progress_manager = ProgressManager(stream_context)
    
    # Create enhanced streaming callback that filters thinking content
    # def enhanced_callback(chunk=None, **kwargs):
    #     """Enhanced callback that accepts all Strands parameters"""
    #     if not chunk:
    #         return
            
    #     if chunk.get('type') == 'text_chunk':
    #         content = chunk.get('content', '')
    #         # Filter thinking content and send progress updates
    #         filtered_content = progress_manager.filter_thinking_content(content, user_input)
            
    #         # Only send non-empty filtered content
    #         if filtered_content:
    #             send_stream_message(stream_context, {
    #                 "type": "text_chunk",
    #                 "content": filtered_content,
    #                 "timestamp": datetime.now().isoformat()
    #             })
    #     elif chunk.get('type') == 'tool_call':
    #         # Send phase update when tools are called
    #         tool_name = chunk.get('tool_name', '')
    #         progress_manager.detect_tool_phase(tool_name, user_input)
    #         # Don't send the raw tool_call message to frontend
    #     else:
    #         # Pass through other message types unchanged
    #         send_stream_message(stream_context, chunk)
    
    
    # Generate dynamic system prompt
    # data_context = get_data_source_context() 
    # {data_context}

    # Create a conversation manager with custom window size
    conversation_manager = SlidingWindowConversationManager(
            window_size=20,  # Maximum number of messages to keep
            should_truncate_results=True, # Enable truncating the tool result when a message is too large for the model's context window 
        )

    session_manager = S3SessionManager(
            session_id=connection_id,
            bucket=os.environ.get('CHAT_SESSIONS_BUCKET')
        )

    
    system_prompt = f"""
        You are an intelligent orchestrator that delegates specialized tasks to expert agents and tools.

        

        CORE PRINCIPLE: You are a COORDINATOR, not a direct executor. Always delegate to specialized tools.

        AVAILABLE TOOLS:
        - process_data_request: For ALL data retrieval and analysis tasks
        - generate_ui_component: For ALL data visualization and UI generation
        - create_promotion: For creating promotions with business logic
        - send_email: For sending personalized emails via AWS SES

        DELEGATION RULES (CRITICAL):
        - Data requests → ALWAYS use process_data_request tool
        - Data visualization → ALWAYS use generate_ui_component tool
        - Promotion creation → ALWAYS use create_promotion tool
        - Email sending → ALWAYS use send_email tool

        INTENT DETECTION & DELEGATION:
        - "show/list/display/view" → process_data_request + generate_ui_component
        - "create/update/delete/modify" → Plan + confirmation workflow + appropriate tool
        - "analyze/insights/segments" → process_data_request + generate_ui_component
        - "send email" → send_email tool

        WORKFLOW PATTERN:
        1. Understand user intent
        2. Delegate to appropriate specialized tool(s)
        3. Coordinate results from multiple tools if needed
        4. Present final coordinated response

        NEVER:
        - Generate HTML tables directly
        - Execute database queries yourself
        - Create UI components inline
        - Return raw JSON to users

        ALWAYS:
        - Delegate data tasks to process_data_request
        - Delegate UI tasks to generate_ui_component
        - Coordinate between tools for complex requests
        - Provide context and insights around tool results

        FINAL RESPONSE:
        - Fomat the response in a structured manner:
            - Your understanding and reasoning for the request
            - html content
            - Key insights and recommendations

        You are the conductor of an orchestra - coordinate the specialists, don't play their instruments.
        """
    
    agent = Agent(
        model="us.amazon.nova-premier-v1:0",
        system_prompt=system_prompt,
        tools=[process_data_request, generate_ui_component, send_email],
        callback_handler=callback_handler,
        session_manager=session_manager,
        conversation_manager=conversation_manager
    )

    
    
    set_data_callback(callback_handler)
    set_ui_callback(callback_handler)
    
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

def classify_and_parse_input(user_input):
    """Smart input classification with structured data extraction"""
    try:
        # Form submissions - direct tool routing
        if user_input.startswith("Submit form:"):
            json_str = user_input.replace("Submit form:", "").strip()
            form_data = json.loads(json_str)
            return {
                "type": "direct_tool_call",
                "tool": "create_promotion",
                "params": form_data,
                "original": user_input
            }
        
        # Natural language - agent processing
        else:
            return {
                "type": "agent_processing",
                "input": user_input
            }
            
    except Exception as e:
        # Fallback to agent processing on any parsing error
        return {
            "type": "agent_processing", 
            "input": user_input
        }

def execute_tool_directly(tool_name, params):
    """Execute tool directly with structured parameters"""
    tools_map = {
        "create_promotion": create_promotion
    }
    
    if tool_name in tools_map:
        return tools_map[tool_name](**params)
    else:
        raise ValueError(f"Unknown tool: {tool_name}")

def lambda_handler(event, context):
    """Hybrid orchestrator with direct tool routing and agent processing"""
    try:
        connection_id = event['requestContext']['connectionId']
        domain_name = event['requestContext']['domainName']
        stage = event['requestContext']['stage']
        
        body = json.loads(event.get('body', '{}'))
        user_input = body.get('input', '')

        

        
        print(f"🔧 Hybrid Orchestrator - Processing: {user_input}")
        
        # Create streaming context
        stream_context = {
            'connection_id': connection_id,
            'domain_name': domain_name,
            'stage': stage
        }
        
        # Create streaming callback
        from streaming import create_streaming_callback
        callback_handler = create_streaming_callback(stream_context)
        
        # Classify and parse input
        parsed_request = classify_and_parse_input(user_input)
        
        if parsed_request["type"] == "direct_tool_call":
            # ORCHESTRATOR HANDLES: Direct tool execution
            print(f"🎯 Direct tool call: {parsed_request['tool']}")
            
            send_stream_message(stream_context, {
                "type": "acknowledgment",
                "message": f"🔧 Executing {parsed_request['tool']}..."
            })
            
            try:
                result = execute_tool_directly(
                    tool_name=parsed_request["tool"],
                    params=parsed_request["params"]
                )
                
                # Parse result for structured data
                result_data = json.loads(result) if isinstance(result, str) else result
                
                send_stream_message(stream_context, {
                    "type": "response",
                    "chat_response": f"✅ {parsed_request['tool']} completed successfully",
                    "structured_data": {
                        "type": "json",
                        "content": result_data
                    }
                })
                
            except Exception as tool_error:
                print(f"❌ Tool execution failed: {tool_error}")
                # Fallback to agent processing
                parsed_request = {
                    "type": "agent_processing",
                    "input": f"Handle form submission error: {str(tool_error)}. Original request: {user_input}"
                }
        
        if parsed_request["type"] == "agent_processing":
            # AGENT HANDLES: Natural language processing
            print(f"🤖 Agent processing: {parsed_request['input']}")
            
            send_stream_message(stream_context, {
                "type": "acknowledgment",
                "message": f"🔧 Starting AI analysis with 6 tools..."
            })
            
            # Ensure user input is not empty
            agent_input = parsed_request["input"]
            if not agent_input or not agent_input.strip():
                agent_input = "Hello, I need help with data analysis."
            
            # Create streaming agent with callback
            agent = create_streaming_agent(connection_id, stream_context, agent_input, callback_handler)
            
            print(f"🚀 Executing agent with streaming enabled...")
            
            # Execute agent with streaming
            response = agent(agent_input.strip())
            response_text = str(response)
            
            print(f"✅ Agent execution complete. Response length: {len(response_text)}")
            
            # Send final formatting phase
            send_stream_message(stream_context, {
                "type": "phase_update",
                "phase": "formatting",
                "message": "✨ Generating final response",
                "details": ["Creating data visualization", "Formatting insights"],
                "timestamp": datetime.now().isoformat()
            })
            
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

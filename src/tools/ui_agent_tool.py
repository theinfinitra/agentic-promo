import json
from strands.agent import Agent
from strands.tools import tool

@tool
def generate_ui_component(data_type: str, raw_data: str, user_intent: str, output_format: str = "json") -> str:
    """
    Generate UI component configuration using specialized UI agent
    
    Args:
        data_type: Type of data (customers, promotions, orders, notification)
        raw_data: JSON string of the actual data
        user_intent: What user wants to do (list, create, edit, confirm)
        output_format: "json" for config or "html" for ready-to-use HTML
        
    Returns:
        JSON string with UI component configuration or HTML string
    """
    try:
        # Create specialized UI agent
        ui_agent = Agent(
            model="us.amazon.nova-premier-v1:0",
            system_prompt=f"""
            You are a UI/UX specialist that generates component configurations.
            
            OUTPUT FORMAT: {output_format.upper()}
            
            EXPERTISE:
            - Table design: columns, sorting, actions, pagination
            - Form design: fields, validation, layout
            - Component selection: table vs form vs notification vs chart
            - User interactions: buttons, clicks, actions
            - HTML generation: Clean, semantic HTML with Tailwind CSS classes
            
            COMPONENT TYPES:
            - "table": For displaying lists of data
            - "form": For creating/editing data  
            - "notification": For confirmations and alerts
            - "card": For summaries and overviews
            
            {"JSON FORMAT:" if output_format == "json" else "HTML FORMAT:"}
            {'''
            Return valid JSON:
            {
              "type": "table|form|notification|card",
              "title": "Component title",
              "data": [...] or null,
              "config": {...component-specific configuration...}
            }
            ''' if output_format == "json" else '''
            Return clean HTML with Tailwind CSS classes:
            - Use semantic HTML elements
            - Add Tailwind classes for styling
            - Include interactive elements (buttons, forms)
            - Make it responsive and accessible
            '''}
            
            Be concise and focus on optimal user experience.
            """
        )
        
        # Generate UI configuration or HTML
        prompt = f"""
        Generate UI component for:
        
        Data Type: {data_type}
        User Intent: {user_intent}
        Raw Data: {raw_data}
        Output Format: {output_format.upper()}
        
        {"Create the best UI component configuration for this scenario." if output_format == "json" else "Generate clean, responsive HTML with Tailwind CSS for this scenario."}
        """
        
        response = ui_agent(prompt)
        return str(response)
        
    except Exception as e:
        # Fallback configuration
        if output_format == "html":
            return f'<div class="p-4 bg-red-100 text-red-700 rounded">UI Generation Error: {str(e)}</div>'
        else:
            return json.dumps({
                "type": "notification",
                "title": "UI Generation Error",
                "config": {
                    "message": f"Unable to generate UI: {str(e)}",
                    "variant": "error"
                }
            })

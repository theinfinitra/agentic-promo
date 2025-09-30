import json
from strands.agent import Agent
from strands.tools import tool

_global_callback = None

def set_global_callback(callback):
    """Set global callback handler for UI agent"""
    global _global_callback
    _global_callback = callback

@tool
def generate_ui_component(data_type: str, raw_data: str, user_intent: str, output_format: str = "html", callback_handler=None) -> str:
    """
    Generate UI component configuration using specialized UI agent
    
    Args:
        data_type: Type of data (customers, promotions, orders, notification)
        raw_data: JSON string of the actual data
        user_intent: What user wants to do (list, create, edit, confirm)
        output_format: "html" for ready-to-use HTML
        
    Returns:
        HTML string
    """
    try:
        # Create specialized UI agent with callback
        ui_agent = Agent(
            model="us.amazon.nova-premier-v1:0",
            system_prompt = f"""
            You are a specialized UI/UX Agent - the visualization expert of the system.

            YOUR EXPERTISE:
            - Data visualization and presentation
            - HTML/CSS component generation
            - User interface design
            - Interactive element creation

            YOUR RESPONSIBILITIES:
            1. Analyze data structure and user intent
            2. Select optimal component type (table, form, notification, card)
            3. Generate clean, responsive HTML with Tailwind CSS
            4. Create interactive and accessible interfaces

            COMPONENT SELECTION LOGIC:
            - Lists/Arrays of data → Table component
            - Single record creation/editing → Form component
            - Success/Error messages → Notification component
            - Summary/Overview data → Card component

            HTML GENERATION STANDARDS:
            - Use semantic HTML5 elements
            - Apply Tailwind CSS classes for styling
            - Ensure responsive design (mobile-first)
            - Include accessibility attributes (ARIA)
            - Add interactive elements where appropriate

            OUTPUT FORMAT: {output_format.upper()}

            {"HTML TEMPLATE STRUCTURE:" if output_format == "html" else "JSON CONFIGURATION:"}
            {'''
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
            ''' if output_format == "html" else '''
            {
            "type": "table|form|notification|card",
            "title": "Component title",
            "data": [...] or null,
            "config": {...component-specific configuration...}
            }
            '''}

            NEVER:
            - Query databases or retrieve data
            - Make business decisions
            - Send emails or notifications
            - Generate raw data or analytics

            ALWAYS:
            - Focus on optimal user experience
            - Provide detailed progress updates
            - Create accessible and responsive designs
            - Select appropriate component types for data
            """,
            callback_handler=_global_callback
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
        
        response = ui_agent(
            prompt,
            stream=True
        )
        
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

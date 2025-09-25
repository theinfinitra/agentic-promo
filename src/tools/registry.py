"""Tool registry for auto-discovery and streaming"""

TOOL_REGISTRY = {}

def register_tool(name: str):
    """Decorator to register tools for auto-discovery"""
    def decorator(tool_func):
        TOOL_REGISTRY[name] = tool_func
        return tool_func
    return decorator

def get_registered_tools():
    """Get all registered tools"""
    return TOOL_REGISTRY

def generate_tools_context():
    """Generate context string for agent prompt"""
    if not TOOL_REGISTRY:
        return "No tools available."
    
    context = "AVAILABLE TOOLS:\n"
    for name, func in TOOL_REGISTRY.items():
        doc = func.__doc__ or "No description available"
        # Extract first line of docstring
        first_line = doc.split('\n')[0].strip()
        context += f"- {name}: {first_line}\n"
    
    return context

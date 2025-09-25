"""Auto-discovery system for tools"""

import importlib
import os
from .registry import get_registered_tools

def auto_load_tools():
    """Auto-discover and load all tools in tools/ directory"""
    tools_dir = os.path.dirname(__file__)
    
    # Import all *_tool.py files to trigger registration
    for filename in os.listdir(tools_dir):
        if filename.endswith('_tool.py') and filename != '__init__.py':
            module_name = filename[:-3]  # Remove .py extension
            try:
                importlib.import_module(f'tools.{module_name}')
            except ImportError as e:
                print(f"Warning: Could not import {module_name}: {e}")
    
    return get_registered_tools()

# Auto-load tools when module is imported
AVAILABLE_TOOLS = auto_load_tools()

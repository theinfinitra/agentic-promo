import re
from typing import Optional, List
from datetime import datetime

class ProgressManager:
    def __init__(self, stream_context):
        self.stream_context = stream_context
        self.current_phase = None
        
    def send_phase_update(self, phase: str, message: str, details: List[str] = None):
        """Send structured phase update to frontend"""
        if not self.stream_context:
            return
            
        try:
            from streaming import send_stream_message
            progress_msg = {
                "type": "phase_update",
                "phase": phase,
                "message": message,
                "details": details or [],
                "timestamp": datetime.now().isoformat()
            }
            send_stream_message(self.stream_context, progress_msg)
            self.current_phase = phase
        except Exception as e:
            print(f"Failed to send phase update: {e}")
    
    def filter_thinking_content(self, content: str, user_request: str = "") -> str:
        """Remove thinking blocks and send contextual progress updates"""
        if not content:
            return content
            
        # Check if this is thinking content
        if '<thinking>' in content or content.strip().startswith('The user'):
            # Send contextual progress based on thinking content
            self._send_contextual_progress(content, user_request)
            # Remove thinking blocks
            filtered = re.sub(r'<thinking>.*?</thinking>', '', content, flags=re.DOTALL)
            return filtered.strip()
        
        return content
    
    def _send_contextual_progress(self, thinking_content: str, user_request: str):
        """Send context-aware progress messages based on thinking content"""
        content_lower = thinking_content.lower()
        request_lower = user_request.lower()
        
        # Detect analysis phase
        if any(word in content_lower for word in ['analyze', 'understand', 'identify', 'need to']):
            if 'vip' in request_lower and 'tech' in request_lower:
                self.send_phase_update(
                    "analyzing",
                    "🔍 Analyzing request for VIP tech customers",
                    ["Identifying required data sources", "Planning cross-database strategy"]
                )
            elif 'promotion' in request_lower and 'create' in request_lower:
                self.send_phase_update(
                    "analyzing", 
                    "🔍 Analyzing promotion creation request",
                    ["Understanding promotion requirements", "Identifying target segments"]
                )
            elif 'customer' in request_lower:
                self.send_phase_update(
                    "analyzing",
                    "🔍 Analyzing customer data request", 
                    ["Determining data sources", "Planning query strategy"]
                )
            else:
                self.send_phase_update("analyzing", "🔍 Analyzing your request")
        
        # Detect planning phase
        elif any(word in content_lower for word in ['plan', 'strategy', 'approach', 'should use']):
            self.send_phase_update(
                "planning",
                "⚡ Planning execution strategy",
                ["Generating database queries", "Optimizing data retrieval"]
            )
        
        # Detect consolidation phase  
        elif any(word in content_lower for word in ['consolidate', 'merge', 'combine', 'format']):
            self.send_phase_update(
                "consolidating",
                "🧠 Consolidating results",
                ["Merging data sources", "Applying business logic", "Generating insights"]
            )
    
    def detect_tool_phase(self, tool_name: str, user_request: str = ""):
        """Send phase update when tools are called"""
        request_lower = user_request.lower()
        
        if tool_name == 'process_data_request':
            if 'vip' in request_lower:
                self.send_phase_update(
                    "executing",
                    "🚀 Executing VIP customer analysis",
                    ["Querying customer databases", "Retrieving analytical data"]
                )
            elif 'promotion' in request_lower:
                self.send_phase_update(
                    "executing", 
                    "🚀 Processing promotion data",
                    ["Accessing promotion database", "Retrieving campaign information"]
                )
            else:
                self.send_phase_update(
                    "executing",
                    "🚀 Executing data operations",
                    ["Connecting to databases", "Running queries"]
                )
        elif tool_name == 'generate_ui_component':
            if 'table' in request_lower or 'list' in request_lower or 'show' in request_lower:
                self.send_phase_update(
                    "formatting",
                    "✨ Generating data visualization",
                    ["Creating interactive table", "Optimizing display layout"]
                )
            elif 'form' in request_lower or 'create' in request_lower:
                self.send_phase_update(
                    "formatting",
                    "✨ Generating interactive form",
                    ["Designing form fields", "Setting up validation"]
                )
            else:
                self.send_phase_update(
                    "formatting",
                    "✨ Generating UI components",
                    ["Creating user interface", "Optimizing user experience"]
                )
        elif tool_name == 'send_email':
            self.send_phase_update(
                "executing",
                "📧 Sending email notification",
                ["Composing message", "Delivering via AWS SES"]
            )

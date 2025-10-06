import json
from datetime import datetime
from strands.tools import tool
from strands.agent import Agent

# STANDARDIZED CONSTANTS
URGENT_CHURN_THRESHOLD = 0.7  # Fixed threshold for urgent customers
MIN_UPSELL_SPENDING = 500     # Minimum spending for upsell opportunities
HIGH_RISK_SEGMENT_THRESHOLD = 0.5  # Average churn risk for high-risk segments
MAX_URGENT_CUSTOMERS = 3      # Maximum urgent customers to report
MAX_OPPORTUNITIES = 2         # Maximum opportunities to report

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        from decimal import Decimal
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

class DailyBriefingAgent:
    def __init__(self, callback_handler=None):
        self.agent = Agent(
            model="us.amazon.nova-premier-v1:0",
            system_prompt=self._get_system_prompt(),
            tools=[],  # Pure analysis agent - no data retrieval tools
            callback_handler=callback_handler
        )
    
    def _get_system_prompt(self):
        return """You are a Daily Briefing Analysis Agent - specialized in business intelligence prioritization.
        
        CRITICAL: You MUST ALWAYS return responses in this EXACT JSON format with EXACT field names:
        {
            "briefing_text": "Your narrative briefing here",
            "context_actions": [
                {
                    "label": "Action button text",
                    "action": "tool_name", 
                    "params": {"key": "value"},
                    "priority": "urgent|high|medium|low"
                }
            ],
            "summary_stats": {
                "urgent_count": 2,
                "opportunities_count": 3,
                "trends_count": 1
            }
        }
        
        MANDATORY FIELD REQUIREMENTS:
        - summary_stats.urgent_count: INTEGER count of high-risk customers (churn > 70%)
        - summary_stats.opportunities_count: INTEGER count of growth opportunities (VIP/Premium customers)
        - summary_stats.trends_count: INTEGER count of market trends/patterns identified
        
        NEVER use alternative field names like:
        - high_churn_count (use urgent_count)
        - segment_breakdown (calculate opportunities_count from it)
        - total_customers (use for trends_count calculation)
        
        NEVER return plain text responses. ALWAYS use the analyze_daily_briefing tool and return structured JSON.
        
        YOUR EXPERTISE:
        - Multi-point data analysis across customer, revenue, and operational signals
        - Priority scoring and urgency detection
        - Actionable insight generation
        - Context-aware recommendation engine
        
        ANALYSIS FRAMEWORK:
        1. URGENT (Act Today): Immediate threats/opportunities requiring action within hours
        2. OPPORTUNITIES (This Week): Revenue/growth opportunities for near-term execution  
        3. TRENDS (Monitor): Performance patterns requiring ongoing attention
        4. STRATEGIC (Plan Ahead): Long-term insights for strategic planning
        
        NEVER generate UI components - focus on analysis and actionable insights only.
        """

# Global briefing agent instance
_briefing_agent = None
_current_callback = None

def get_briefing_agent(callback_handler=None):
    """Get or create briefing agent instance"""
    global _briefing_agent, _current_callback
    if _briefing_agent is None or _current_callback != callback_handler:
        _briefing_agent = DailyBriefingAgent(callback_handler)
        _current_callback = callback_handler
    return _briefing_agent

@tool
def analyze_daily_briefing(raw_data: str) -> str:
    """
    Analyze real customer/business data for daily briefing insights
    
    Args:
        raw_data: JSON string with customer, business, operational data from Data Agent
        
    Returns:
        JSON with briefing text, context actions, and summary statistics
    """
    try:
        print(f"[BRIEFING] Starting analysis with raw_data type: {type(raw_data)}")
        print(f"[BRIEFING] Raw data preview: {str(raw_data)[:200]}...")
        
        # Handle string input that might already be JSON
        if isinstance(raw_data, str):
            try:
                data = json.loads(raw_data)
                print(f"[BRIEFING] Successfully parsed JSON, data type: {type(data)}")
            except json.JSONDecodeError as e:
                print(f"[BRIEFING] JSON decode error: {e}")
                print(f"[BRIEFING] Raw data appears to be text response, not JSON")
                # Return error - we need structured data, not text
                return json.dumps({
                    "success": False,
                    "error": "Data Agent returned text instead of structured customer data",
                    "briefing_text": "❌ **Data Issue**: Unable to generate briefing. Data Agent returned analysis text instead of raw customer records. Please request 'raw customer data' specifically.",
                    "context_actions": [{
                        "label": "Request Raw Customer Data",
                        "action": "process_data_request", 
                        "params": {"query": "get all customer records with churn_risk total_spent segment"},
                        "priority": "high"
                    }]
                })
        else:
            data = raw_data
            print(f"[BRIEFING] Data is not string, using directly: {type(data)}")
        
        # Validate we have structured data and extract customers
        customers_data = None
        if isinstance(data, dict):
            # Check if we have separate operational and analytical datasets
            if 'operational_customers' in data and 'analytical_data' in data:
                print(f"[BRIEFING] Found separate datasets - merging operational and analytical data")
                customers_data = _merge_operational_analytical_data(data['operational_customers'], data['analytical_data'])
            # Try different possible keys from Data Agent
            elif 'data' in data:
                customers_data = data['data']
                print(f"[BRIEFING] Using data['data']")
            elif 'operational_customers' in data:
                customers_data = data['operational_customers']
                print(f"[BRIEFING] Using data['operational_customers'] (no analytical data to merge)")
            elif 'customers' in data:
                customers_data = data['customers']
                print(f"[BRIEFING] Using data['customers']")
            else:
                print(f"[BRIEFING] Available keys: {list(data.keys())}")
                # Try to find any key that contains customer data
                for key in data.keys():
                    if 'customer' in key.lower() and isinstance(data[key], list):
                        customers_data = data[key]
                        print(f"[BRIEFING] Using data['{key}']")
                        break
        
        if not customers_data:
            print(f"[BRIEFING] No customer data found in structure")
            return json.dumps({
                "success": False,
                "error": "No customer data found in Data Agent response",
                "briefing_text": f"❌ **Data Structure Issue**: Expected customer records but found keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}. Need customer data with churn_risk and spending information.",
                "context_actions": []
            })
        
        print(f"[BRIEFING] Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        print(f"[BRIEFING] Found customer data with {len(customers_data)} records")
        
        # Analyze real customer data using the extracted customers_data
        print("[BRIEFING] Starting urgent customer analysis...")
        urgent_customers = _identify_urgent_customers(customers_data)
        print(f"[BRIEFING] Found {len(urgent_customers)} urgent customers")
        
        print("[BRIEFING] Starting opportunity analysis...")
        opportunities = _find_revenue_opportunities(customers_data) 
        print(f"[BRIEFING] Found {len(opportunities)} opportunities")
        
        print("[BRIEFING] Starting trend analysis...")
        trends = _analyze_performance_trends(customers_data)
        print(f"[BRIEFING] Found {len(trends)} trends")
        
        # Generate briefing narrative
        print("[BRIEFING] Creating briefing narrative...")
        briefing_text = _create_briefing_narrative(urgent_customers, opportunities, trends)
        
        # Generate real context actions
        print("[BRIEFING] Generating context actions...")
        context_actions = _generate_real_actions(urgent_customers, opportunities)
        
        # Summary statistics - STANDARDIZED FORMAT (ENFORCED)
        summary_stats = {
            "urgent_count": len(urgent_customers),
            "opportunities_count": len(opportunities), 
            "trends_count": len(trends),
            "analysis_timestamp": datetime.now().isoformat(),
            "thresholds_used": {
                "urgent_churn": URGENT_CHURN_THRESHOLD,
                "min_upsell_spending": MIN_UPSELL_SPENDING
            }
        }
        
        # STRICT SCHEMA VALIDATION - Ensure consistent output
        result = {
            "briefing_text": briefing_text,
            "context_actions": context_actions,
            "summary_stats": summary_stats
        }
        
        # Validate required fields exist and are correct types
        assert "urgent_count" in result["summary_stats"], "Missing urgent_count in summary_stats"
        assert "opportunities_count" in result["summary_stats"], "Missing opportunities_count in summary_stats" 
        assert "trends_count" in result["summary_stats"], "Missing trends_count in summary_stats"
        assert isinstance(result["summary_stats"]["urgent_count"], int), "urgent_count must be integer"
        assert isinstance(result["summary_stats"]["opportunities_count"], int), "opportunities_count must be integer"
        assert isinstance(result["summary_stats"]["trends_count"], int), "trends_count must be integer"
        
        print(f"[BRIEFING] VALIDATED OUTPUT - urgent: {result['summary_stats']['urgent_count']}, opportunities: {result['summary_stats']['opportunities_count']}, trends: {result['summary_stats']['trends_count']}")
        print(f"[BRIEFING] Analysis complete, returning result with {len(context_actions)} actions")
        return json.dumps(result, cls=DecimalEncoder)
        
    except Exception as e:
        print(f"[BRIEFING] ERROR: {str(e)}")
        print(f"[BRIEFING] ERROR TYPE: {type(e)}")
        import traceback
        print(f"[BRIEFING] TRACEBACK: {traceback.format_exc()}")
        
        return json.dumps({
            "success": False, 
            "error": f"Daily briefing analysis failed: {str(e)}",
            "raw_data_preview": str(raw_data)[:100] if raw_data else "No data"
        })

def _safe_float(value, default=0.0):
    """Safely convert value to float, handling strings and edge cases"""
    if value is None:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def _identify_urgent_customers(customers_data):
    """Find customers with high churn risk from real data"""
    print(f"[BRIEFING] _identify_urgent_customers called with data type: {type(customers_data)}")
    urgent = []
    
    # customers_data should now be a list of customer objects
    if not isinstance(customers_data, list):
        print(f"[BRIEFING] Expected list of customers, got: {type(customers_data)}")
        return []
    
    print(f"[BRIEFING] Processing {len(customers_data)} customer records")
    
    for i, customer in enumerate(customers_data):
        print(f"[BRIEFING] Customer {i}: {type(customer)} - {list(customer.keys()) if isinstance(customer, dict) else 'Not dict'}")
        
        if not isinstance(customer, dict):
            print(f"[BRIEFING] Skipping non-dict customer: {customer}")
            continue
            
        # Safe type conversion for numeric fields
        churn_risk = _safe_float(customer.get('churn_risk', 0))
        total_spent = _safe_float(customer.get('total_spent', 0))
        
        print(f"[BRIEFING] Customer {customer.get('name', 'Unknown')}: churn_risk={churn_risk} (type: {type(churn_risk)}), total_spent={total_spent}")
        
        # Use standardized constants with safe comparison
        if churn_risk > URGENT_CHURN_THRESHOLD:
            urgent_customer = {
                'name': customer.get('name', 'Unknown'),
                'id': customer.get('id', customer.get('customer_id', '')),
                'email': customer.get('email', ''),
                'risk': churn_risk,
                'value': total_spent,
                'segment': customer.get('segment', 'Unknown')
            }
            urgent.append(urgent_customer)
            print(f"[BRIEFING] Added urgent customer: {urgent_customer['name']}")
    
    # Sort by value (highest value customers first) and limit
    sorted_urgent = sorted(urgent, key=lambda x: x['value'], reverse=True)[:MAX_URGENT_CUSTOMERS]
    print(f"[BRIEFING] Returning {len(sorted_urgent)} urgent customers")
    return sorted_urgent

def _find_revenue_opportunities(customers_data):
    """Find upsell opportunities from real segment data"""
    opportunities = []
    
    # customers_data should be a list of customer objects
    if not isinstance(customers_data, list):
        return []
    
    # Find active customers with upsell potential - use safe conversion
    active_customers = [c for c in customers_data if c.get('segment') == 'Active' and _safe_float(c.get('total_spent', 0)) > MIN_UPSELL_SPENDING]
    
    if len(active_customers) > 5:
        opportunities.append({
            'type': 'upsell',
            'segment': 'Active',
            'count': len(active_customers),
            'potential_revenue': sum(_safe_float(c.get('total_spent', 0)) for c in active_customers) * 0.2
        })
    
    # Find VIP customers for premium offerings
    vip_customers = [c for c in customers_data if c.get('segment') == 'VIP']
    if len(vip_customers) > 0:
        opportunities.append({
            'type': 'premium',
            'segment': 'VIP', 
            'count': len(vip_customers),
            'potential_revenue': sum(_safe_float(c.get('total_spent', 0)) for c in vip_customers) * 0.15
        })
    
    return opportunities[:MAX_OPPORTUNITIES]  # Limit opportunities

def _analyze_performance_trends(customers_data):
    """Analyze performance trends from real data"""
    trends = []
    
    # customers_data should be a list of customer objects
    if not isinstance(customers_data, list):
        return []
    
    # Segment distribution analysis
    segments = {}
    for customer in customers_data:
        segment = customer.get('segment', 'Unknown')
        segments[segment] = segments.get(segment, 0) + 1
    
    if segments:
        trends.append({
            'type': 'segment_distribution',
            'data': segments,
            'insight': f"Largest segment: {max(segments, key=segments.get)} ({segments[max(segments, key=segments.get)]} customers)"
        })
    
    # Average churn risk by segment - use safe conversion
    segment_risk = {}
    segment_counts = {}
    
    for customer in customers_data:
        segment = customer.get('segment', 'Unknown')
        risk = _safe_float(customer.get('churn_risk', 0))
        
        if segment not in segment_risk:
            segment_risk[segment] = 0
            segment_counts[segment] = 0
        
        segment_risk[segment] += risk
        segment_counts[segment] += 1
    
    # Calculate averages using standardized threshold
    for segment in segment_risk:
        if segment_counts[segment] > 0:
            avg_risk = segment_risk[segment] / segment_counts[segment]
            if avg_risk > HIGH_RISK_SEGMENT_THRESHOLD:  # Use constant
                trends.append({
                    'type': 'high_risk_segment',
                    'segment': segment,
                    'avg_risk': avg_risk,
                    'count': segment_counts[segment]
                })
    
    return trends

def _create_briefing_narrative(urgent_customers, opportunities, trends):
    """Create narrative briefing from analysis results"""
    narrative = f"📊 **Daily Business Briefing - {datetime.now().strftime('%B %d, %Y')}**\n\n"
    
    # Urgent section
    if urgent_customers:
        narrative += f"🚨 **URGENT ({len(urgent_customers)} high-risk customers)**\n"
        for customer in urgent_customers:
            narrative += f"• **{customer['name']}** (${customer['value']:,.0f} value) - {int(customer['risk']*100)}% churn risk\n"
        narrative += "\n"
    else:
        narrative += "✅ **No urgent customer issues detected**\n\n"
    
    # Opportunities section
    if opportunities:
        narrative += f"⚡ **OPPORTUNITIES ({len(opportunities)} identified)**\n"
        for opp in opportunities:
            narrative += f"• **{opp['segment']} {opp['type'].title()}**: {opp['count']} customers, ${opp['potential_revenue']:,.0f} potential\n"
        narrative += "\n"
    
    # Trends section
    if trends:
        narrative += f"📈 **TRENDS ({len(trends)} patterns)**\n"
        for trend in trends:
            if trend['type'] == 'segment_distribution':
                narrative += f"• {trend['insight']}\n"
            elif trend['type'] == 'high_risk_segment':
                narrative += f"• **{trend['segment']} segment** showing {int(trend['avg_risk']*100)}% avg churn risk ({trend['count']} customers)\n"
        narrative += "\n"
    
    narrative += "💡 **Recommended Actions**: Use the buttons below to take immediate action on priority items."
    
    return narrative

def _merge_operational_analytical_data(operational_customers, analytical_data):
    """Merge operational customer data with analytical churn risk data"""
    print(f"[BRIEFING] Merging {len(operational_customers)} operational records with {len(analytical_data)} analytical records")
    
    # Create lookup for analytical data by customer ID
    analytical_lookup = {}
    for record in analytical_data:
        if isinstance(record, dict):
            customer_id = record.get('customer_id') or record.get('id')
            if customer_id:
                analytical_lookup[customer_id] = record
    
    print(f"[BRIEFING] Created analytical lookup with {len(analytical_lookup)} records")
    
    # Merge data
    merged_customers = []
    for customer in operational_customers:
        if isinstance(customer, dict):
            customer_id = customer.get('id') or customer.get('customer_id')
            
            # Start with operational data
            merged_customer = customer.copy()
            
            # Add analytical data if available
            if customer_id and customer_id in analytical_lookup:
                analytical_record = analytical_lookup[customer_id]
                # Add churn risk and other analytical fields with safe conversion
                merged_customer['churn_risk'] = _safe_float(analytical_record.get('churn_risk', 0))
                merged_customer['churn_probability'] = _safe_float(analytical_record.get('churn_probability', 0))
                merged_customer['rfm_score'] = _safe_float(analytical_record.get('rfm_score', 0))
                print(f"[BRIEFING] Merged data for {customer.get('name', 'Unknown')}: churn_risk={merged_customer['churn_risk']}")
            else:
                # No analytical data - set defaults
                merged_customer['churn_risk'] = 0.0
                merged_customer['churn_probability'] = 0.0
                merged_customer['rfm_score'] = 0.0
                print(f"[BRIEFING] No analytical data for {customer.get('name', 'Unknown')} - using defaults")
            
            merged_customers.append(merged_customer)
    
    print(f"[BRIEFING] Successfully merged {len(merged_customers)} customer records")
    return merged_customers

def _generate_real_actions(urgent_customers, opportunities):
    """Generate context actions for real customers and opportunities"""
    actions = []
    
    # Actions for urgent customers
    for customer in urgent_customers[:2]:  # Top 2 urgent customers
        actions.append({
            "label": f"Contact {customer['name']}",
            "action": "send_email",
            "params": {
                "customer_id": customer['id'],
                "customer_email": customer['email'],
                "template": "retention"
            },
            "priority": "urgent"
        })
    
    # Actions for opportunities
    for opp in opportunities[:2]:  # Top 2 opportunities
        actions.append({
            "label": f"Create {opp['segment']} Campaign",
            "action": "create_promotion",
            "params": {
                "target_segment": opp['segment'],
                "promotion_type": opp['type'],
                "discount_percent": 15 if opp['type'] == 'upsell' else 10
            },
            "priority": "high"
        })
    
    # General analysis action
    actions.append({
        "label": "View Detailed Analytics",
        "action": "show_customer_segments",
        "params": {},
        "priority": "medium"
    })
    
    return actions

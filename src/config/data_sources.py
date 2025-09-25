import os
import json

# Hybrid Data Source Configuration - DynamoDB (Operational) + Aurora (Analytical)
DATA_SOURCES = {
    # DynamoDB - Operational Data (Fast lookups, real-time operations)
    "customers": {
        "type": "dynamodb",
        "table": os.environ.get('CUSTOMERS_TABLE', 'customers'),
        "description": "Customer profiles with current segments and preferences"
    },
    "orders": {
        "type": "dynamodb",
        "table": os.environ.get('ORDERS_TABLE', 'orders'),
        "description": "Order history and transaction data with behavioral flags"
    },
    "promotions": {
        "type": "dynamodb", 
        "table": os.environ.get('PROMOTIONS_TABLE', 'promotions'),
        "description": "Active and inactive promotion campaigns"
    },
    "customer_interactions": {
        "type": "dynamodb",
        "table": os.environ.get('CUSTOMER_INTERACTIONS_TABLE', 'customer-interactions'),
        "description": "Real-time customer engagement and interaction data"
    },
    "realtime_metrics": {
        "type": "dynamodb",
        "table": os.environ.get('REALTIME_METRICS_TABLE', 'realtime-metrics'),
        "description": "Live customer metrics and triggers"
    },
    
    # Aurora - Analytical Data (Complex queries, segmentation, insights)
    "customer_analytics": {
        "type": "aurora",
        "cluster_arn": os.environ.get('AURORA_CLUSTER_ARN'),
        "database": os.environ.get('AURORA_DATABASE_NAME', 'analytics'),
        "username": os.environ.get('AURORA_USERNAME', 'postgres'),
        "tables": {
            "customer_metrics": "RFM scores, CLV, churn probability, lifecycle stages",
            "behavioral_analytics": "Engagement patterns, channel preferences, product affinities",
            "segments": "Segment definitions, criteria, performance metrics",
            "segment_assignments": "Customer segment history and migration patterns"
        },
        "description": "Advanced customer analytics and segmentation data"
    }
}

# Query routing logic - determines which database to use based on query type
QUERY_ROUTING = {
    "operational": {
        "patterns": ["get customer", "show profile", "list orders", "create promotion", "update status"],
        "database": "dynamodb",
        "description": "Fast lookups, single record operations, real-time data"
    },
    "analytical": {
        "patterns": ["analyze", "segment", "rfm", "churn", "insights", "compare", "trends"],
        "database": "aurora", 
        "description": "Complex queries, aggregations, multi-table joins, ML insights"
    }
}

def get_data_sources():
    """Get current data source configuration"""
    return DATA_SOURCES

def get_aurora_config():
    """Get Aurora connection configuration"""
    return DATA_SOURCES.get("customer_analytics", {})

def route_query(query_text: str) -> str:
    """Determine which database to use based on query patterns"""
    query_lower = query_text.lower()
    
    # Check for analytical patterns
    for pattern in QUERY_ROUTING["analytical"]["patterns"]:
        if pattern in query_lower:
            return "aurora"
    
    # Default to operational (DynamoDB)
    return "dynamodb"

def get_data_source_context():
    """Generate LLM context about available data sources and routing"""
    context = "HYBRID DATA ARCHITECTURE:\n\n"
    
    context += "OPERATIONAL DATA (DynamoDB - Fast lookups):\n"
    for name, config in DATA_SOURCES.items():
        if config["type"] == "dynamodb":
            context += f"- {name}: {config['description']}\n"
    
    context += "\nANALYTICAL DATA (Aurora - Complex queries):\n"
    aurora_config = DATA_SOURCES.get("customer_analytics", {})
    if aurora_config:
        context += f"- customer_analytics: {aurora_config['description']}\n"
        for table, desc in aurora_config.get("tables", {}).items():
            context += f"  • {table}: {desc}\n"
    
    context += "\nQUERY ROUTING:\n"
    context += f"- Operational queries: {', '.join(QUERY_ROUTING['operational']['patterns'])}\n"
    context += f"- Analytical queries: {', '.join(QUERY_ROUTING['analytical']['patterns'])}\n"
    
    return context

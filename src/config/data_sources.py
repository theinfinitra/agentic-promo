import os
import json

# Data source configuration
DATA_SOURCES = {
    "customers": {
        "type": "dynamodb",
        "table": os.environ.get('CUSTOMERS_TABLE', 'customers'),
        "description": "Customer profiles with segments and spending data"
    },
    "promotions": {
        "type": "dynamodb", 
        "table": os.environ.get('PROMOTIONS_TABLE', 'promotions'),
        "description": "Active and inactive promotion campaigns"
    },
    "orders": {
        "type": "dynamodb",
        "table": os.environ.get('ORDERS_TABLE', 'orders'), 
        "description": "Order history and transaction data"
    }
}

def get_data_sources():
    """Get current data source configuration"""
    return DATA_SOURCES

def get_data_source_context():
    """Generate LLM context about available data sources"""
    context = "AVAILABLE DATA SOURCES:\n"
    for name, config in DATA_SOURCES.items():
        context += f"- {name}: {config['description']} (stored in {config['type']})\n"
    return context

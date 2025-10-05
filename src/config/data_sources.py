import os
import json

# Hybrid Data Source Configuration - DynamoDB (Operational) + Aurora (Analytical)
DATA_SOURCES = {
    # DynamoDB - Operational Data (Fast lookups, real-time operations)
    "customers": {
        "type": "dynamodb",
        "table": "agentic-promo-customers-v2",
        "description": "Customer profiles with current segments and preferences",
        "schema": {
            "primary_key": "id (String)",
            "indexes": [
                "lifecycle-stage-index (lifecycle_stage)",
                "segment-index (segment)", 
                "segment-id-index (segment_id)"
            ],
            "attributes": {
                "id": "String - Customer unique identifier",
                "name": "String - Customer full name",
                "email": "String - Customer email address",
                "join_date": "String - Customer registration date (YYYY-MM-DD)",
                "total_spent": "Number - Total amount spent by customer",
                "lifecycle_stage": "String - Current lifecycle (Active, Dormant, VIP, etc.)",
                "segment": "String - Business segment (Regular, VIP, etc.)",
                "segment_id": "String - Technical segment ID (PRICE_SENSITIVE, DORMANT, etc.)",
                "last_segment_update": "String - Last segment calculation timestamp",
                "preferences": "Map - Customer preferences with channel and categories"
            }
        },
        "sample_data": {
            "id": "cust-002",
            "name": "Mike Johnson", 
            "email": "mike.johnson@email.com",
            "join_date": "2023-03-10",
            "total_spent": 1200,
            "lifecycle_stage": "Active",
            "segment": "Regular",
            "segment_id": "PRICE_SENSITIVE",
            "preferences": {
                "channel": "website",
                "categories": ["basics", "home"]
            }
        },
        "relationships": {
            "orders": "customers.id -> orders.customer_id",
            "aurora_customer_metrics": "customers.id -> customer_metrics.customer_id",
            "aurora_segment_assignments": "customers.id -> segment_assignments.customer_id"
        }
    },
    
    "orders": {
        "type": "dynamodb",
        "table": "agentic-promo-orders-v2",
        "description": "Order history and transaction data with behavioral flags",
        "schema": {
            "primary_key": "id (String)",
            "indexes": [
                "customer-index (customer_id, date)"
            ],
            "attributes": {
                "id": "String - Order unique identifier",
                "customer_id": "String - Reference to customer",
                "date": "String - Order date (YYYY-MM-DD)",
                "amount": "Number - Order total amount",
                "status": "String - Order status (completed, pending, etc.)",
                "items": "StringSet - Product categories purchased",
                "behavioral_flags": "Map - Channel and seasonal behavior indicators"
            }
        },
        "sample_data": {
            "id": "order-002-2",
            "customer_id": "cust-002",
            "date": "2023-03-13",
            "amount": 136,
            "status": "completed",
            "items": ["basics", "home-goods"],
            "behavioral_flags": {
                "channel": "website",
                "seasonal": "budget_conscious"
            }
        },
        "relationships": {
            "customers": "orders.customer_id -> customers.id"
        }
    },
    
    "promotions": {
        "type": "dynamodb",
        "table": "agentic-promo-promotions",
        "description": "Active and inactive promotion campaigns",
        "schema": {
            "primary_key": "id (String)",
            "indexes": [
                "status-index (status)"
            ],
            "attributes": {
                "id": "String - Promotion unique identifier",
                "name": "String - Promotion display name",
                "description": "String - Promotion details",
                "type": "String - Promotion type (segment, individual, etc.)",
                "target_segment": "String - Target segment ID",
                "discount_percent": "Number - Discount percentage",
                "status": "String - Promotion status (active, inactive, expired)",
                "created_date": "String - Creation date (YYYY-MM-DD)"
            }
        },
        "sample_data": {
            "id": "promo-002",
            "name": "New Customer Welcome",
            "description": "15% off first purchase over $100",
            "type": "segment",
            "target_segment": "NEW_CUSTOMER",
            "discount_percent": 15,
            "status": "active",
            "created_date": "2024-01-01"
        },
        "relationships": {
            "aurora_segments": "promotions.target_segment -> segments.id"
        }
    
    
    # "customer_interactions": {
    #     "type": "dynamodb",
    #     "table": "agentic-promo-customer-interactions",
    #     "description": "Real-time customer engagement and interaction data",
    #     "schema": {
    #         "primary_key": "TBD - Table structure to be analyzed",
    #         "attributes": "TBD - Interaction tracking fields"
    #     }
    # },
    
    # "realtime_metrics": {
    #     "type": "dynamodb", 
    #     "table": "agentic-promo-realtime-metrics",
    #     "description": "Live customer metrics and triggers",
    #     "schema": {
    #         "primary_key": "TBD - Table structure to be analyzed",
    #         "attributes": "TBD - Real-time metric fields"
    #     }
    },
    
    # Aurora - Analytical Data (Complex queries, segmentation, insights)
    "customer_analytics": {
        "type": "aurora",
        "cluster_arn": os.environ.get('AURORA_CLUSTER_ARN'), # "arn:aws:rds:us-east-1:018503853550:cluster:agentic-promo-analytics-cluster"
        "secret_arn": os.environ.get('AURORA_SECRET_ARN'), # "arn:aws:secretsmanager:us-east-1:018503853550:secret:agentic-promo/aurora/credentials-d9S4RO"
        "database": "analytics",
        "description": "Advanced customer analytics and segmentation data",
        "tables": {
            "customer_metrics": {
                "description": "RFM scores, CLV, churn probability, lifecycle stages",
                "schema": {
                    "primary_key": "customer_id (varchar)",
                    "columns": {
                        "customer_id": "varchar NOT NULL - Customer identifier",
                        "total_orders": "integer - Total number of orders",
                        "total_spent": "numeric - Total amount spent",
                        "avg_order_value": "numeric - Average order value",
                        "days_since_last_order": "integer - Recency metric",
                        "recency_score": "integer - RFM recency score (1-5)",
                        "frequency_score": "integer - RFM frequency score (1-5)",
                        "monetary_score": "integer - RFM monetary score (1-5)",
                        "rfm_segment": "varchar - RFM segment code (e.g., '555')",
                        "lifecycle_stage": "varchar - Customer lifecycle stage",
                        "churn_probability": "numeric - Churn prediction score (0-1)",
                        "last_calculated": "timestamp - Last calculation time"
                    }
                },
                "sample_data": {
                    "customer_id": "cust-001",
                    "total_orders": 45,
                    "total_spent": 8500.00,
                    "avg_order_value": 188.89,
                    "days_since_last_order": 15,
                    "recency_score": 5,
                    "frequency_score": 5,
                    "monetary_score": 5,
                    "rfm_segment": "555",
                    "lifecycle_stage": "VIP",
                    "churn_probability": 0.05
                }
            },
            
            "behavioral_analytics": {
                "description": "Engagement patterns, channel preferences, product affinities",
                "schema": {
                    "primary_key": "customer_id (varchar)",
                    "columns": {
                        "customer_id": "varchar NOT NULL - Customer identifier",
                        "email_open_rate": "numeric - Email engagement rate",
                        "website_sessions_30d": "integer - Website sessions last 30 days",
                        "avg_session_duration": "integer - Average session duration in seconds",
                        "product_categories": "jsonb - Product category preferences and scores",
                        "engagement_score": "numeric - Overall engagement score"
                    }
                }
            },
            
            "segments": {
                "description": "Segment definitions, criteria, performance metrics",
                "schema": {
                    "primary_key": "id (varchar)",
                    "columns": {
                        "id": "varchar NOT NULL - Segment identifier",
                        "name": "varchar - Segment display name",
                        "criteria": "text - Segment definition criteria",
                        "customer_count": "integer - Number of customers in segment",
                        "avg_clv": "numeric - Average customer lifetime value",
                        "created_date": "date - Segment creation date",
                        "last_updated": "timestamp - Last update timestamp"
                    }
                },
                "sample_data": {
                    "id": "VIP",
                    "name": "VIP Customers",
                    "criteria": "rfm_segment = '555' AND lifecycle_stage = 'VIP'",
                    "customer_count": 1,
                    "avg_clv": 8500.00,
                    "created_date": "2024-01-01"
                }
            },
            
            "segment_assignments": {
                "description": "Customer segment history and migration patterns",
                "schema": {
                    "primary_key": "customer_id, segment_id (varchar)",
                    "columns": {
                        "customer_id": "varchar NOT NULL - Customer identifier",
                        "segment_id": "varchar NOT NULL - Segment identifier",
                        "assigned_date": "timestamp NOT NULL - Assignment timestamp",
                        "confidence_score": "numeric - Assignment confidence (0-1)",
                        "previous_segment": "varchar - Previous segment ID",
                        "migration_reason": "varchar - Reason for segment change"
                    }
                }
            }
        },
        "relationships": {
            "dynamodb_customers": "customer_metrics.customer_id -> customers.id",
            "segments_to_assignments": "segments.id -> segment_assignments.segment_id"
        }
    }
}

# Query routing logic - determines which database to use based on query type
QUERY_ROUTING = {
    "operational": {
        "patterns": ["get customer", "show profile", "list orders", "create promotion", "update status", "find customer", "customer details"],
        "database": "dynamodb",
        "description": "Fast lookups, single record operations, real-time data",
        "use_cases": [
            "Customer profile lookup",
            "Order history retrieval", 
            "Promotion management",
            "Real-time status updates"
        ]
    },
    "analytical": {
        "patterns": ["analyze", "segment", "rfm", "churn", "insights", "compare", "trends", "metrics", "performance", "behavior"],
        "database": "aurora", 
        "description": "Complex queries, aggregations, multi-table joins, ML insights",
        "use_cases": [
            "Customer segmentation analysis",
            "RFM scoring and insights",
            "Churn prediction",
            "Behavioral analytics",
            "Segment performance metrics"
        ]
    }
}

# Cross-database relationships for data agent context
CROSS_DATABASE_RELATIONSHIPS = {
    "customer_360": {
        "description": "Complete customer view combining operational and analytical data",
        "primary_source": "dynamodb.customers",
        "enrichment_sources": [
            "aurora.customer_metrics",
            "aurora.behavioral_analytics", 
            "aurora.segment_assignments"
        ],
        "join_key": "customer_id = id"
    },
    "segment_analysis": {
        "description": "Segment performance with customer details",
        "primary_source": "aurora.segments",
        "enrichment_sources": [
            "aurora.segment_assignments",
            "dynamodb.customers",
            "dynamodb.orders"
        ],
        "join_keys": [
            "segments.id = segment_assignments.segment_id",
            "segment_assignments.customer_id = customers.id",
            "customers.id = orders.customer_id"
        ]
    },
    "promotion_targeting": {
        "description": "Promotion effectiveness with customer segments",
        "primary_source": "dynamodb.promotions", 
        "enrichment_sources": [
            "aurora.segments",
            "aurora.customer_metrics"
        ],
        "join_key": "promotions.target_segment = segments.id"
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

def get_table_schema(data_source: str, table_name: str = None) -> dict:
    """Get detailed schema information for a specific table"""
    source_config = DATA_SOURCES.get(data_source, {})
    
    if source_config.get("type") == "dynamodb":
        return source_config.get("schema", {})
    elif source_config.get("type") == "aurora" and table_name:
        tables = source_config.get("tables", {})
        return tables.get(table_name, {}).get("schema", {})
    
    return {}

def get_sample_data(data_source: str, table_name: str = None) -> dict:
    """Get sample data for understanding data structure"""
    source_config = DATA_SOURCES.get(data_source, {})
    
    if source_config.get("type") == "dynamodb":
        return source_config.get("sample_data", {})
    elif source_config.get("type") == "aurora" and table_name:
        tables = source_config.get("tables", {})
        return tables.get(table_name, {}).get("sample_data", {})
    
    return {}

def get_relationships(data_source: str) -> dict:
    """Get relationship information for cross-database queries"""
    source_config = DATA_SOURCES.get(data_source, {})
    return source_config.get("relationships", {})

def get_data_source_context():
    """Generate comprehensive LLM context about available data sources"""
    context = "# HYBRID DATA ARCHITECTURE METADATA\n\n"
    
    context += "## OPERATIONAL DATA (DynamoDB - Fast Lookups)\n"
    for name, config in DATA_SOURCES.items():
        if config["type"] == "dynamodb":
            context += f"\n### {name.upper()}\n"
            context += f"**Table**: {config.get('table', 'N/A')}\n"
            context += f"**Description**: {config['description']}\n"
            
            schema = config.get("schema", {})
            if schema:
                context += f"**Primary Key**: {schema.get('primary_key', 'N/A')}\n"
                if schema.get("indexes"):
                    context += f"**Indexes**: {', '.join(schema['indexes'])}\n"
                
                if schema.get("attributes"):
                    context += "**Attributes**:\n"
                    for attr, desc in schema["attributes"].items():
                        context += f"  - {attr}: {desc}\n"
            
            sample = config.get("sample_data", {})
            if sample:
                context += f"**Sample Data**: {json.dumps(sample, indent=2)}\n"
    
    context += "\n## ANALYTICAL DATA (Aurora PostgreSQL - Complex Queries)\n"
    aurora_config = DATA_SOURCES.get("customer_analytics", {})
    if aurora_config:
        context += f"**Cluster**: {aurora_config.get('cluster_arn', 'N/A')}\n"
        context += f"**Database**: {aurora_config.get('database', 'N/A')}\n"
        context += f"**Description**: {aurora_config['description']}\n\n"
        
        for table_name, table_config in aurora_config.get("tables", {}).items():
            context += f"### {table_name.upper()}\n"
            context += f"**Description**: {table_config['description']}\n"
            
            schema = table_config.get("schema", {})
            if schema:
                context += f"**Primary Key**: {schema.get('primary_key', 'N/A')}\n"
                if schema.get("columns"):
                    context += "**Columns**:\n"
                    for col, desc in schema["columns"].items():
                        context += f"  - {col}: {desc}\n"
                
                sample = table_config.get("sample_data", {})
                if sample:
                    context += f"**Sample Data**: {json.dumps(sample, indent=2)}\n"
            context += "\n"
    
    context += "## QUERY ROUTING LOGIC\n"
    for route_type, route_config in QUERY_ROUTING.items():
        context += f"\n### {route_type.upper()} QUERIES ({route_config['database'].upper()})\n"
        context += f"**Patterns**: {', '.join(route_config['patterns'])}\n"
        context += f"**Description**: {route_config['description']}\n"
        context += f"**Use Cases**: {', '.join(route_config['use_cases'])}\n"
    
    context += "\n## CROSS-DATABASE RELATIONSHIPS\n"
    for rel_name, rel_config in CROSS_DATABASE_RELATIONSHIPS.items():
        context += f"\n### {rel_name.upper()}\n"
        context += f"**Description**: {rel_config['description']}\n"
        context += f"**Primary Source**: {rel_config['primary_source']}\n"
        context += f"**Enrichment Sources**: {', '.join(rel_config['enrichment_sources'])}\n"
        if isinstance(rel_config.get('join_key'), str):
            context += f"**Join Key**: {rel_config['join_key']}\n"
        elif isinstance(rel_config.get('join_keys'), list):
            context += f"**Join Keys**: {', '.join(rel_config['join_keys'])}\n"
    
    return context

def get_data_agent_metadata():
    """Get structured metadata specifically for data agent consumption"""
    return {
        "data_sources": DATA_SOURCES,
        "query_routing": QUERY_ROUTING,
        "relationships": CROSS_DATABASE_RELATIONSHIPS,
        "connection_info": {
            "dynamodb": {
                "region": "us-east-1",
                "tables": [config["table"] for config in DATA_SOURCES.values() if config["type"] == "dynamodb"]
            },
            "aurora": {
                "cluster_arn": DATA_SOURCES["customer_analytics"]["cluster_arn"],
                "secret_arn": DATA_SOURCES["customer_analytics"]["secret_arn"],
                "database": DATA_SOURCES["customer_analytics"]["database"],
                "region": "us-east-1"
            }
        }
    }

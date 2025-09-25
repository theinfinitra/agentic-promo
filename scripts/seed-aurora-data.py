#!/usr/bin/env python3

import boto3
import json
import sys

def seed_aurora_data(cluster_arn, database_name, profile, region):
    """Seed Aurora using RDS Data API"""
    
    session = boto3.Session(profile_name=profile)
    rds_data = session.client('rds-data', region_name=region)
    
    print("🗄️ Creating Aurora schema...")
    
    # Create tables
    schema_sql = """
    -- Customer metrics table
    CREATE TABLE IF NOT EXISTS customer_metrics (
        customer_id VARCHAR(50) PRIMARY KEY,
        total_orders INTEGER,
        total_spent DECIMAL(10,2),
        avg_order_value DECIMAL(10,2),
        days_since_last_order INTEGER,
        recency_score INTEGER,
        frequency_score INTEGER,
        monetary_score INTEGER,
        rfm_segment VARCHAR(10),
        lifecycle_stage VARCHAR(20),
        churn_probability DECIMAL(3,2),
        last_calculated TIMESTAMP
    );

    -- Behavioral analytics table
    CREATE TABLE IF NOT EXISTS behavioral_analytics (
        customer_id VARCHAR(50) PRIMARY KEY,
        email_open_rate DECIMAL(3,2),
        website_sessions_30d INTEGER,
        avg_session_duration INTEGER,
        product_categories JSONB,
        engagement_score DECIMAL(3,2)
    );

    -- Segments table
    CREATE TABLE IF NOT EXISTS segments (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100),
        criteria TEXT,
        customer_count INTEGER,
        avg_clv DECIMAL(10,2),
        created_date DATE,
        last_updated TIMESTAMP
    );

    -- Segment assignments table
    CREATE TABLE IF NOT EXISTS segment_assignments (
        customer_id VARCHAR(50),
        segment_id VARCHAR(50),
        assigned_date TIMESTAMP,
        confidence_score DECIMAL(3,2),
        previous_segment VARCHAR(50),
        migration_reason VARCHAR(100),
        PRIMARY KEY (customer_id, segment_id, assigned_date)
    );
    """
    
    try:
        response = rds_data.execute_statement(
            resourceArn=cluster_arn,
            secretArn=f"arn:aws:secretsmanager:{region}:018503853550:secret:rds-db-credentials/cluster-{cluster_arn.split(':')[-1]}/postgres",
            database=database_name,
            sql=schema_sql
        )
        print("✅ Schema created successfully")
    except Exception as e:
        print(f"❌ Schema creation failed: {e}")
        return False
    
    print("📈 Seeding Aurora analytical data...")
    
    # Seed customer metrics
    metrics_sql = """
    INSERT INTO customer_metrics VALUES 
    ('cust-001', 45, 8500.00, 188.89, 15, 5, 5, 5, '555', 'VIP', 0.05, '2024-01-20'),
    ('cust-002', 12, 1200.00, 100.00, 45, 2, 2, 2, '222', 'Active', 0.25, '2024-01-20'),
    ('cust-003', 28, 3400.00, 121.43, 20, 4, 4, 4, '444', 'Active', 0.15, '2024-01-20'),
    ('cust-004', 24, 4800.00, 200.00, 18, 4, 4, 5, '445', 'Active', 0.10, '2024-01-20'),
    ('cust-005', 3, 450.00, 150.00, 5, 5, 1, 2, '512', 'New', 0.30, '2024-01-20'),
    ('cust-006', 8, 1800.00, 225.00, 240, 1, 2, 3, '123', 'Dormant', 0.85, '2024-01-20'),
    ('cust-007', 36, 2800.00, 77.78, 25, 3, 5, 3, '353', 'Active', 0.20, '2024-01-20'),
    ('cust-008', 6, 3600.00, 600.00, 30, 3, 1, 5, '315', 'Active', 0.40, '2024-01-20'),
    ('cust-009', 18, 2200.00, 122.22, 22, 3, 3, 3, '333', 'Active', 0.18, '2024-01-20'),
    ('cust-010', 15, 1950.00, 130.00, 60, 2, 3, 3, '233', 'At-Risk', 0.70, '2024-01-20')
    ON CONFLICT (customer_id) DO UPDATE SET
        total_orders = EXCLUDED.total_orders,
        total_spent = EXCLUDED.total_spent,
        last_calculated = EXCLUDED.last_calculated;
    """
    
    try:
        response = rds_data.execute_statement(
            resourceArn=cluster_arn,
            secretArn=f"arn:aws:secretsmanager:{region}:018503853550:secret:rds-db-credentials/cluster-{cluster_arn.split(':')[-1]}/postgres",
            database=database_name,
            sql=metrics_sql
        )
        print("✅ Customer metrics seeded")
    except Exception as e:
        print(f"❌ Customer metrics seeding failed: {e}")
    
    # Seed behavioral analytics
    behavioral_sql = """
    INSERT INTO behavioral_analytics VALUES 
    ('cust-001', 0.85, 12, 420, '["electronics", "tech"]', 0.92),
    ('cust-002', 0.45, 6, 180, '["home", "basics"]', 0.55),
    ('cust-003', 0.78, 15, 380, '["fashion", "beauty"]', 0.82),
    ('cust-004', 0.65, 8, 300, '["business", "books"]', 0.75),
    ('cust-005', 0.60, 4, 240, '["home", "lifestyle"]', 0.65),
    ('cust-006', 0.15, 1, 120, '["sports", "outdoor"]', 0.25),
    ('cust-007', 0.70, 10, 350, '["home", "family"]', 0.78),
    ('cust-008', 0.55, 7, 200, '["luxury", "gadgets"]', 0.68),
    ('cust-009', 0.72, 9, 320, '["health", "fitness"]', 0.80),
    ('cust-010', 0.35, 3, 150, '["tools", "automotive"]', 0.45)
    ON CONFLICT (customer_id) DO UPDATE SET
        email_open_rate = EXCLUDED.email_open_rate,
        engagement_score = EXCLUDED.engagement_score;
    """
    
    try:
        response = rds_data.execute_statement(
            resourceArn=cluster_arn,
            secretArn=f"arn:aws:secretsmanager:{region}:018503853550:secret:rds-db-credentials/cluster-{cluster_arn.split(':')[-1]}/postgres",
            database=database_name,
            sql=behavioral_sql
        )
        print("✅ Behavioral analytics seeded")
    except Exception as e:
        print(f"❌ Behavioral analytics seeding failed: {e}")
    
    # Seed segments
    segments_sql = """
    INSERT INTO segments VALUES 
    ('VIP_HIGH_VALUE', 'VIP High Value Customers', 'rfm_segment IN (''555'',''554'',''545'') AND total_spent > 5000', 1, 8500.00, '2024-01-01', '2024-01-20'),
    ('PRICE_SENSITIVE', 'Price Sensitive Customers', 'rfm_segment LIKE ''2%'' AND avg_order_value < 120', 1, 1200.00, '2024-01-01', '2024-01-20'),
    ('FASHION_ENTHUSIAST', 'Fashion Forward Customers', 'product_categories @> ''[\"fashion\"]'' AND engagement_score > 0.8', 1, 3400.00, '2024-01-01', '2024-01-20'),
    ('BUSINESS_PROFESSIONAL', 'Business Professionals', 'product_categories @> ''[\"business\"]'' AND avg_order_value > 150', 1, 4800.00, '2024-01-01', '2024-01-20'),
    ('NEW_CUSTOMER', 'New Customers', 'lifecycle_stage = ''New'' AND total_orders < 5', 1, 450.00, '2024-01-01', '2024-01-20'),
    ('DORMANT', 'Dormant Customers', 'days_since_last_order > 180 AND churn_probability > 0.7', 1, 1800.00, '2024-01-01', '2024-01-20'),
    ('LOYAL_REGULAR', 'Loyal Regular Customers', 'total_orders > 30 AND engagement_score > 0.7', 1, 2800.00, '2024-01-01', '2024-01-20'),
    ('HIGH_AOV', 'High Average Order Value', 'avg_order_value > 400', 1, 3600.00, '2024-01-01', '2024-01-20'),
    ('HEALTH_FOCUSED', 'Health & Wellness Focused', 'product_categories @> ''[\"health\"]''', 1, 2200.00, '2024-01-01', '2024-01-20'),
    ('AT_RISK', 'At-Risk Customers', 'churn_probability > 0.6 AND lifecycle_stage = ''At-Risk''', 1, 1950.00, '2024-01-01', '2024-01-20')
    ON CONFLICT (id) DO UPDATE SET
        customer_count = EXCLUDED.customer_count,
        last_updated = EXCLUDED.last_updated;
    """
    
    try:
        response = rds_data.execute_statement(
            resourceArn=cluster_arn,
            secretArn=f"arn:aws:secretsmanager:{region}:018503853550:secret:rds-db-credentials/cluster-{cluster_arn.split(':')[-1]}/postgres",
            database=database_name,
            sql=segments_sql
        )
        print("✅ Segments seeded")
    except Exception as e:
        print(f"❌ Segments seeding failed: {e}")
    
    print("✅ Aurora data seeding complete!")
    return True

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python3 seed-aurora-data.py <cluster-arn> <database-name> <profile> <region>")
        sys.exit(1)
    
    cluster_arn = sys.argv[1]
    database_name = sys.argv[2]
    profile = sys.argv[3]
    region = sys.argv[4]
    
    seed_aurora_data(cluster_arn, database_name, profile, region)

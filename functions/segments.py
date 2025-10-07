import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    """
    Scudo Segments Lambda - Customer segment data from Aurora
    """
    try:
        # RDS Data API client
        rds_client = boto3.client('rds-data')
        
        cluster_arn = os.environ['AURORA_CLUSTER_ARN']
        secret_arn = os.environ['AURORA_SECRET_ARN']
        database = os.environ['AURORA_DATABASE_NAME']
        
        # Execute segment queries
        segments = get_segment_data(rds_client, cluster_arn, secret_arn, database)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(segments)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def get_segment_data(rds_client, cluster_arn, secret_arn, database):
    """Get segment overview data from Aurora analytics tables"""
    
    # Get table names from environment variables
    customer_metrics_table = os.environ.get('CUSTOMER_METRICS_TABLE', 'customer_metrics')
    segments_table = os.environ.get('SEGMENTS_TABLE', 'segments')
    
    # Get segment definitions with customer counts and CLV
    segment_info = execute_query(rds_client, cluster_arn, secret_arn, database,
        f"SELECT id, name, customer_count, avg_clv FROM {segments_table}")
    
    # Get average churn risk per lifecycle stage (maps to segments)
    churn_by_segment = execute_query(rds_client, cluster_arn, secret_arn, database,
        f"SELECT lifecycle_stage, AVG(churn_probability) FROM {customer_metrics_table} GROUP BY lifecycle_stage")
    
    # Create churn lookup map
    churn_map = {}
    if churn_by_segment:
        for row in churn_by_segment:
            stage = row['col_0']  # lifecycle_stage
            avg_churn = float(row['col_1']) if row['col_1'] else 0  # avg churn_probability
            churn_map[stage] = avg_churn
    
    # Define segment colors (matching frontend expectations)
    segment_colors = {
        'VIP': '#6366f1',      # Purple
        'Premium': '#10b981',   # Green  
        'Active': '#f59e0b',    # Orange
        'Regular': '#6b7280'    # Gray
    }
    
    # Map segment data to frontend format
    segments_data = []
    if segment_info:
        for segment in segment_info:
            segment_id = segment['col_0']      # id
            segment_name = segment['col_1']    # name
            customer_count = segment['col_2']  # customer_count
            avg_clv = float(segment['col_3']) if segment['col_3'] else 0  # avg_clv
            
            # Map segment name to lifecycle stage for churn lookup
            avg_risk = churn_map.get(segment_name, 0.15)  # Default 15% if not found
            
            segments_data.append({
                'name': segment_name,
                'count': customer_count,
                'revenue': int(avg_clv * customer_count) if avg_clv and customer_count else 0,
                'avgRisk': round(avg_risk, 3),
                'color': segment_colors.get(segment_name, '#6b7280'),
                'icon': get_segment_icon(segment_name)
            })
    
    return {
        'segments': segments_data,
        'lastUpdated': datetime.utcnow().isoformat()
    }

def get_segment_icon(segment_name):
    """Map segment name to icon type"""
    icon_map = {
        'VIP': 'crown',
        'Premium': 'star', 
        'Active': 'check-circle',
        'Regular': 'user-group'
    }
    return icon_map.get(segment_name, 'user-group')

def execute_query(rds_client, cluster_arn, secret_arn, database, sql):
    """Execute SQL query using RDS Data API"""
    try:
        response = rds_client.execute_statement(
            resourceArn=cluster_arn,
            secretArn=secret_arn,
            database=database,
            sql=sql
        )
        
        # Convert RDS Data API response to dict
        records = []
        if 'records' in response:
            columns = [col['name'] for col in response.get('columnMetadata', [])]
            for record in response['records']:
                row = {}
                for i, field in enumerate(record):
                    col_name = columns[i] if i < len(columns) else f'col_{i}'
                    # Extract value from RDS Data API field format
                    if 'longValue' in field:
                        row[col_name] = field['longValue']
                    elif 'doubleValue' in field:
                        row[col_name] = field['doubleValue']
                    elif 'stringValue' in field:
                        row[col_name] = field['stringValue']
                    elif 'isNull' in field:
                        row[col_name] = None
                records.append(row)
        
        return records
        
    except Exception as e:
        print(f"Query error: {e}")
        return []

import json
import boto3
import os
from datetime import datetime, timedelta

def lambda_handler(event, context):
    """
    Scudo KPI Lambda - Fast aggregated metrics from Aurora
    """
    try:
        # RDS Data API client
        rds_client = boto3.client('rds-data')
        
        cluster_arn = os.environ['AURORA_CLUSTER_ARN']
        secret_arn = os.environ['AURORA_SECRET_ARN']
        database = os.environ['AURORA_DATABASE_NAME']
        
        # Execute KPI queries
        kpis = get_dashboard_kpis(rds_client, cluster_arn, secret_arn, database)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(kpis)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def get_dashboard_kpis(rds_client, cluster_arn, secret_arn, database):
    """Get key performance indicators from Aurora analytics tables"""
    
    # Get table names from environment variables
    customer_metrics_table = os.environ.get('CUSTOMER_METRICS_TABLE', 'customer_metrics')
    segments_table = os.environ.get('SEGMENTS_TABLE', 'segments')
    
    # Total customers from customer_metrics table
    total_customers = execute_query(rds_client, cluster_arn, secret_arn, database,
        f"SELECT COUNT(*) FROM {customer_metrics_table}")
    
    # Revenue metrics from customer_metrics (has total_spent)
    revenue_metrics = execute_query(rds_client, cluster_arn, secret_arn, database,
        f"SELECT SUM(total_spent), AVG(total_spent) FROM {customer_metrics_table}")
    
    # Segment distribution from segments table
    segments = execute_query(rds_client, cluster_arn, secret_arn, database,
        f"SELECT name, customer_count FROM {segments_table}")
    
    # Churn risk from customer_metrics (has churn_probability)
    churn_risk = execute_query(rds_client, cluster_arn, secret_arn, database,
        f"SELECT AVG(churn_probability) FROM {customer_metrics_table}")
    
    # Map RDS Data API response (col_0, col_1) to meaningful data
    total_customers_count = total_customers[0]['col_0'] if total_customers and len(total_customers) > 0 else 0
    
    total_revenue = float(revenue_metrics[0]['col_0']) if revenue_metrics and len(revenue_metrics) > 0 and revenue_metrics[0]['col_0'] else 0
    avg_revenue = float(revenue_metrics[0]['col_1']) if revenue_metrics and len(revenue_metrics) > 0 and revenue_metrics[0]['col_1'] else 0
    
    avg_churn_risk = float(churn_risk[0]['col_0']) if churn_risk and len(churn_risk) > 0 and churn_risk[0]['col_0'] else 0
    
    # Map segments response to proper format
    segment_distribution = []
    if segments:
        for segment in segments:
            segment_distribution.append({
                'segment_name': segment['col_0'],  # name
                'count': segment['col_1']         # customer_count
            })
    
    return {
        'totalCustomers': total_customers_count,
        'totalRevenue': total_revenue,
        'avgRevenue': avg_revenue,
        'avgChurnRisk': avg_churn_risk,
        'segmentDistribution': segment_distribution,
        'lastUpdated': datetime.utcnow().isoformat()
    }

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

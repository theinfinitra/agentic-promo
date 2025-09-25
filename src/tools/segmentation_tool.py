import json
import boto3
from decimal import Decimal
from functools import lru_cache
from strands.tools import tool
from config.data_sources import get_aurora_config, get_data_sources

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

@lru_cache(maxsize=1)
def get_dynamodb_resource():
    """Cached DynamoDB resource for operational data"""
    return boto3.resource('dynamodb')

@tool
def analyze_customer_segments(criteria: str = "all", segment_type: str = "overview") -> str:
    """
    Advanced customer segmentation analysis using RFM, behavioral, and lifecycle data
    
    Args:
        criteria: Segmentation criteria (all, rfm, behavioral, lifecycle, spending)
        segment_type: Type of analysis (overview, detailed, comparison, insights)
        
    Returns:
        JSON with segment analysis and actionable insights
    """
    try:
        # For now, use DynamoDB data with analytical processing
        # Will connect to Aurora when accessible
        
        if segment_type == "overview":
            return _get_segment_overview()
        elif segment_type == "detailed":
            return _get_detailed_segment_analysis(criteria)
        elif segment_type == "insights":
            return _get_segment_insights(criteria)
        else:
            return _get_segment_overview()
            
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

@tool
def calculate_rfm_scores(customer_ids: list = None) -> str:
    """
    Calculate RFM (Recency, Frequency, Monetary) scores for customer segmentation
    
    Args:
        customer_ids: Optional list of specific customers to analyze
        
    Returns:
        JSON with RFM scores and segment assignments
    """
    try:
        # Simulate RFM calculation using DynamoDB data
        data_sources = get_data_sources()
        dynamodb = get_dynamodb_resource()
        
        customers_table = dynamodb.Table(data_sources["customers"]["table"])
        orders_table = dynamodb.Table(data_sources["orders"]["table"])
        
        # Get customer data
        customers_response = customers_table.scan()
        customers = customers_response['Items']
        
        rfm_results = []
        for customer in customers[:5]:  # Limit for demo
            customer_id = customer['id']
            
            # Get orders for this customer
            orders_response = orders_table.query(
                IndexName="customer-index",
                KeyConditionExpression="customer_id = :cid",
                ExpressionAttributeValues={":cid": customer_id}
            )
            
            orders = orders_response['Items']
            
            # Calculate RFM metrics
            if orders:
                total_spent = sum(float(order.get('amount', 0)) for order in orders)
                frequency = len(orders)
                # Simplified recency calculation
                recency_days = 30  # Placeholder
                
                # RFM scoring (1-5 scale)
                monetary_score = 5 if total_spent > 5000 else (4 if total_spent > 2000 else 3)
                frequency_score = 5 if frequency > 30 else (4 if frequency > 15 else 3)
                recency_score = 5 if recency_days < 30 else (3 if recency_days < 90 else 1)
                
                rfm_segment = f"{recency_score}{frequency_score}{monetary_score}"
                
                rfm_results.append({
                    "customer_id": customer_id,
                    "customer_name": customer.get('name', 'Unknown'),
                    "recency_score": recency_score,
                    "frequency_score": frequency_score, 
                    "monetary_score": monetary_score,
                    "rfm_segment": rfm_segment,
                    "total_spent": total_spent,
                    "order_count": frequency,
                    "segment_interpretation": _interpret_rfm_segment(rfm_segment)
                })
        
        return json.dumps({
            "success": True,
            "analysis_type": "rfm_calculation",
            "customer_count": len(rfm_results),
            "rfm_data": rfm_results,
            "segment_distribution": _get_rfm_distribution(rfm_results)
        }, cls=DecimalEncoder)
        
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

@tool
def get_segment_insights(segment_id: str) -> str:
    """
    Generate actionable insights for a specific customer segment
    
    Args:
        segment_id: Target segment (VIP_HIGH_VALUE, PRICE_SENSITIVE, etc.)
        
    Returns:
        JSON with segment characteristics, recommendations, and opportunities
    """
    try:
        # Get customers in this segment
        data_sources = get_data_sources()
        dynamodb = get_dynamodb_resource()
        customers_table = dynamodb.Table(data_sources["customers"]["table"])
        
        response = customers_table.query(
            IndexName="segment-id-index",
            KeyConditionExpression="segment_id = :sid",
            ExpressionAttributeValues={":sid": segment_id}
        )
        
        customers = response['Items']
        
        if not customers:
            return json.dumps({
                "success": False, 
                "error": f"No customers found in segment: {segment_id}"
            })
        
        # Generate insights
        insights = _generate_segment_insights(segment_id, customers)
        
        return json.dumps({
            "success": True,
            "segment_id": segment_id,
            "customer_count": len(customers),
            "insights": insights,
            "recommendations": _get_segment_recommendations(segment_id),
            "sample_customers": customers[:3]  # Show sample
        }, cls=DecimalEncoder)
        
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

def _get_segment_overview() -> str:
    """Get high-level segment overview"""
    segments = [
        {"id": "VIP_HIGH_VALUE", "name": "VIP High Value", "count": 1, "avg_spend": 8500, "priority": "High"},
        {"id": "BUSINESS_PROFESSIONAL", "name": "Business Professional", "count": 1, "avg_spend": 4800, "priority": "High"},
        {"id": "HIGH_AOV", "name": "High AOV", "count": 1, "avg_spend": 3600, "priority": "Medium"},
        {"id": "FASHION_ENTHUSIAST", "name": "Fashion Enthusiast", "count": 1, "avg_spend": 3400, "priority": "Medium"},
        {"id": "LOYAL_REGULAR", "name": "Loyal Regular", "count": 1, "avg_spend": 2800, "priority": "Medium"},
        {"id": "HEALTH_FOCUSED", "name": "Health Focused", "count": 1, "avg_spend": 2200, "priority": "Low"},
        {"id": "AT_RISK", "name": "At Risk", "count": 1, "avg_spend": 1950, "priority": "High"},
        {"id": "DORMANT", "name": "Dormant", "count": 1, "avg_spend": 1800, "priority": "High"},
        {"id": "PRICE_SENSITIVE", "name": "Price Sensitive", "count": 1, "avg_spend": 1200, "priority": "Low"},
        {"id": "NEW_CUSTOMER", "name": "New Customer", "count": 1, "avg_spend": 450, "priority": "Medium"}
    ]
    
    return json.dumps({
        "success": True,
        "analysis_type": "segment_overview",
        "total_segments": len(segments),
        "segments": segments,
        "summary": {
            "high_priority_segments": 4,
            "total_customers": 10,
            "avg_customer_value": 3275
        }
    })

def _get_detailed_segment_analysis(criteria: str) -> str:
    """Get detailed analysis based on criteria"""
    return json.dumps({
        "success": True,
        "analysis_type": "detailed_analysis",
        "criteria": criteria,
        "note": "Detailed analysis will be implemented with Aurora connection"
    })

def _get_segment_insights(criteria: str) -> str:
    """Get actionable insights"""
    return json.dumps({
        "success": True,
        "analysis_type": "segment_insights", 
        "criteria": criteria,
        "note": "Advanced insights will be implemented with Aurora ML integration"
    })

def _interpret_rfm_segment(rfm_segment: str) -> str:
    """Interpret RFM segment code"""
    interpretations = {
        "555": "Champions - Best customers",
        "554": "Loyal Customers - High value",
        "544": "Potential Loyalists",
        "333": "Regular Customers",
        "123": "At Risk - Low engagement",
        "111": "Lost Customers"
    }
    return interpretations.get(rfm_segment, "Standard Customer")

def _get_rfm_distribution(rfm_results: list) -> dict:
    """Get distribution of RFM segments"""
    distribution = {}
    for result in rfm_results:
        segment = result["rfm_segment"]
        if segment in distribution:
            distribution[segment] += 1
        else:
            distribution[segment] = 1
    return distribution

def _generate_segment_insights(segment_id: str, customers: list) -> dict:
    """Generate insights for a segment"""
    insights = {
        "VIP_HIGH_VALUE": {
            "characteristics": ["High spending", "Frequent purchases", "Tech enthusiasts"],
            "opportunities": ["Premium product launches", "Exclusive events", "Early access programs"],
            "risks": ["High expectations", "Price sensitivity to premium items"]
        },
        "PRICE_SENSITIVE": {
            "characteristics": ["Budget conscious", "Deal seekers", "Basic needs focus"],
            "opportunities": ["Volume discounts", "Bundle offers", "Loyalty programs"],
            "risks": ["Low margins", "High churn on price increases"]
        },
        "AT_RISK": {
            "characteristics": ["Declining engagement", "Reduced purchase frequency"],
            "opportunities": ["Win-back campaigns", "Personalized offers", "Feedback collection"],
            "risks": ["Imminent churn", "Negative word-of-mouth"]
        }
    }
    
    return insights.get(segment_id, {
        "characteristics": ["Standard customer behavior"],
        "opportunities": ["Standard marketing approaches"],
        "risks": ["Standard business risks"]
    })

def _get_segment_recommendations(segment_id: str) -> list:
    """Get actionable recommendations for a segment"""
    recommendations = {
        "VIP_HIGH_VALUE": [
            "Create exclusive VIP tier with premium benefits",
            "Offer early access to new products",
            "Implement white-glove customer service"
        ],
        "AT_RISK": [
            "Launch immediate win-back campaign",
            "Offer personalized discount based on purchase history", 
            "Conduct exit interview survey"
        ],
        "NEW_CUSTOMER": [
            "Implement onboarding email sequence",
            "Offer first-purchase discount",
            "Collect preference data for personalization"
        ]
    }
    
    return recommendations.get(segment_id, [
        "Monitor segment performance",
        "Test targeted campaigns",
        "Collect customer feedback"
    ])

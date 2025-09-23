import json
import boto3
from functools import lru_cache
from strands.tools import tool

@lru_cache(maxsize=1)
def get_ses_client():
    """Cached SES client"""
    return boto3.client('ses')

@tool
def send_email(to_email: str, subject: str, message: str, from_email: str = "noreply@infinitra.com") -> str:
    """
    Send an email using AWS SES
    
    Args:
        to_email: Recipient email address
        subject: Email subject line
        message: Email message body
        from_email: Sender email address (default: noreply@infinitra.com)
        
    Returns:
        JSON string with send result
    """
    try:
        ses = get_ses_client()
        
        response = ses.send_email(
            Source=from_email,
            Destination={'ToAddresses': [to_email]},
            Message={
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {
                    'Text': {'Data': message, 'Charset': 'UTF-8'}
                }
            }
        )
        
        return json.dumps({
            "success": True,
            "message_id": response['MessageId'],
            "sent_to": to_email,
            "subject": subject
        })
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e),
            "note": "Email sending failed - check SES configuration"
        })

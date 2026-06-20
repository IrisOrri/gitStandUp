import json
import os
import boto3
from datetime import datetime,timezone

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME', 'GitStandupData')
table = dynamodb.Table(TABLE_NAME)

def handler(event, context):
    print("Received manual note insertion request...")
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        
        username = body.get('username')
        note_content = body.get('content')
        category = body.get('category', 'general') 
        
        if not username or not note_content:
            return {
                "statusCode": 400, 
                "body": json.dumps({"status": "error", "message": "Missing required fields: username and content"})
            }
        
        timestamp = datetime.now(timezone.utc)
        formatted_time = timestamp.strftime("%Y%m%d_%H%M%S")
        record_id = f"note_{formatted_time}"
        
        table.put_item(
            Item={
                'user_id': username,
                'record_id': record_id,
                'content': note_content,
                'category': category,
                'created_at': timestamp.isoformat(),
                'status': 'ACTIVE'
            }
        )
        print(f"Successfully saved manual note [{record_id}] for user {username}.")
        
        return {
            "statusCode": 201, 
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"status": "success", "record_id": record_id})
        }

    except Exception as e:
        print(f"Manual Note Handler Error: {str(e)}")
        return {
            "statusCode": 500, 
            "body": json.dumps({"status": "error", "message": str(e)})
        }
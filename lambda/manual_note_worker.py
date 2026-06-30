import json
import os
import boto3
from datetime import datetime,timezone
import hashlib

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME', 'GitStandupData')
table = dynamodb.Table(TABLE_NAME)

def handler(event, context):
    print("Received manual note insertion request...")
    http_method = event.get('requestContext', {}).get('http', {}).get('method', '')
    if http_method == 'OPTIONS':
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST,OPTIONS,GET",
                "Access-Control-Allow-Headers": "Content-Type,Authorization"
            },
            "body": ""
        }

    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        
        # 👤 Extract identity directly from the verified Cognito token claims
        authorizer_claims = event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})
        username = authorizer_claims.get('email')
        
        # 💡 Fallback to payload body key just in case we ever test locally without a gateway
        if not username:
            username = body.get('user_id') or body.get('username')
            
        note_content = body.get('content')
        category = body.get('category', 'general') 
        
        if not username or not note_content:
            return {
                "statusCode": 400, 
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                "body": json.dumps({"status": "error", "message": "Missing required identity configuration or content body."})
            }
        
        raw_payload_string = f"{username}_{category}_{note_content.strip()}"
        unique_hash = hashlib.sha256(raw_payload_string.encode('utf-8')).hexdigest()
        record_id = f"note_{unique_hash[:16]}"
        timestamp = datetime.now(timezone.utc)
        
        
        table.put_item(
            Item={
                'user_id': username, 
                'record_id': record_id, #if the unique record_id is present it overwrites the record
                'content': note_content,
                'category': category,
                'created_at': timestamp.isoformat(),
                'status': 'ACTIVE'
            }
        )
        print(f"Successfully saved manual note [{record_id}] for user {username}.")
        return {
            "statusCode": 201, 
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization"
            },
            "body": json.dumps({"status": "success", "record_id": record_id})
        }
    except Exception as e:
        print(f"Manual Note Handler Error: {str(e)}")
        return {
            "statusCode": 500, 
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"status": "error", "message": str(e)})
        }
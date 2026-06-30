import json
import os
import boto3
from datetime import datetime,timezone
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME', 'GitStandupData')
table = dynamodb.Table(TABLE_NAME)

def handler(event, context):
    print("Received webhook event...")
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        repository_name = body.get('repository', {}).get('name', 'unknown-repo')

        query_params = event.get('queryStringParameters', {}) or {}
        user_id_tenant = query_params.get('user_id')

        if not user_id_tenant:
            user_id_tenant = body.get('pusher', {}).get('name', 'anonymous-coder')

        commits = body.get('commits', [])
        
        if not commits:
            return {"statusCode": 200, "body": json.dumps({"message": "Ping verified."})}
            
        for commit in commits:
            commit_id = commit.get('id')
            raw_msg = commit.get('message')
            commit_time = commit.get('timestamp')
            try:
                table.put_item(
                    Item={
                        'user_id': user_id_tenant,
                        'record_id': f"commit_{commit_id}",
                        'repository': repository_name,
                        'raw_commit_message': raw_msg,
                        'pushed_at': commit_time,
                        'processed_at': datetime.now(timezone.utc).isoformat(),
                        'status': 'COMPLETED'
                    },
                    ConditionExpression='attribute_not_exists(record_id)'
                )
                print(f"Successfully cached raw commit {commit_id[:7]} into database.")
            except ClientError as e:
                if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                    print(f"Duplicate event detected: Commit {commit_id[:7]} already processed. Skipping.")
                    continue
                raise e

        return {"statusCode": 201, "body": json.dumps({"status": "success"})}

    except Exception as e:
        print(f"Handler Error: {str(e)}")
        return {"statusCode": 500, "body": json.dumps({"status": "error"})}
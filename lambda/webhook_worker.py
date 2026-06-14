import json
import os
import boto3
from datetime import datetime

# Initialize the DynamoDB client out-of-band to optimize warm execution performance
dynamodb = boto3.resource('dynamodb')
# We will pass the exact table name securely from our CDK infrastructure stack using an Environment Variable
TABLE_NAME = os.environ.get('TABLE_NAME', 'GitStandupData')
table = dynamodb.Table(TABLE_NAME)

def handler(event, context):
    print("🚀 Received raw webhook event from GitHub:", json.dumps(event))
    
    try:
        # 1. Parse the incoming request body sent by GitHub's webhook
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        
        # 2. Extract crucial commit details from the GitHub Webhook schema
        # We handle cases where fields might be absent using safe .get() defaults
        repository_name = body.get('repository', {}).get('name', 'unknown-repo')
        pusher_name = body.get('pusher', {}).get('name', 'anonymous-coder')
        commits = body.get('commits', [])
        
        if not commits:
            return {
                "statusCode": 200,
                "body": json.dumps({"message": "Webhook ping verified successfully or no active commits found."})
            }
            
        print(f"📦 Processing {len(commits)} incoming commits pushed by {pusher_name}...")
        
        # 3. Iterate over every commit inside the push block and save it to DynamoDB
        for commit in commits:
            commit_id = commit.get('id')         # Unique SHA hash of the commit
            commit_msg = commit.get('message')   # The text message you wrote
            commit_time = commit.get('timestamp') # ISO timestamp of the commit
            
            # Formulate the composite key layout matching our DynamoDB structure
            # user_id (Partition Key) -> The GitHub username of the person who pushed
            # record_id (Sort Key)    -> commit_#HASH to keep every entry isolated and unique
            table.put_item(
                Item={
                    'user_id': pusher_name,
                    'record_id': f"commit_{commit_id}",
                    'repository': repository_name,
                    'commit_message': commit_msg,
                    'pushed_at': commit_time,
                    'processed_at': datetime.utcnow().isoformat(),
                    'status': 'PENDING_AI_SUMMARY' # We will use this flag later when we stitch in OpenAI!
                }
            )
            print(f"✅ Successfully persisted commit {commit_id[:7]} to database.")

        return {
            "statusCode": 201,
            "body": json.dumps({"status": "success", "inserted_commits": len(commits)})
        }

    except Exception as e:
        print(f"❌ Critical Ingestion Error encountered: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"status": "error", "message": "Failed to ingest webhook payload."})
        }
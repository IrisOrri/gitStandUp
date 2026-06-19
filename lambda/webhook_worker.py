import json
import os
import boto3
from datetime import datetime

from ai_prompt_engine import SYSTEM_STANDUP_PROMPT, build_user_prompt

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME', 'GitStandupData')
table = dynamodb.Table(TABLE_NAME)

bedrock_client = boto3.client(service_name='bedrock-runtime', region_name='ap-south-1')

def call_bedrock_llm(repo_name, commit_msg):
    """Invokes Meta Llama 3 via AWS Bedrock to transform cryptic commits into clean summaries."""
    model_id = "meta.llama3-8b-instruct-v1:0"
    
    formatted_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
{SYSTEM_STANDUP_PROMPT}<|eot_id|><|start_header_id|>user<|end_header_id|>
{build_user_prompt(repo_name, commit_msg)}<|eot_id|><|start_header_id|>assistant<|end_header_id|>"""

    body = json.dumps({
        "prompt": formatted_prompt,
        "max_gen_len": 200,
        "temperature": 0.3,
        "top_p": 0.9
    })

    try:
        response = bedrock_client.invoke_model(
            body=body,
            modelId=model_id,
            accept="application/json",
            contentType="application/json"
        )
        
        response_body = json.loads(response.get('body').read())
        ai_summary = response_body.get('generation', '').strip()
        return ai_summary
        
    except Exception as e:
        print(f"Bedrock API Error: {str(e)}")
        return f"AI Summary Generation Failed: {str(e)}"


def handler(event, context):
    print("Received webhook event...")
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        repository_name = body.get('repository', {}).get('name', 'unknown-repo')
        pusher_name = body.get('pusher', {}).get('name', 'anonymous-coder')
        commits = body.get('commits', [])
        
        if not commits:
            return {"statusCode": 200, "body": json.dumps({"message": "Ping verified."})}
            
        for commit in commits:
            commit_id = commit.get('id')
            raw_msg = commit.get('message')
            commit_time = commit.get('timestamp')
            
            print(f"Sending commit text to AWS Bedrock...")
            ai_summary = call_bedrock_llm(repository_name, raw_msg)
            print(f"Bedrock Output: {ai_summary}")
            
            table.put_item(
                Item={
                    'user_id': pusher_name,
                    'record_id': f"commit_{commit_id}",
                    'repository': repository_name,
                    'raw_commit_message': raw_msg,
                    'commit_message': ai_summary,
                    'pushed_at': commit_time,
                    'processed_at': datetime.utcnow().isoformat(),
                    'status': 'COMPLETED'
                }
            )
            print(f"Successfully saved processed commit {commit_id[:7]} into database.")

        return {"statusCode": 201, "body": json.dumps({"status": "success"})}

    except Exception as e:
        print(f"Handler Error: {str(e)}")
        return {"statusCode": 500, "body": json.dumps({"status": "error"})}
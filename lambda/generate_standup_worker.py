import json
import os
import boto3
from datetime import datetime, timedelta, timezone
from boto3.dynamodb.conditions import Key
from ai_prompt_engine import SYSTEM_ORCHESTRATION_PROMPT, build_orchestration_prompt

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME', 'GitStandupData')
table = dynamodb.Table(TABLE_NAME)

bedrock_client = boto3.client(service_name='bedrock-runtime', region_name='ap-south-1')

def query_user_records_for_today(username: str) -> list:
    """
    Queries DynamoDB by Partition Key only to pull the user's complete row set,
    then evaluates timestamps robustly using datetime objects.
    """

    lookback_time = datetime.now(timezone.utc) - timedelta(days=1)
    
    try:
        response = table.query(
            KeyConditionExpression=Key('user_id').eq(username)
        )
        all_items = response.get('Items', [])
        filtered_items = []
        
        print(f"Total raw table items pulled for evaluation: {len(all_items)}")
        
        for item in all_items:
            raw_time_str = item.get('created_at') or item.get('processed_at') or item.get('pushed_at')
            if not raw_time_str:
                continue
                
            try:
                clean_time_str = raw_time_str.replace('Z', '+00:00')
                item_datetime = datetime.fromisoformat(clean_time_str)
                
                if item_datetime.tzinfo is None:
                    item_datetime = item_datetime.replace(tzinfo=timezone.utc)

                if item_datetime >= lookback_time:
                    filtered_items.append(item)
                    
            except Exception as parse_err:
                print(f"Skipping row parse on timestamp layout error: {str(parse_err)}")
                
        print(f"Total verified items matching today's Scrum window: {len(filtered_items)}")
        return filtered_items
        
    except Exception as e:
        print(f"DynamoDB Identity Query Operational Error: {str(e)}")
        return []

def call_bedrock_orchestration(username: str, git_logs: list, manual_notes: list) -> str:
    """Invokes Meta Llama 3 to compile elements into a unified Scrum JSON template."""
    model_id = "meta.llama3-8b-instruct-v1:0"
    
    formatted_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
{SYSTEM_ORCHESTRATION_PROMPT}<|eot_id|><|start_header_id|>user<|end_header_id|>
{build_orchestration_prompt(username, git_logs, manual_notes)}<|eot_id|><|start_header_id|>assistant<|end_header_id|>"""

    body = json.dumps({
        "prompt": formatted_prompt,
        "max_gen_len": 800,
        "temperature": 0.2,
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
        return response_body.get('generation', '').strip()
    except Exception as e:
        print(f"Bedrock Orchestration Error: {str(e)}")
        return json.dumps({"error": f"Failed to generate unified report: {str(e)}"})

def handler(event, context):
    http_method = event.get('requestContext', {}).get('http', {}).get('method', '')
    if http_method == 'OPTIONS':
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type,Authorization"
            },
            "body": ""
        }
    print("Received standup compilation request...")
    try:
        authorizer_claims = event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})
        username = authorizer_claims.get('email')
        
        if not username:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing query string parameter: username"})
            }
            
        all_records = query_user_records_for_today(username)
        
        git_logs = []
        manual_notes = []
        
        for record in all_records:
            rec_id = record.get('record_id', '')
            if rec_id.startswith('commit_'):
                git_logs.append(record.get('raw_commit_message', ''))
            elif rec_id.startswith('note_'):
                manual_notes.append({
                    'category': record.get('category'),
                    'content': record.get('content')
                })
                
        print(f"Orchestrating {len(git_logs)} commits and {len(manual_notes)} notes for {username}...")
        report_json_str = call_bedrock_orchestration(username, git_logs, manual_notes)
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": report_json_str
        }

    except Exception as e:
        print(f"Compilation Handler Error: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"error": "Internal processor breakdown", "details": str(e)})
        }
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
    Queries DynamoDB efficiently by using a range comparison on the Sort Key,
    then uses robust datetime objects to filter records from the last 24 hours.
    """
    lookback_time = datetime.now(timezone.utc) - timedelta(days=1)
    sk_date_prefix = lookback_time.strftime("%Y%m%d")
    
    try:
        notes_response = table.query(
            KeyConditionExpression=
                Key('user_id').eq(username) & 
                Key('record_id').gte(f"note_{sk_date_prefix}")
        )
        
        commits_response = table.query(
            KeyConditionExpression=
                Key('user_id').eq(username) & 
                Key('record_id').begins_with("commit_")
        )
        
        all_items = notes_response.get('Items', []) + commits_response.get('Items', [])
        filtered_items = []
        
        for item in all_items:
            raw_time_str = item.get('processed_at') or item.get('created_at', '')
            if not raw_time_str:
                continue
                
            try:
                clean_time_str = raw_time_str.replace('Z', '+00:00')
                
                if '+' not in clean_time_str:
                    item_datetime = datetime.fromisoformat(clean_time_str).replace(tzinfo=timezone.utc)
                else:
                    item_datetime = datetime.fromisoformat(clean_time_str)
                
                if item_datetime >= lookback_time:
                    filtered_items.append(item)
            except Exception as parse_err:
                print(f"Skipping record due to timestamp parse error: {str(parse_err)}")
                
        return filtered_items
        
    except Exception as e:
        print(f"DynamoDB Single-Table Query Error: {str(e)}")
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
    print("Received standup compilation request...")
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        username = query_params.get('username')
        
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
        return {"statusCode": 500, "body": json.dumps({"error": "Internal processor breakdown"})}
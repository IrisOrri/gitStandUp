import json
import os
import boto3
from datetime import datetime
import urllib.request  # Built-in library to make fast API calls without installing extra packages

# 1. Import your custom prompt engine from yesterday!
from ai_prompt_engine import SYSTEM_STANDUP_PROMPT, build_user_prompt

# Initialize AWS services
dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME', 'GitStandupData')
table = dynamodb.Table(TABLE_NAME)

# Pull your OpenAI Key securely from the environment variables
# (We will inject this using CDK in the next step!)
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')

def call_llm(repo_name, commit_msg):
    """Makes a lightweight, secure HTTP POST request to the AI model engine."""
    if not OPENAI_API_KEY:
        print("⚠️ Missing OpenAI API Key. Skipping AI transformation.")
        return "AI Summary Unavailable (Missing API Key)"

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Bundle our isolated instructions and the user commit data together
    data = {
        "model": "gpt-4o-mini", # Using a highly optimized, fast, and cheap model
        "messages": [
            {"role": "system", "content": SYSTEM_STANDUP_PROMPT},
            {"role": "user", "content": build_user_prompt(repo_name, commit_msg)}
        ],
        "temperature": 0.3 # Low temperature means consistent, professional output
    }

    try:
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            return res_data['choices'][0]['message']['content'].strip()
    except Exception as e:
        print(f"❌ LLM API Network Error: {str(e)}")
        return f"Error generating summary: {str(e)}"


def handler(event, context):
    print("🚀 Received webhook event...")
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        repository_name = body.get('repository', {}).get('name', 'unknown-repo')
        pusher_name = body.get('pusher', {}).get('name', 'anonymous-coder')
        commits = body.get('commits', [])
        # GitHub is deliberately sending you empty requests to test if your servers are alive
        if not commits:
            return {"statusCode": 200, "body": json.dumps({"message": "Ping verified."})}
            
        for commit in commits:
            commit_id = commit.get('id')
            raw_msg = commit.get('message')
            commit_time = commit.get('timestamp')
            
            # 🔥 NEW: Send the raw commit text to the AI engine!
            print(f"🤖 Sending commit '{raw_msg[:30]}...' to the AI engine...")
            ai_summary = call_llm(repository_name, raw_msg)
            print(f"✨ Generated Summary: {ai_summary}")
            
            # Persist everything beautifully to the database
            table.put_item(
                Item={
                    'user_id': pusher_name,
                    'record_id': f"commit_{commit_id}",
                    'repository': repository_name,
                    'raw_commit_message': raw_msg,
                    'commit_message': ai_summary, # 👈 Overwriting with the beautiful executive summary!
                    'pushed_at': commit_time,
                    'processed_at': datetime.utcnow().isoformat(),
                    'status': 'COMPLETED' # 🎉 Updated state indicator!
                }
            )
            print(f"✅ Successfully persisted processed commit {commit_id[:7]}.")

        return {"statusCode": 201, "body": json.dumps({"status": "success"})}

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {"statusCode": 500, "body": json.dumps({"status": "error"})}
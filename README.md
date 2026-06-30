# gitStandUp 🚀

**gitStandUp** is a smart assistant that helps developers prepare for daily scrum meetings in seconds. It automatically tracks your code changes through GitHub webhooks and lets you type in quick manual notes about your day. 

When it's time for your standup meeting, the app uses AI to combine your code commits and notes into a clean, professional, and ready-to-read daily update.

## 🗺️ System Architecture

![gitStandUp Core Architecture](./assets/architecture-diagram.png)

## 💻 Workspace & Live Demonstration

Below is the live end-to-end operational sequence showing real-time data ingestion. 

The demonstration captures a developer setting up a repository webhook, pushing a custom FastAPI Pydantic schema update, logging auxiliary category notes, and executing the orchestration engine to generate a structured daily standup summary via Meta Llama 3 on Amazon Bedrock:


[![Watch the Demo](https://img.shields.io/badge/Demo-Watch%20On%20YouTube-red?style=for-the-badge&logo=youtube)](https://youtu.be/wLtSsiu4rlc)

## 🏆 Engineering Design Wins

### 🔄 1. Webhook Deduplication (Idempotency)
* **The Problem:** GitHub webhooks can accidentally fire twice due to network retries, which would normally create duplicate commit entries in the database.
* **The Fix:** Added a native `ConditionExpression='attribute_not_exists(record_id)'` directly to the DynamoDB write loop inside the `webhook_worker` Lambda. If a duplicate commit hash hits the database, DynamoDB instantly drops it, keeping your data clean.

### 🧮 2. Smart Manual Note Hashing
* **The Problem:** If a developer clicks "Sync to Workspace" multiple times quickly, it can spam the database with duplicate rows of the exact same text log.
* **The Fix:** Replaced random timestamps with a deterministic SHA-256 hash generated from the text content (`username + category + note_text`). If they click sync on the same text again, it produces the exact same ID, causing DynamoDB to cleanly overwrite the existing item instead of duplicating it.

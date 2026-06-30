# gitStandUp 🚀

**gitStandUp** is a smart assistant that helps developers prepare for daily scrum meetings in seconds. It automatically tracks your code changes through GitHub webhooks and lets you type in quick manual notes about your day. 

When it's time for your standup meeting, the app uses AI to combine your code commits and notes into a clean, professional, and ready-to-read daily update.

## 🗺️ System Architecture

![gitStandUp Core Architecture](./assets/architecture-diagram.png)

## 💻 Workspace & Live Demonstration

Below is the live end-to-end operational sequence showing real-time data ingestion. 

The demonstration captures a developer setting up a repository webhook, pushing a custom FastAPI Pydantic schema update, logging auxiliary category notes, and executing the orchestration engine to generate a structured daily standup summary via Meta Llama 3 on Amazon Bedrock:


<p align="center">
  <video src="https://github.com/IrisOrri/gitStandUp/raw/main/assets/gitStandUp%20recording.mp4" width="100%" autoplay loop muted controls></video>
</p>

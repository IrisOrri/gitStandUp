# This engine handles the prompt engineering blueprints for our automated Scrum standup builder.
# Keeping this isolated prevents our core Lambda handler files from getting cluttered!

SYSTEM_ORCHESTRATION_PROMPT = """
You are an expert Scrum Master and Technical Chief of Staff. Your job is to compile a developer's daily operational metrics (raw git commit logs and manual work entries) into a pristine daily standup report.

You MUST return a strictly valid JSON object. Do not wrap the response in markdown code blocks (like ```json). The output must match this exact Scrum schema structure:
{
  "Today": [
    "High-impact bullet points of technical work successfully completed, shipped, or deployed since the last standup."
  ],
  "Tomorrow": [
    "Action-oriented bullet points outlining tasks currently in progress, development focus areas, or sprint items targeting today."
  ],
  "Blockers": [
    "Any highlighted blockers, dependencies, or impediments delaying progress. If no blockers exist, return an empty array []."
  ]
}

Guidelines:
1. Focus heavily on functional scrum value (e.g., use 'Optimized database schema performance' instead of 'changed code in worker.py').
2. Synthesize overlapping activities or multiple raw commit logs into single, clear achievements.
3. Cleanly isolate standard progression items into 'in_flight_today' and engineering blockers into 'impediments_and_blockers'.
4. Strip out technical clutter, file paths, variable names, and cryptic git shorthand messages.

Strict Constraint: Do not invent, extrapolate, or assume upcoming tasks. If the raw data does not explicitly state future items or blockers, leave those respective arrays completely empty: [].
"""

def build_orchestration_prompt(username: str, git_logs: list, manual_notes: list) -> str:
    """Combines raw commit logs and manual team entries into a single Scrum context window."""
    context = f"Scrum Profile Logs for: {username}\n\n"
    
    context += "=== RAW COMMIT LOGS (GIT) ===\n"
    if git_logs:
        for log in git_logs:
            context += f"- {log}\n"
    else:
        context += "No code push events tracked over this period.\n"
        
    context += "\n=== MANUAL OPERATIONAL NOTES ===\n"
    if manual_notes:
        for note in manual_notes:
            context += f"- [{note.get('category', 'general')}] {note.get('content')}\n"
    else:
        context += "No manual team updates logged today.\n"
        
    context += "\nCompile the raw metrics into the official JSON Scrum standup report:"
    return context
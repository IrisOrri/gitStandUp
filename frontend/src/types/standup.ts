// Think of this exactly like a Pydantic model or a strict JSON schema!
export interface StandupReport {
  Today: string[];
  Tomorrow: string[];
  Blockers: string[];
}

export interface ManualNotePayload {
  username: string;
  category: 'general' | 'blocker' | 'progress';
  content: string;
}
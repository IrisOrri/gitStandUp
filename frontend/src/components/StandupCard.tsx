import React from 'react';
import { type StandupReport } from '../types/standup';

// 1. Define the input parameter contract (Props) for our component function
interface StandupCardProps {
  report: StandupReport | null;
  isLoading: boolean;
}

// 2. Build the functional component
export const StandupCard: React.FC<StandupCardProps> = ({ report, isLoading }) => {
  
  // State A: If the pipeline is currently fetching or generating via Bedrock
  if (isLoading) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
        <p>🔄 Querying logs and generating Scrum report via Llama 3...</p>
      </div>
    );
  }

  // State B: If no report has been pulled from AWS Gateway yet
  if (!report) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
        <p>💡 Click the load button to fetch your daily standup compilation.</p>
      </div>
    );
  }

  // State C: The operational data view (Mapping arrays to visual lists)
  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', maxWidth: '600px' }}>
      <h2 style={{ borderBottom: '2px solid #646cff', paddingBottom: '8px' }}>📋 Daily Standup Report</h2>
      
      {/* TODAY SECTION */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ color: '#2e7d32' }}>🚀 Today</h3>
        {report.Today.length === 0 ? <p>No items logged for today.</p> : (
          <ul>
            {report.Today.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        )}
      </div>

      {/* TOMORROW SECTION */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ color: '#0288d1' }}>📅 Tomorrow</h3>
        {report.Tomorrow.length === 0 ? <p>No items planned yet.</p> : (
          <ul>
            {report.Tomorrow.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        )}
      </div>

      {/* BLOCKERS SECTION */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ color: '#d32f2f' }}>⚠️ Blockers</h3>
        {report.Blockers.length === 0 ? <p style={{ color: 'gray', fontStyle: 'italic' }}>Clear! No blockers tracked.</p> : (
          <ul>
            {report.Blockers.map((item, index) => <li key={index} style={{ fontWeight: 'bold' }}>{item}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
};
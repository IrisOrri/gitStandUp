import React from 'react';
import { type StandupReport } from '../types/standup';

interface StandupCardProps {
  report: StandupReport | null;
  isLoading: boolean;
}

export const StandupCard: React.FC<StandupCardProps> = ({ report, isLoading }) => {
  
  // State A: Loading / Orchestration state
  if (isLoading) {
    return (
      <div style={{
        padding: '30px',
        borderRadius: '16px',
        background: 'linear-gradient(145deg, #1e1b4b, #311042)',
        border: '1px solid #7c3aed',
        boxShadow: '0 8px 32px 0 rgba(124, 58, 237, 0.2)',
        textAlign: 'center',
        color: '#e9d5ff'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '12px', animation: 'spin 2s linear infinite' }}>🔄</div>
        <p style={{ fontWeight: '600', letterSpacing: '0.5px' }}>
          Querying single-table footprints & executing Llama 3 orchestration...
        </p>
      </div>
    );
  }

  // State B: Empty State (Before data load)
  if (!report) {
    return (
      <div style={{
        padding: '40px 20px',
        borderRadius: '16px',
        background: '#13111c',
        border: '1px dashed #4c1d95',
        textAlign: 'center',
        color: '#a78bfa'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔮</div>
        <p style={{ margin: 0, fontSize: '15px' }}>Your workspace is idle. Tap the engine button above to compile your records.</p>
      </div>
    );
  }

  // State C: Fully rendered Scrum report view
  return (
    <div style={{
      borderRadius: '16px',
      background: '#13111c',
      border: '1px solid #2e1065',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
      maxWidth: '650px',
      margin: '0 auto'
    }}>
      {/* Header Accent Bar */}
      <div style={{
        background: 'linear-gradient(90deg, #6d28d9, #c084fc)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '20px' }}>📋</span>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff', letterSpacing: '0.5px' }}>
          AI-Compiled Scrum Standup
        </h2>
      </div>

      <div style={{ padding: '24px' }}>
        {/* TODAY SECTION */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#c084fc', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
            <span>🚀</span> TODAY (COMPLETED)
          </h3>
          {report.Today.length === 0 ? <p style={{ color: '#6b7280', margin: 0, paddingLeft: '28px' }}>No items pushed.</p> : (
            <ul style={{ margin: 0, paddingLeft: '24px', color: '#e2e8f0', lineHeight: '1.6' }}>
              {report.Today.map((item, index) => <li key={index} style={{ marginBottom: '8px' }}>{item}</li>)}
            </ul>
          )}
        </div>

        {/* TOMORROW SECTION */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#818cf8', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
            <span>📅</span> TOMORROW (FOCUS AREA)
          </h3>
          {report.Tomorrow.length === 0 ? <p style={{ color: '#6b7280', margin: 0, paddingLeft: '28px' }}>No plans compiled.</p> : (
            <ul style={{ margin: 0, paddingLeft: '24px', color: '#e2e8f0', lineHeight: '1.6' }}>
              {report.Tomorrow.map((item, index) => <li key={index} style={{ marginBottom: '8px' }}>{item}</li>)}
            </ul>
          )}
        </div>

        {/* BLOCKERS SECTION */}
        <div>
          <h3 style={{ color: '#f87171', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
            <span>⚠️</span> IMPEDIMENTS & BLOCKERS
          </h3>
          {report.Blockers.length === 0 ? (
            <p style={{ color: '#4b5563', fontStyle: 'italic', margin: 0, paddingLeft: '28px' }}>Clear! No blocking constraints tracked.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '24px', color: '#fca5a5', lineHeight: '1.6' }}>
              {report.Blockers.map((item, index) => (
                <li key={index} style={{ marginBottom: '8px', fontWeight: '500' }}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
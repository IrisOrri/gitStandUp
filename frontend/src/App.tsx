import { useState } from 'react';
import { StandupCard } from './components/StandupCard';
import { type StandupReport } from './types/standup';

function App() {
  const [report, setReport] = useState<StandupReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Keeping mock data for this preview step so you can check out the colors immediately!
  const handleLoadMockTemplate = () => {
    setIsLoading(true);
    setTimeout(() => {
      const payload: StandupReport = {
        Today: ["Optimized manual note worker to use explicit timezone-aware datetime footprints"],
        Tomorrow: ["Finish implementing auth service staging environment variables"],
        Blockers: ["Waiting on DevOps to provision the updated staging environment variables for the auth service"]
      };
      setReport(payload);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div style={{
      backgroundColor: '#09070f',
      color: '#f8fafc',
      minHeight: '100vh',
      padding: '60px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box'
    }}>
      {/* BRAND HEADER AREA */}
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '42px', marginBottom: '10px' }}>🔮</div>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          margin: '0 0 10px 0',
          letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          gitStandUp Workspace
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0, fontWeight: '400' }}>
          Automated Developer Log & AI Standup Engine
        </p>
      </header>

      <main style={{ maxWidth: '650px', margin: '0 auto' }}>
        {/* RUN ENGINE TRIGGER BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
          <button 
            onClick={handleLoadMockTemplate}
            disabled={isLoading}
            style={{
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              color: 'white',
              background: 'linear-gradient(135deg, #7c3aed, #db2777)',
              border: 'none',
              borderRadius: '12px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)',
              transform: 'scale(1)',
              transition: 'all 0.2s ease-in-out',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? '🔮 Orchestrating Engine...' : '✨ Generate Standup Draft'}
          </button>
        </div>

        {/* VISUAL CARDS VIEWER */}
        <StandupCard report={report} isLoading={isLoading} />
      </main>
    </div>
  );
}

export default App;
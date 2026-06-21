import { useState } from 'react';
import { StandupCard } from './components/StandupCard';
import { type StandupReport } from './types/standup';
import './App.css';

function App() {
  // 1. Initialize local state hooks (Variables managed dynamically by React)
  const [report, setReport] = useState<StandupReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 2. Mock handler to simulate an API request (We will wire real API fetch in the next step!)
  const handleLoadMockData = () => {
    setIsLoading(true);

    // Simulate network delay of 1.5 seconds
    setTimeout(() => {
      const mockBackendPayload: StandupReport = {
        Today: ["Optimized manual note worker to use explicit timezone-aware datetime footprints"],
        Tomorrow: ["Finish implementing auth service staging environment variables"],
        Blockers: ["Waiting on DevOps to provision the updated staging environment variables for the auth service"]
      };

      setReport(mockBackendPayload); // Save to React memory state
      setIsLoading(false);           // Stop the spinner state
    }, 1500);
  };

  // 3. Render the main dashboard visual structure
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1a1a1a', margin: '0 0 8px 0' }}>🚀 gitStandUp Workspace</h1>
        <p style={{ color: '#666', margin: 0 }}>Automated Developer Log & AI Standup Generator</p>
      </header>

      <main>
        {/* BUTTON CONTROLLER */}
        <div style={{ marginBottom: '24px' }}>
          <button 
            onClick={handleLoadMockData}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: '#646cff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isLoading ? '🔄 Orchestrating...' : '🪄 Generate Standup Draft'}
          </button>
        </div>

        {/* REUSABLE UI CARD COMPONENT */}
        <StandupCard report={report} isLoading={isLoading} />
      </main>
    </div>
  );
}

export default App;
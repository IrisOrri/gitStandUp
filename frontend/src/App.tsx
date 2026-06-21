import { useState } from 'react';
import { StandupCard } from './components/StandupCard';
import { type StandupReport } from './types/standup';

function App() {
  const [report, setReport] = useState<StandupReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 🚀 Real API handler connecting directly to your AWS cloud infrastructure
  const handleFetchLiveStandup = async () => {
    setIsLoading(true);

    // Your live AWS API Gateway base URL from your CDK deployment stack!
    const API_BASE_URL = "https://uett5ksz2e.execute-api.ap-south-1.amazonaws.com"; 
    const USERNAME = "Iris";

    try {
      // Execute an asynchronous HTTP GET request to /standup?username=Iris
      const response = await fetch(`${API_BASE_URL}/standup?username=${USERNAME}`);
      
      if (!response.ok) {
        throw new Error(`Server responded with status code: ${response.status}`);
      }

      // Parse the JSON data matching our strict StandupReport interface contract
      const livePayload: StandupReport = await response.json();
      
      // Save the AI-orchestrated response straight into React state to re-render the view
      setReport(livePayload); 
    } catch (error) {
      console.error("API Integration Breakdown:", error);
      alert("Failed to compile live metrics. Check your browser console log details.");
    } finally {
      setIsLoading(false); // Turn off the glowing loading state
    }
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
      <header style={{ 
        textAlign: 'center', 
        marginBottom: '50px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Force block display and line height to prevent any vertical text crowding */}
        <div style={{ 
          fontSize: '48px', 
          display: 'block',
          lineHeight: '1',
          marginBottom: '16px', 
          filter: 'drop-shadow(0 0 12px rgba(167, 139, 250, 0.4))' 
        }}>
          🔮
        </div>
        
        <h1 style={{
          fontSize: '40px',
          fontWeight: '800',
          margin: '0 0 12px 0',
          padding: '0',
          lineHeight: '1.2',
          letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #c084fc, #f472b6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))', 
        }}>
          gitStandUp Workspace
        </h1>
        
        <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0, fontWeight: '400', letterSpacing: '0.5px' }}>
          Automated Developer Log & AI Standup Engine
        </p>
      </header>

      <main style={{ maxWidth: '650px', margin: '0 auto' }}>
        {/* RUN ENGINE TRIGGER BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
          <button 
            onClick={handleFetchLiveStandup}
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
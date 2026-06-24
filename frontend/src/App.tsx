import { useState } from 'react';
import { StandupCard } from './components/StandupCard';
import { type StandupReport } from './types/standup';

function App() {
  const [noteText, setNoteText] = useState("");
  const [category, setCategory] = useState("today"); // Default category selection
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState<StandupReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCreateManualNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return alert("Note content cannot be empty.");

    setIsSubmitting(true);
    const API_URL = "https://uett5ksz2e.execute-api.ap-south-1.amazonaws.com/notes";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "Iris", 
          content: noteText,
          category: category,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save note: ${response.status}`);
      }

      alert("🎉 Log entry successfully saved to DynamoDB!");
      setNoteText(""); 
    } catch (error) {
      console.error("Submission error:", error);
      alert("Pipeline integration error saving log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFetchLiveStandup = async () => {
    setIsLoading(true);
    const API_BASE_URL = "https://uett5ksz2e.execute-api.ap-south-1.amazonaws.com"; 
    const USERNAME = "Iris";

    try {
      const response = await fetch(`${API_BASE_URL}/standup?username=${USERNAME}`);
      if (!response.ok) {
        throw new Error(`Server responded with status code: ${response.status}`);
      }
      const livePayload: StandupReport = await response.json();
      setReport(livePayload); 
    } catch (error) {
      console.error("API Integration Breakdown:", error);
      alert("Failed to compile live metrics. Check your browser console log details.");
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#09070f] text-white p-6 font-sans">
      
      {/* BRAND HEADER AREA (Clean & Separated) */}
      <header style={{ 
        textAlign: 'center', 
        marginBottom: '50px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
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

      {/* MAIN WORKSPACE SECTION */}
      <main style={{ maxWidth: '650px', width: '100%', margin: '0 auto' }}>
        
        {/* MANUAL WORKSPACE LOG SUBMISSION CONTAINER */}
        <form onSubmit={handleCreateManualNote} className="w-full bg-[#13111a] border border-purple-900/40 rounded-2xl p-6 mb-8 shadow-xl">
          <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
            📝 Append Manual Workspace Update
          </h3>
          
          <div className="flex flex-col gap-4">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="What micro-tasks did you complete or encounter roadblocks with just now?..."
              className="w-full h-24 p-3 bg-[#0d0b12] border border-purple-900/60 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2 bg-[#0d0b12] p-1 rounded-xl border border-purple-900/40">
                {["today", "tomorrow", "blocker"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-1.5 text-xs font-semibold capitalize rounded-lg transition-all cursor-pointer ${
                      category === cat
                        ? "bg-purple-600 text-white shadow-md"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:opacity-50 text-white rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1"
              >
                {isSubmitting ? "Syncing..." : "💾 Sync to Workspace"}
              </button>
            </div>
          </div>
        </form>

        {/* RUN ENGINE TRIGGER BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
          <button
            onClick={handleFetchLiveStandup}
            disabled={isLoading}
            className="
              px-7 py-3.5 
              text-[15px] font-bold text-white 
              bg-gradient-to-r from-purple-600 to-pink-600 
              rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.3)]
              cursor-pointer transition-all duration-300 ease-in-out
              hover:from-purple-500 hover:to-pink-500 
              hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            "
          >
            {isLoading ? "🔮 Compiling Metrics..." : "✨ Generate Standup Draft"}
          </button>
        </div>

        {/* VISUAL CARDS VIEWER */}
        <StandupCard report={report} isLoading={isLoading} />
      </main>
    </div>
  );
}

export default App;
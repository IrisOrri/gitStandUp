import React, { useState } from 'react';
import { signIn, signUp, signOut, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

function App() {
  // Auth state tracking
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [activeUserEmail, setActiveUserEmail] = useState<string>('');
  
  // Input Form fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');
  const [isProcessingAuth, setIsProcessingAuth] = useState<boolean>(false);

  // Standup logging state variables
  const [noteText, setNoteText] = useState<string>('');
  const [category, setCategory] = useState<string>('today');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // AI Generation state tracking
  const [standupDraft, setStandupDraft] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // 🔐 Check session status and load attributes on startup
  React.useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      await getCurrentUser();
      const attributes = await fetchUserAttributes();
      setActiveUserEmail(attributes.email || 'Developer');
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
    }
  };

  // 🔑 Handle Sign In / Sign Up Actions
  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsProcessingAuth(true);

    try {
      if (isSignUpMode) {
        // Run Cognito Sign Up Flow
        await signUp({
          username: email,
          password,
          options: { userAttributes: { email } }
        });
        setAuthSuccess('🎉 Profile created! Switch to Sign In to log in.');
        setIsSignUpMode(false);
        setPassword('');
      } else {
        // Run Cognito Sign In Flow
        const { isSignedIn, nextStep } = await signIn({ username: email, password });
        
        if (isSignedIn) {
          await checkCurrentUser();
          setPassword('');
        } else if (nextStep && nextStep.signInStep === 'CONFIRM_SIGN_UP_STEP') {
          setAuthError('Account requires confirmation via the AWS Console or CLI.');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication transaction failed.');
    } finally {
      setIsProcessingAuth(false);
    }
  };

  // 🚪 Handle Sign Out Action
  const handleSignOut = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setActiveUserEmail('');
      setStandupDraft('');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // 💾 Sync Task to AWS DynamoDB Pipeline
  const handleCreateManualNote = async () => {
    if (!noteText.trim() || !activeUserEmail) return;
    setIsSyncing(true);
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      const jwtToken = session.tokens?.idToken?.toString();

      const response = await fetch('https://uett5ksz2e.execute-api.ap-south-1.amazonaws.com/notes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          user_id: activeUserEmail, 
          category: category,
          content: noteText
        })
      });

      if (!response.ok) throw new Error(`Network bridge failed with status ${response.status}`);
      alert('🎉 Log entry successfully isolated and saved to DynamoDB!');
      setNoteText('');
    } catch (error) {
      alert('Pipeline integration error saving log.');
      console.error('Submission error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // ✨ AI SUMMARY GENERATION TRANSCEIVER 
  const handleGenerateStandup = async () => {
    setIsGenerating(true);
    setStandupDraft(''); 
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      const jwtToken = session.tokens?.idToken?.toString();

      const response = await fetch('https://uett5ksz2e.execute-api.ap-south-1.amazonaws.com/standup', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${jwtToken}`
        }
      });

      if (!response.ok) throw new Error(`Draft synthesis failed with status ${response.status}`);
      
      const data = await response.json();
      
      // 🌟 FIXED LOGIC LAYER:
      // If the response is a pre-parsed JSON object, format it cleanly into strings.
      // If it contains a 'draft' key, use that. Otherwise, handle it as a direct message or string fallback.
      if (data && typeof data === 'object') {
        if (data.draft) {
          setStandupDraft(data.draft);
        } else {
          // Formats the pure Scrum JSON object into a clean, human-readable string inside your textarea/card
          const formattedText = Object.entries(data)
            .map(([category, items]) => {
              const itemList = Array.isArray(items) 
                ? items.map(item => `  - ${item}`).join('\n') 
                : `  - ${items}`;
              return `📌 ${category}:\n${itemList || '  - None logged'}`;
            })
            .join('\n\n');
          
          setStandupDraft(formattedText);
        }
      } else {
        setStandupDraft(data || 'No activities logged for today.');
      }
      
    } catch (error) {
      alert('Error communicating with the AI compilation backend.');
      console.error("AI Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 🚧 RENDER PASS 1: Display Auth Panel if Unauthenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0813] text-gray-100 flex items-center justify-center font-sans p-4">
        <div className="w-full max-w-md bg-[#130f22]/80 border border-purple-900/40 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center mb-8">
            <span className="text-4xl mb-2">🔮</span>
            <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              gitStandUp Workspace
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isSignUpMode ? 'Registration Identity Portal' : 'Identity Authenticator Gate'}
            </p>
          </div>

          <form onSubmit={handleAuthAction} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1b1530] border border-purple-900/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="irisorris02@gmail.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-2">Security Passkey</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1b1530] border border-purple-900/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg p-3">
                ⚠️ {authError}
              </div>
            )}

            {authSuccess && (
              <div className="text-xs text-green-400 bg-green-950/30 border border-green-900/40 rounded-lg p-3">
                {authSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessingAuth}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium text-sm py-3 rounded-lg shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isProcessingAuth ? 'Processing Secures...' : isSignUpMode ? 'Register New Profile' : 'Authenticate Profile'}
            </button>

            <div className="mt-6 text-center border-t border-purple-950/40 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUpMode(!isSignUpMode);
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors underline bg-transparent border-none cursor-pointer"
              >
                {isSignUpMode ? 'Already have an account? Sign In' : "Don't have an account? Register Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 🔮 RENDER PASS 2: Main Workspace Board (Unlocked)
  return (
    <div className="min-h-screen bg-[#0b0813] text-gray-100 font-sans pb-12">
      <header className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center border-b border-purple-950/30">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🔮</span>
          <span className="text-sm font-semibold tracking-wide text-purple-300">gitStandUp Core</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-purple-400/80 bg-purple-950/30 px-3 py-1.5 rounded-md border border-purple-900/20">
            👤 Active: <strong className="text-gray-200 font-medium">{activeUserEmail}</strong>
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs bg-red-950/40 hover:bg-red-900/40 text-red-300 border border-red-900/30 px-3 py-1.5 rounded-md transition-all active:scale-95"
          >
            Disconnect Log
          </button>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center mt-12 px-4">
        <span className="text-5xl mb-3 animate-pulse">🔮</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-pink-600 mb-2">
          gitStandUp Workspace
        </h1>
        <p className="text-sm text-gray-400 mb-10">Automated Developer Log & AI Standup Engine</p>

        {/* Append Manual Log Module */}
        <div className="w-full max-w-3xl bg-[#130f22]/90 border border-purple-900/30 rounded-2xl p-6 shadow-xl mb-6">
          <h3 className="text-md font-semibold text-purple-300 flex items-center mb-4">
            📝 Append Manual Workspace Update
          </h3>

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full min-h-[120px] bg-[#1a142e] border border-purple-950 rounded-xl p-4 text-sm focus:outline-none focus:border-purple-600 transition-all placeholder-gray-500 resize-none text-gray-200"
            placeholder="What micro-tasks did you complete or encounter roadblocks with just now?..."
          />

          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-2 bg-[#1a142e] p-1 rounded-lg border border-purple-950">
              {['today', 'tomorrow', 'blocker'].map((type) => (
                <button
                  key={type}
                  onClick={() => setCategory(type)}
                  className={`text-xs px-3 py-1.5 rounded-md capitalize font-medium transition-all ${
                    category === type
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <button
              onClick={handleCreateManualNote}
              disabled={isSyncing || !noteText.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-all shadow-md active:scale-[0.97] disabled:opacity-40"
            >
              {isSyncing ? 'Syncing...' : '💾 Sync to Workspace'}
            </button>
          </div>
        </div>

        {/* Linked AI Engine Button */}
        <button 
          onClick={handleGenerateStandup}
          disabled={isGenerating}
          className="bg-gradient-to-r from-purple-600 via-pink-600 to-pink-700 hover:opacity-95 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-purple-950/50 hover:shadow-purple-500/10 active:scale-95 transition-all mb-8 disabled:opacity-50"
        >
          {isGenerating ? '🔮 Compiling Activity Logs...' : '✨ Generate Standup Draft'}
        </button>

        {/* Dynamic Console Logs Display Card */}
        <div className="w-full max-w-3xl border border-dashed border-purple-900/40 rounded-2xl p-6 bg-[#0d0918]/40 min-h-[150px] flex flex-col justify-center">
          {standupDraft ? (
            <div className="text-left animate-fadeIn">
              <h4 className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-2">🤖 Generated Standup Draft:</h4>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{standupDraft}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-2xl mb-2">🔮</span>
              <p className="text-xs text-gray-500 tracking-wide">
                {isGenerating 
                  ? 'Amazon Bedrock is aggregating your data stratum and engineering a response...' 
                  : 'Your workspace is idle. Tap the engine button above to compile your records.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
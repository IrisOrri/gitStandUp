import React, { useState } from 'react';

interface WebhookIntegrationProps {
  userEmail: string; // Passed from your Cognito state
}

export const WebhookIntegration: React.FC<WebhookIntegrationProps> = ({ userEmail }) => {
  const [copied, setCopied] = useState(false);
  
  const apiBaseUrl = "https://uett5ksz2e.execute-api.ap-south-1.amazonaws.com/";
  const dynamicWebhookUrl = `${apiBaseUrl}?user_id=${encodeURIComponent(userEmail)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dynamicWebhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy webhook string:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-6 p-6 bg-slate-900/60 border border-purple-500/20 rounded-xl backdrop-blur-md">
      <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 flex items-center gap-2">
        ⚙️ Link Your GitHub Repositories
      </h3>
      <p className="mt-1 text-xs text-slate-400">
        Add this unique Webhook URL to your GitHub Repository settings to stream commits automatically.
      </p>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <input 
          type="text" 
          readOnly 
          value={dynamicWebhookUrl} 
          className="w-full bg-slate-950 border border-purple-500/30 text-purple-300 text-xs px-4 py-2.5 rounded-lg font-mono focus:outline-none"
        />
        <button
          onClick={handleCopy}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0 select-none ${
            copied 
              ? 'bg-emerald-600 text-white border border-emerald-400' 
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md'
          }`}
        >
          {copied ? 'Copied! ✓' : 'Copy URL 📋'}
        </button>
      </div>

      <div className="mt-4 p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg text-[11px] text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">⚠️ GitHub Webhook Setup Guide:</p>
        <p>1. Go to your GitHub Repository → <strong>Settings</strong> → <strong>Webhooks</strong> → <strong>Add Webhook</strong>.</p>
        <p>2. Paste this custom URL into the <strong>Payload URL</strong> input block.</p>
        <p>3. Crucial: Change the Content-Type selector to <code className="text-pink-400">application/json</code>.</p>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { Mail, Copy, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';

const TestInvitationManager = () => {
  const [invitationCode, setInvitationCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateCode = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate invitation code');
      }

      setInvitationCode(data.code);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(invitationCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const [email, setEmail] = useState('');

  return (
    <div className="pt-16">
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">
          Test Invitation Manager
        </h1>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col space-y-4">
          <input 
      type="email"
      value={email}
      onChange={e => setEmail(e.target.value)}
      placeholder="Enter test email"
    />
            <button
              onClick={handleGenerateCode}
              disabled={isLoading}
              className="w-full md:w-64 py-2 px-4 rounded-md bg-[#387c7e] hover:bg-[#2c5f60] 
                text-white font-medium transition duration-150 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#387c7e]
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating...' : 'Generate Test Invitation'}
            </button>

            {invitationCode && (
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 p-2 border border-slate-200 rounded-md">
                    {invitationCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    {isCopied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Share this code with testers
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <p>{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInvitationManager;

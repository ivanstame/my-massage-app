import React from 'react';

const SessionConfigWizard = ({
  numSessions,
  setNumSessions,
  sessionDurations,
  setSessionDurations,
  wizardStep,
  setWizardStep,
  isConfiguringDurations,
  setIsConfiguringDurations,
  durations // This comes from your existing durations array
}) => {
  // Helper to show a duration in human-readable format
  const formatDuration = (mins) => {
    return `${mins} minutes (${mins/60} hour${mins === 60 ? '' : 's'})`;
  };

  // Initial session count selector
  if (!isConfiguringDurations) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3 text-slate-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="font-medium">Number of Sessions</h3>
        </div>
        <select
          value={numSessions}
          onChange={(e) => {
            const count = Number(e.target.value);
            setNumSessions(count);
            // Initialize session durations array
            setSessionDurations(Array(count).fill(60));
            if (count > 1) {
              setIsConfiguringDurations(true);
              setWizardStep(0);
            }
          }}
          className="w-full p-2 border border-slate-200 rounded-md 
            focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {[1, 2, 3, 4].map(num => (
            <option key={num} value={num}>
              {num} {num === 1 ? 'Session' : 'Sessions'} 
              {num > 1 ? ' (Back-to-Back)' : ''}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Duration configuration wizard
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-lg">
            Session {wizardStep + 1} Duration
          </h3>
          <div className="text-sm text-slate-500">
            Step {wizardStep + 1} of {numSessions}
          </div>
        </div>

        {/* Duration selection buttons */}
        <div className="space-y-2">
          {durations.map(duration => (
            <button
              key={duration.minutes}
              onClick={() => {
                // Update the duration for current session
                const newDurations = [...sessionDurations];
                newDurations[wizardStep] = duration.minutes;
                setSessionDurations(newDurations);
                
                // Move to next step or finish configuration
                if (wizardStep < numSessions - 1) {
                  setWizardStep(prev => prev + 1);
                } else {
                  setIsConfiguringDurations(false);
                  setWizardStep(0);
                }
              }}
              className={`w-full p-2 rounded-md text-left transition-all
                ${sessionDurations[wizardStep] === duration.minutes
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'border border-slate-200 hover:border-blue-200'}`}
            >
              <div className="font-medium">{duration.label}</div>
              <div className="text-xs text-slate-500">{duration.description}</div>
            </button>
          ))}
        </div>

        {/* Session timeline preview */}
        <div className="mt-4 p-3 bg-slate-50 rounded-md">
          <h4 className="font-medium mb-2">Sessions Configured</h4>
          {sessionDurations.map((duration, index) => (
            <div key={index} 
              className={`text-sm ${index === wizardStep ? 'text-blue-600 font-medium' : 'text-slate-600'}`}>
              Session {index + 1}: {duration ? formatDuration(duration) : 'Not yet configured'}
            </div>
          ))}
        </div>

        {/* Total duration summary */}
        {sessionDurations.some(d => d) && (
          <div className="text-sm text-slate-500">
            Total duration: {formatDuration(sessionDurations.reduce((sum, d) => sum + (d || 0), 0))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionConfigWizard;
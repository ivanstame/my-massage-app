import React, { useState, useEffect } from 'react';
import { CheckCircle, Users } from 'lucide-react';
import SessionConfigWizard from '../SessionConfigWizard';
import MassageSessionConfigurator from './MassageSessionConfigurator';

// Main session configuration panel
const SessionConfigurationPanel = ({
  onSessionConfigChange,
  availableDurations,
  isComplete = false,
  selectedAddons = [],
  setSelectedAddons = () => {},
  selectedMassageType = 'focused',
  setSelectedMassageType = () => {}
}) => {
  // Internal state
  const [numSessions, setNumSessions] = useState(1);
  const [sessionDurations, setSessionDurations] = useState([]);
  const [sessionNames, setSessionNames] = useState([]);
  const [wizardStep, setWizardStep] = useState(0);
  const [isConfiguringDurations, setIsConfiguringDurations] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(null);
  
  // Notify parent component when configuration changes
  useEffect(() => {
    if (numSessions === 1) {
      onSessionConfigChange({
        numSessions: 1,
        selectedDuration,
        sessionDurations: [],
        sessionNames: []
      });
    } else if (sessionDurations.length === numSessions && sessionDurations.every(d => d)) {
      onSessionConfigChange({
        numSessions,
        selectedDuration: null,
        sessionDurations,
        sessionNames
      });
    }
  }, [numSessions, selectedDuration, sessionDurations, sessionNames, onSessionConfigChange]);
  
  // Handle session type change
  const handleSessionTypeChange = (num) => {
    setNumSessions(num);
    if (num === 1) {
      setSessionDurations([]);
      setSessionNames([]);
      setIsConfiguringDurations(false);
      setSelectedDuration(null);
    } else {
      setSessionDurations(Array(num).fill(null));
      setSessionNames(Array(num).fill(''));
      setIsConfiguringDurations(true);
      setWizardStep(0);
    }
  };
  return (
    <>
      {/* Session Configuration */}
      {!isConfiguringDurations ? (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200 relative">
          <CheckCircle className={`absolute top-2 right-2 w-6 h-6 ${
            numSessions > 0 && (numSessions === 1 || sessionDurations.length === numSessions) 
              ? 'text-green-500' 
              : 'text-slate-300'
          }`} />
          <div className="flex items-center mb-3 border-b pb-2">
            <Users className="w-5 h-5 text-blue-500 mr-2" />
            <h2 className="font-medium">Number of Sessions</h2>
          </div>
          
          {numSessions > 1 ? (
            // Multi-session summary
            <div>
              <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700 mb-3">
                <div className="font-medium mb-1">Multi-Session Confirmed:</div>
                {sessionDurations.map((dur, idx) => (
                  <div key={idx} className="text-blue-800 mb-1">
                    {`Session ${idx + 1}: ${sessionNames[idx] || 'Unknown'} - ${dur} minutes`}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setIsConfiguringDurations(true);
                  setWizardStep(0);
                }}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Sessions
              </button>
            </div>
          ) : (
            // Single session dropdown
            <select
              value={numSessions}
              onChange={(e) => handleSessionTypeChange(Number(e.target.value))}
              className="w-full p-2 border border-slate-200 rounded-md hover:border-slate-300 transition-colors"
            >
              {[1, 2, 3, 4].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Session' : 'Sessions'}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : (
        <SessionConfigWizard
          numSessions={numSessions}
          setNumSessions={setNumSessions}
          sessionDurations={sessionDurations}
          setSessionDurations={setSessionDurations}
          sessionNames={sessionNames}
          setSessionNames={setSessionNames}
          wizardStep={wizardStep}
          setWizardStep={setWizardStep}
          isConfiguringDurations={isConfiguringDurations}
          setIsConfiguringDurations={setIsConfiguringDurations}
          durations={availableDurations}
        />
      )}

      {/* Single-session Configuration if numSessions === 1 */}
      {numSessions === 1 && (
        <MassageSessionConfigurator
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
          selectedAddons={selectedAddons}
          setSelectedAddons={setSelectedAddons}
          selectedMassageType={selectedMassageType}
          setSelectedMassageType={setSelectedMassageType}
        />
      )}
    </>
  );
};

export default SessionConfigurationPanel;

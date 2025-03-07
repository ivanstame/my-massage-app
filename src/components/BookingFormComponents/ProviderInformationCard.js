import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const ProviderInformationCard = ({ provider, isComplete }) => {
  return (
    <>
      {provider ? (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200 relative">
          <CheckCircle className={`absolute top-2 right-2 w-6 h-6 ${
            isComplete ? 'text-green-500' : 'text-slate-300'
          }`} />
          <h2 className="text-lg font-medium text-slate-900">
            Booking with {provider.providerProfile.businessName}
          </h2>
        </div>
      ) : (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <div>
              <h3 className="font-medium text-red-800">Provider Information Missing</h3>
              <p className="text-sm text-red-700 mt-1">
                We couldn't find your provider information. The system will use default values, but some features may be limited.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProviderInformationCard;

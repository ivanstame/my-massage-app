import React from 'react';
import { Clock } from 'lucide-react';
import { DateTime } from 'luxon';
import { DEFAULT_TZ } from '../../utils/timeConstants';

const AvailableTimeSlots = ({ 
  availableSlots, 
  selectedTime, 
  onTimeSelected,
  hasValidDuration = false,
  isComplete = false
}) => {
  // Internal function to determine time period (morning, afternoon, evening)
  const formatPeriod = (isoTime) => {
    try {
      const slotDT = DateTime.fromISO(isoTime, { zone: DEFAULT_TZ });
      if (!slotDT.isValid) return 'unavailable';
      
      const hour = slotDT.hour;
      
      if (isNaN(hour)) {
        return 'unavailable';
      }
      
      if (hour >= 6 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 17) return 'afternoon';
      return 'evening';
    } catch (err) {
      console.error('Error determining time period:', isoTime, err);
      return 'unavailable';
    }
  };
  const renderTimeSlots = () => (
    <div className="space-y-6">
      {/* Morning Section */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-2">Morning</h3>
        <div className="grid grid-cols-4 gap-2">
          {!hasValidDuration ? (
            Array(4).fill(null).map((_, idx) => (
              <div key={idx} className="p-2 border rounded text-center text-gray-400 bg-gray-50" />
            ))
          ) : !availableSlots.length ? (
            Array(4).fill(null).map((_, idx) => (
              <div key={idx} className="p-2 border rounded text-center text-gray-400 bg-gray-50" />
            ))
          ) : (
            availableSlots
              .filter(slot => formatPeriod(slot.iso) === 'morning')
              .map(slot => (
                <button
                  key={slot.iso}
                  onClick={() => onTimeSelected(slot)}
                  className={`p-2 text-center rounded border transition-all ${
                    selectedTime?.iso === slot.iso
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <span className="local-time">{slot.local}</span>
                  <div className="text-xs text-gray-500">{DateTime.fromISO(slot.iso).toFormat('ZZ')}</div>
                </button>
              ))
          )}
        </div>
      </div>

      {/* Afternoon Section */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-2">Afternoon</h3>
        <div className="grid grid-cols-4 gap-2">
          {!hasValidDuration ? (
            Array(4).fill(null).map((_, idx) => (
              <div key={idx} className="p-2 border rounded text-center text-gray-400 bg-gray-50" />
            ))
          ) : !availableSlots.length ? (
            Array(4).fill(null).map((_, idx) => (
              <div key={idx} className="p-2 border rounded text-center text-gray-400 bg-gray-50" />
            ))
          ) : (
            availableSlots
              .filter(slot => formatPeriod(slot.iso) === 'afternoon')
              .map(slot => (
                <button
                  key={slot.iso}
                  onClick={() => onTimeSelected(slot)}
                  className={`p-2 text-center rounded border transition-all ${
                    selectedTime?.iso === slot.iso
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <span className="local-time">{slot.local}</span>
                  <div className="text-xs text-gray-500">{DateTime.fromISO(slot.iso).toFormat('ZZ')}</div>
                </button>
              ))
          )}
        </div>
      </div>

      {/* Evening Section */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-2">Evening</h3>
        <div className="grid grid-cols-4 gap-2">
          {!hasValidDuration ? (
            Array(4).fill(null).map((_, idx) => (
              <div key={idx} className="p-2 border rounded text-center text-gray-400 bg-gray-50" />
            ))
          ) : !availableSlots.length ? (
            Array(4).fill(null).map((_, idx) => (
              <div key={idx} className="p-2 border rounded text-center text-gray-400 bg-gray-50" />
            ))
          ) : (
            availableSlots
              .filter(slot => formatPeriod(slot.iso) === 'evening')
              .map(slot => (
                <button
                  key={slot.iso}
                  onClick={() => onTimeSelected(slot)}
                  className={`p-2 text-center rounded border transition-all ${
                    selectedTime?.iso === slot.iso
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <span className="local-time">{slot.local}</span>
                  <div className="text-xs text-gray-500">{DateTime.fromISO(slot.iso).toFormat('ZZ')}</div>
                </button>
              ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
        <div className="flex items-center mb-3 border-b pb-2">
          <Clock className="w-5 h-5 text-blue-500 mr-2" />
          <h2 className="font-medium">Available Times</h2>
          {!selectedTime && availableSlots.length > 0 && (
            <span className="ml-2 text-sm text-blue-600">(Select a time to continue)</span>
          )}
        </div>

        {renderTimeSlots()}
      </div>
    </div>
  );
};

export default AvailableTimeSlots;

import React, { useState } from 'react';
import { Clock, MapPin, AlertCircle } from 'lucide-react';

const AddAvailabilityModal = ({ date, onAdd, onClose, serviceArea }) => {
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [type, setType] = useState('autobook');
  const [error, setError] = useState(null);

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const displayHour = hour % 12 || 12;
        const period = hour >= 12 ? 'PM' : 'AM';
        const time = `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
        options.push(<option key={time} value={time}>{time}</option>);
      }
    }
    return options;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    // Convert local time to UTC time string
    const toUTC = (time12h) => {
      const [timePart, period] = time12h.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      // Create date in local timezone
      const localDate = new Date(date);
      localDate.setHours(hours, minutes, 0, 0);

      // Convert to UTC
      const utcHours = localDate.getUTCHours().toString().padStart(2, '0');
      const utcMinutes = localDate.getUTCMinutes().toString().padStart(2, '0');
      
      return `${utcHours}:${utcMinutes}`;
    };

    const availability = {
      date: date.toISOString().split('T')[0],
      start: toUTC(startTime),
      end: toUTC(endTime),
      type,
      serviceArea
    };

    onAdd(availability);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full 
      flex items-center justify-center z-50 modal-overlay"
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md modal-content">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-slate-900">Add Availability</h2>
          {serviceArea && (
            <div className="flex items-center text-sm text-slate-500">
              <MapPin className="w-4 h-4 mr-1" />
              {serviceArea.radius} mile radius
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-slate-700 mb-1">
              Start Time
            </label>
            <select
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border rounded-md p-2 focus:ring-[#387c7e] focus:border-[#387c7e]"
            >
              {generateTimeOptions()}
            </select>
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-slate-700 mb-1">
              End Time
            </label>
            <select
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border rounded-md p-2 focus:ring-[#387c7e] focus:border-[#387c7e]"
            >
              {generateTimeOptions()}
            </select>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">
              Availability Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded-md p-2 focus:ring-[#387c7e] focus:border-[#387c7e]"
            >
              <option value="autobook">Auto-book (Clients can book directly)</option>
              <option value="unavailable">Unavailable (Blocked time)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md 
                transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#387c7e] text-white rounded-md hover:bg-[#2c5f60] 
                transition-colors"
            >
              Add Block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAvailabilityModal;

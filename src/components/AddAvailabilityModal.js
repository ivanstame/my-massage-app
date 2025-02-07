import React, { useState } from 'react';
import { Clock, MapPin, AlertCircle } from 'lucide-react';
import { DateTime } from 'luxon';
import { DEFAULT_TZ, TIME_FORMATS } from '../../utils/timeConstants';

const AddAvailabilityModal = ({ date, onAdd, onClose, serviceArea }) => {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [type, setType] = useState('autobook');
  const [error, setError] = useState(null);

  const generateTimeOptions = () => {
    const slots = [];
    let currentTime = DateTime.fromObject({ hour: 0, minute: 0 }, { zone: DEFAULT_TZ });
    const endOfDay = DateTime.fromObject({ hour: 23, minute: 30 }, { zone: DEFAULT_TZ });

    while (currentTime <= endOfDay) {
      slots.push(
        <option key={currentTime.toFormat('HH:mm')} value={currentTime.toFormat('HH:mm')}>
          {currentTime.toFormat(TIME_FORMATS.TIME_12H)}
        </option>
      );
      currentTime = currentTime.plus({ minutes: 30 });
    }
    return slots;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const dateLA = DateTime.fromJSDate(date).setZone(DEFAULT_TZ);
    
    // Convert times to UTC
    const startDateTime = DateTime.fromFormat(`${dateLA.toFormat('yyyy-MM-dd')} ${startTime}`, 'yyyy-MM-dd HH:mm', { zone: DEFAULT_TZ });
    const endDateTime = DateTime.fromFormat(`${dateLA.toFormat('yyyy-MM-dd')} ${endTime}`, 'yyyy-MM-dd HH:mm', { zone: DEFAULT_TZ });

    // Validate times
    if (!startDateTime.isValid || !endDateTime.isValid) {
      setError('Invalid time format');
      return;
    }

    if (endDateTime <= startDateTime) {
      setError('End time must be after start time');
      return;
    }

    const availability = {
      date: dateLA.toJSDate(),
      start: startTime,
      end: endTime,
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
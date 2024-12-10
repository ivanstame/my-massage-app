import React, { useState, useEffect } from 'react';

const ModifyAvailabilityModal = ({ block, onModify, onClose }) => {
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [type, setType] = useState('autobook');

  useEffect(() => {
    // Convert 24h to 12h format for initial values
    const convert24to12 = (time24) => {
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour.toString().padStart(2, '0')}:${minutes} ${period}`;
    };

    if (block) {
      setStartTime(convert24to12(block.start));
      setEndTime(convert24to12(block.end));
      setType(block.type);
    }
  }, [block]);

  const formatTime = (hour, minute) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 7; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = formatTime(hour, minute);
        options.push(<option key={time} value={time}>{time}</option>);
      }
    }
    return options;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert back to 24-hour format for backend
    const to24Hour = (time) => {
      const [timePart, period] = time.split(' ');
      let [hours, minutes] = timePart.split(':');
      hours = parseInt(hours);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    };

    onModify({
      ...block,
      start: to24Hour(startTime),
      end: to24Hour(endTime),
      type
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4">Modify Availability</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="startTime" className="block mb-1">Start Time</label>
            <select
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border rounded p-2"
            >
              {generateTimeOptions()}
            </select>
          </div>
          <div>
            <label htmlFor="endTime" className="block mb-1">End Time</label>
            <select
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border rounded p-2"
            >
              {generateTimeOptions()}
            </select>
          </div>
          <div>
            <label htmlFor="type" className="block mb-1">Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="autobook">Auto-book</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModifyAvailabilityModal;
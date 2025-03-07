import React from 'react';
import { CheckCircle } from 'lucide-react';
import ResponsiveCalendar from '../ResponsiveCalendar';

const CalendarSection = ({ 
  selectedDate, 
  setSelectedDate, 
  availableSlots, 
  isDisabled = false,
  isComplete = false 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm relative ${
      isDisabled ? 'opacity-50 pointer-events-none' : ''
    } relative`}>
      <CheckCircle className={`absolute top-2 right-2 w-6 h-6 ${
        isComplete ? 'text-green-500' : 'text-slate-300'
      }`} />
      <ResponsiveCalendar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        events={availableSlots.map(slot => ({
          date: selectedDate,
          time: slot
        }))}
      />
      {isDisabled && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
          <p className="text-slate-500">Complete location first</p>
        </div>
      )}
    </div>
  );
};

export default CalendarSection;

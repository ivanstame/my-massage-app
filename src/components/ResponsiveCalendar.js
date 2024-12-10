import React, { useState, useRef, useEffect } from 'react';
import MonthCalendar from './MonthCalendar';
import { convertTo12Hour } from '../utils/timeUtils';

const MobileDatePicker = ({ selectedDate, onDateChange, events }) => {
  const scrollRef = useRef(null);
  const [month, setMonth] = useState(selectedDate.getMonth());
  const [year, setYear] = useState(selectedDate.getFullYear());

  // Generate dates for current month
  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dates = getDaysInMonth(year, month);

  useEffect(() => {
    if (scrollRef.current) {
      const today = new Date().getDate();
      const selectedElement = scrollRef.current.children[today - 1];
      if (selectedElement) {
        selectedElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'center' 
        });
      }
    }
  }, [month]);

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const hasEvents = (date) => {
    return events.some(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Month selector */}
      <div className="bg-slate-700 p-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={handlePrevMonth}
            className="text-white hover:text-slate-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-white">
            {monthNames[month]} {year}
          </h2>
          <button 
            onClick={handleNextMonth}
            className="text-white hover:text-slate-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable dates */}
      <div className="overflow-x-auto scrollbar-hide py-4 px-2">
        <div 
          ref={scrollRef}
          className="flex space-x-2 min-w-full px-2"
        >
          {dates.map((date) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const hasEventToday = hasEvents(date);
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            return (
              <button
                key={date.toISOString()}
                onClick={() => onDateChange(date)}
                className={`
                  flex flex-col items-center justify-center
                  min-w-[4rem] py-2 px-3 rounded-full
                  transition-all duration-200 ease-in-out
                  ${isSelected 
                    ? 'bg-slate-700 text-white' 
                    : 'hover:bg-slate-100'
                  }
                `}
              >
                <span className="text-xs font-medium mb-1 
                  ${isSelected ? 'text-slate-300' : 'text-slate-500'}">
                  {dayNames[date.getDay()]}
                </span>
                <span className={`
                  text-lg font-semibold
                  ${isSelected 
                    ? 'text-white' 
                    : isToday 
                      ? 'text-blue-600' 
                      : 'text-slate-700'
                  }
                `}>
                  {date.getDate()}
                </span>
                {hasEventToday && !isSelected && (
                  <span className="mt-1 w-1 h-1 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ResponsiveCalendar = ({ selectedDate, onDateChange, events }) => {
  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden">
        <MobileDatePicker 
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          events={events}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <MonthCalendar 
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          events={events}
        />
      </div>
    </>
  );
};

export default ResponsiveCalendar;

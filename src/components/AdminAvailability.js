import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import ResponsiveCalendar from './ResponsiveCalendar';
import DaySchedule from './DaySchedule';
import AddAvailabilityModal from './AddAvailabilityModal';
import ModifyAvailabilityModal from './ModifyAvailabilityModal';

const AdminAvailability = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availabilityBlocks, setAvailabilityBlocks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const [conflictInfo, setConflictInfo] = useState(null);
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchAvailabilityBlocks = useCallback(async (date) => {
    try {
      const response = await axios.get(`/api/availability/blocks/${date.toISOString().split('T')[0]}`, {
        withCredentials: true
      });
      setAvailabilityBlocks(response.data);
    } catch (error) {
      console.error('Error fetching availability blocks:', error);
    }
  }, []);

  const fetchBookings = useCallback(async (date) => {
    try {
      const response = await axios.get(`/api/bookings?date=${date.toISOString().split('T')[0]}`, {
        withCredentials: true
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }, []);

  useEffect(() => {
    if (user && user.isAdmin) {
      fetchAvailabilityBlocks(selectedDate);
      fetchBookings(selectedDate);
    } else {
      navigate('/login');
    }
  }, [selectedDate, user, navigate, fetchAvailabilityBlocks, fetchBookings]);

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  const handleAddAvailability = useCallback(async (newAvailability) => {
    try {
      const response = await axios.post('/api/availability', newAvailability, {
        withCredentials: true
      });
      await fetchAvailabilityBlocks(selectedDate);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding availability:', error);
    }
  }, [fetchAvailabilityBlocks, selectedDate]);

  const handleModifyClick = useCallback((block) => {
    setSelectedBlock(block);
    setModifyModalOpen(true);
  }, []);

  const handleModifyAvailability = useCallback(async (modifiedBlock) => {
    try {
      const response = await axios.put(
        `/api/availability/${modifiedBlock._id}`,
        modifiedBlock,
        {
          withCredentials: true
        }
      );

      if (response.status === 200) {
        await fetchAvailabilityBlocks(selectedDate);
        setError(null);
        setConflictInfo(null);
        setModifyModalOpen(false);
        setSelectedBlock(null);
      }
    } catch (error) {
      console.error('Error modifying availability:', error);
      if (error.response?.data?.conflicts) {
        setConflictInfo({
          type: 'modify',
          message: error.response.data.message,
          conflicts: error.response.data.conflicts
        });
      } else {
        setError('Failed to modify availability block');
      }
    }
  }, [fetchAvailabilityBlocks, selectedDate]);

  const handleDeleteAvailability = useCallback(async (blockId) => {
    try {
      const response = await axios.delete(`/api/availability/${blockId}`, {
        withCredentials: true
      });

      if (response.status === 200) {
        await fetchAvailabilityBlocks(selectedDate);
        setError(null);
        setConflictInfo(null);
      }
    } catch (error) {
      console.error('Error deleting availability:', error);
      if (error.response?.data?.conflicts) {
        setConflictInfo({
          type: 'delete',
          message: error.response.data.message,
          conflicts: error.response.data.conflicts
        });
      } else {
        setError('Failed to delete availability block');
      }
    }
  }, [fetchAvailabilityBlocks, selectedDate]);

  const formatTime = useCallback((time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  }, []);

  const formatDuration = useCallback((start, end) => {
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    let duration = [];
    if (hours > 0) duration.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) duration.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    
    return duration.join(' and ');
  }, []);

  const renderAvailabilityDetails = useCallback(() => {
    if (availabilityBlocks.length === 0) {
      return (
        <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <p className="text-slate-600">No availability set for this date.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 
              focus:ring-blue-500 shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add First Availability Block
          </button>
        </div>
      );
    }

    return (
        <div className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {renderConflictInfo()}
          
          {availabilityBlocks.map((block, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden
                transition duration-200 ease-in-out hover:shadow-md"
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-medium text-slate-900">
                        {formatTime(block.start)} - {formatTime(block.end)}
                      </span>
                      <span className={`
                        px-2.5 py-0.5 text-xs font-medium rounded-full
                        ${block.type === 'autobook' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'}
                      `}>
                        {block.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {formatDuration(block.start, block.end)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleModifyClick(block)}
                      className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300
                        text-sm font-medium rounded-md text-slate-700 hover:bg-slate-50
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                        transition-colors duration-200 ease-in-out"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    
                    <button 
                      onClick={() => handleDeleteAvailability(block._id)}
                      className="inline-flex items-center px-3 py-1.5 bg-white border border-red-300
                        text-sm font-medium rounded-md text-red-700 hover:bg-red-50
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                        transition-colors duration-200 ease-in-out"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white
              rounded-md hover:bg-blue-700 transition-colors duration-200 ease-in-out 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Availability Block
          </button>
        </div>
      );
    }, [availabilityBlocks, error, formatTime, formatDuration, handleDeleteAvailability, handleModifyClick]);

    const renderConflictInfo = useCallback(() => {
      if (!conflictInfo) return null;

      return (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-400 rounded">
          <h3 className="font-semibold text-yellow-800">{conflictInfo.message}</h3>
          <p className="mt-2 text-sm text-yellow-700">Affected appointments:</p>
          <ul className="mt-1 text-sm">
            {conflictInfo.conflicts.map((booking, index) => (
              <li key={index} className="ml-4">
                • {booking.time} - {booking.client}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-yellow-700">
            Please contact affected clients before {conflictInfo.type === 'delete' ? 'deleting' : 'modifying'} this block.
          </p>
          <button 
            onClick={() => setConflictInfo(null)}
            className="mt-2 text-sm text-yellow-800 underline"
          >
            Dismiss
          </button>
        </div>
      );
    }, [conflictInfo]);

    if (!user || !user.isAdmin) {
      return null;
    }

    return (
    <div className="pt-16"> 
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Manage Availability</h1>
        
        {/* Desktop View */}
        <div className="hidden lg:flex lg:flex-row gap-6">
          <div className="lg:w-1/3">
            <ResponsiveCalendar 
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              events={availabilityBlocks}
            />
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-4">Availability Details:</h2>
              {renderAvailabilityDetails()}
            </div>
          </div>
          <div className="lg:w-2/3">
            <DaySchedule 
              date={selectedDate}
              availabilityBlocks={availabilityBlocks}
              bookings={bookings}
              onModify={handleModifyAvailability}
              onDelete={handleDeleteAvailability}
            />
          </div>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden relative h-[calc(100vh-6rem)] flex flex-col">
          <div className="sticky top-0 z-10 bg-white pb-4">
            <ResponsiveCalendar 
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              events={availabilityBlocks}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <DaySchedule 
              date={selectedDate}
              availabilityBlocks={availabilityBlocks}
              bookings={bookings}
              onModify={handleModifyAvailability}
              onDelete={handleDeleteAvailability}
            />
          </div>
          
{/* Floating Button for Add Availability */}
<div className="fixed bottom-4 right-4 z-50">
  <button 
    onClick={() => setIsModalOpen(true)}  // Direct to modal
    className="bg-slate-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center"
  >
    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
      {availabilityBlocks.length}
    </span>
    <svg 
      className="w-6 h-6" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
      />
    </svg>
  </button>

            {isDetailsOpen && (
              <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl w-80 max-h-[80vh] overflow-auto border border-slate-200">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">Availability Details</h2>
                    <button 
                      onClick={() => setIsDetailsOpen(false)}
                      className="text-slate-400 hover:text-slate-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {renderAvailabilityDetails()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {isModalOpen && (
          <AddAvailabilityModal
            date={selectedDate}
            onAdd={handleAddAvailability}
            onClose={() => setIsModalOpen(false)}
          />
        )}
        {modifyModalOpen && selectedBlock && (
          <ModifyAvailabilityModal
            block={selectedBlock}
            onModify={handleModifyAvailability}
            onClose={() => {
              setModifyModalOpen(false);
              setSelectedBlock(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AdminAvailability;
// src/services/bookingService.js
import api from './api';

export const bookingService = {
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/api/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error creating booking';
    }
  },

  getBookings: async (date) => {
    try {
      const response = await api.get('/api/bookings', {
        params: { date }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error fetching bookings';
    }
  },

  cancelBooking: async (bookingId) => {
    try {
      const response = await api.delete(`/api/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error cancelling booking';
    }
  }
};
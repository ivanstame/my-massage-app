// src/services/api.js
import axios from 'axios';

const currentHost = window.location.hostname;
const baseURL = currentHost === 'localhost' 
  ? `http://localhost:5000`
  : `http://192.168.1.26:5000`;

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Log the API configuration
console.log('API Service initialized with:', { baseURL, currentHost });

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Redirect to login or handle session expiration
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

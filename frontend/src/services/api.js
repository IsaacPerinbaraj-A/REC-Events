import axios from 'axios';

// Base URL - your backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
};

// ==================== EVENT APIs ====================
export const eventAPI = {
  getAllEvents: async (params = {}) => {
    const response = await api.get('/events', { params });
    return response.data;
  },
  getEventById: async (eventId) => {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },
  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },
  updateEvent: async (eventId, eventData) => {
    const response = await api.put(`/events/${eventId}`, eventData);
    return response.data;
  },
  deleteEvent: async (eventId) => {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },
  getMyEvents: async () => {
    const response = await api.get('/events/manager/my-events');
    return response.data;
  },
  // FIXED: Removed duplicate closeEvent
  closeEvent: async (eventId) => {
    const response = await api.put(`/events/${eventId}/close`);
    return response.data;
  },
  reopenEvent: async (eventId) => {
    const response = await api.put(`/events/${eventId}/reopen`);
    return response.data;
  },
};

// ==================== REGISTRATION APIs ====================
export const registrationAPI = {
  registerForEvent: async (eventId) => {
    const response = await api.post('/registrations', { eventId });
    return response.data;
  },
  getMyRegistrations: async () => {
    const response = await api.get('/registrations/my-registrations');
    return response.data;
  },
  cancelRegistration: async (registrationId) => {
    const response = await api.delete(`/registrations/${registrationId}`);
    return response.data;
  },
  getEventAttendees: async (eventId) => {
    const response = await api.get(`/registrations/event/${eventId}`);
    return response.data;
  },
  exportEventAttendees: async (eventId) => {
    const response = await api.get(`/registrations/event/${eventId}/export`);
    return response.data;
  },
};

// ==================== USER APIs ====================
export const userAPI = {
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  getUserStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },
};

export default api;

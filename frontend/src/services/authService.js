import api from './api';

const AUTH_URL = '/auth';

// Helper to get the appropriate storage based on rememberMe preference
const getStorage = (rememberMe) => {
  return rememberMe ? localStorage : sessionStorage;
};

// Helper to clear all auth data from both storages
const clearAllAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};

// Helper to store auth data
const storeAuthData = (token, user, rememberMe) => {
  const storage = getStorage(rememberMe);
  // Clear the other storage first
  if (rememberMe) {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(user));
};

const authService = {
  // Register a new user
  register: async (userData, rememberMe = true) => {
    const response = await api.post(`${AUTH_URL}/register`, userData);
    if (response.data.data?.accessToken) {
      const token = response.data.data.accessToken;
      const user = response.data.data.user;
      storeAuthData(token, user, rememberMe);
      return { token, user };
    }
    return response.data;
  },

  // Login user
  login: async (credentials, rememberMe = false) => {
    const response = await api.post(`${AUTH_URL}/login`, credentials);
    if (response.data.data?.accessToken) {
      const token = response.data.data.accessToken;
      const user = response.data.data.user;
      storeAuthData(token, user, rememberMe);
      return { token, user };
    }
    return response.data;
  },

  // Logout user
  logout: () => {
    clearAllAuthData();
    // Optionally call backend logout endpoint
    api.post(`${AUTH_URL}/logout`).catch(() => {});
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get(`${AUTH_URL}/profile`);
    return response.data.data || response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put(`${AUTH_URL}/profile`, profileData);
    if (response.data.data?.user || response.data.user) {
      const user = response.data.data?.user || response.data.user;
      // Update in whichever storage has the token
      if (localStorage.getItem('token')) {
        localStorage.setItem('user', JSON.stringify(user));
      } else if (sessionStorage.getItem('token')) {
        sessionStorage.setItem('user', JSON.stringify(user));
      }
    }
    return response.data;
  },

  // Request password reset
  forgotPassword: async (email) => {
    const response = await api.post(`${AUTH_URL}/forgot-password`, { email });
    return response.data;
  },

  // Reset password with token
  resetPassword: async (token, password) => {
    const response = await api.post(`${AUTH_URL}/reset-password`, { token, password });
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await api.get(`${AUTH_URL}/verify-email/${token}`);
    return response.data;
  },

  // Refresh token
  refreshToken: async (rememberMe = false) => {
    const response = await api.post(`${AUTH_URL}/refresh-token`);
    if (response.data.data?.accessToken) {
      const token = response.data.data.accessToken;
      storeAuthData(token, authService.getStoredUser(), rememberMe);
      return { token };
    }
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  },

  // Get stored user
  getStoredUser: () => {
    const localUser = localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('user');
    const userStr = localUser || sessionUser;
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  },
};

export default authService;

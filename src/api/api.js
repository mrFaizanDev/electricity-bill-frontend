const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper for HTTP requests with auto JWT token header injection
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('bill_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // If token expired / invalid, remove from storage
      if (response.status === 401 && !endpoint.includes('/login')) {
        localStorage.removeItem('bill_token');
        localStorage.removeItem('bill_user');
        window.location.href = '/login';
      }
      throw new Error(data.message || 'Something went wrong with the request');
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error);
    throw error;
  }
};

export const api = {
  // Auth endpoints
  auth: {
    login: (username, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    getMe: () => request('/auth/me'),
    changePassword: (currentPassword, newPassword) =>
      request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    createUser: (userData) =>
      request('/auth/create-user', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getUsers: () => request('/auth/users'),
    deleteUser: (id) =>
      request(`/auth/users/${id}`, {
        method: 'DELETE',
      }),
    resetUserPassword: (id, newPassword) =>
      request(`/auth/users/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      }),
  },

  // Bill endpoints
  bills: {
    getAll: (search = '') =>
      request(`/bills${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    getById: (id) => request(`/bills/${id}`),
    create: (billData) =>
      request('/bills', {
        method: 'POST',
        body: JSON.stringify(billData),
      }),
    update: (id, billData) =>
      request(`/bills/${id}`, {
        method: 'PUT',
        body: JSON.stringify(billData),
      }),
    delete: (id) =>
      request(`/bills/${id}`, {
        method: 'DELETE',
      }),
    getStats: () => request('/bills/stats/summary'),
  },

  // Health
  health: () => request('/health'),
};

export default api;

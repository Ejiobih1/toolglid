// Use environment variable for API URL, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get stored auth token
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Set auth token
const setAuthToken = (token) => {
  localStorage.setItem('auth_token', token);
};

// Remove auth token
const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
};

// API request wrapper with auth header
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Authentication APIs
export const authAPI = {
  // Register new user
  register: async (email, password) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      setAuthToken(data.token);
    }

    return data;
  },

  // Login user
  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      setAuthToken(data.token);
    }

    return data;
  },

  // Get current user
  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },

  // Check premium status
  checkPremium: async () => {
    return await apiRequest('/auth/check-premium');
  },

  // Logout
  logout: () => {
    removeAuthToken();
  },
};

// Payment APIs
export const paymentAPI = {
  // Create Stripe checkout session
  createCheckoutSession: async () => {
    return await apiRequest('/payments/create-checkout-session', {
      method: 'POST',
    });
  },

  // Cancel subscription
  cancelSubscription: async () => {
    return await apiRequest('/payments/cancel-subscription', {
      method: 'POST',
    });
  },
};

// Video APIs
export const videoAPI = {
  // Get all videos
  getAll: async () => {
    const response = await fetch(`${API_URL}/videos`);
    const data = await response.json();
    return data.videos || [];
  },

  // Add video (admin only)
  add: async (videoData) => {
    return await apiRequest('/videos', {
      method: 'POST',
      body: JSON.stringify(videoData),
    });
  },

  // Update video (admin only)
  update: async (id, videoData) => {
    return await apiRequest(`/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(videoData),
    });
  },

  // Delete video (admin only)
  delete: async (id) => {
    return await apiRequest(`/videos/${id}`, {
      method: 'DELETE',
    });
  },
};

// Helper to check if user is authenticated
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Export token management
export { getAuthToken, setAuthToken, removeAuthToken };

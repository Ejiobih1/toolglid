import { supabase } from '../lib/supabase';

// DEPRECATED - Backend API no longer needed, using Supabase for all operations
// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get Supabase auth token
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

// DEPRECATED - API request wrapper no longer needed, using Supabase directly
// const apiRequest = async (endpoint, options = {}) => {
//   const token = await getAuthToken();
//   const headers = {
//     'Content-Type': 'application/json',
//     ...options.headers,
//   };
//   if (token) {
//     headers['Authorization'] = `Bearer ${token}`;
//   }
//   const config = {
//     ...options,
//     headers,
//   };
//   try {
//     const response = await fetch(`${API_URL}${endpoint}`, config);
//     const data = await response.json();
//     if (!response.ok) {
//       throw new Error(data.error || data.message || 'Request failed');
//     }
//     return data;
//   } catch (error) {
//     console.error('API request failed:', error);
//     throw error;
//   }
// };

// Helper to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Payment APIs - DEPRECATED - Now using Supabase Edge Functions
// Stripe payments are handled by:
// - supabase/functions/create-checkout for creating checkout sessions
// - supabase/functions/stripe-webhook for webhook handling
// See PremiumCheckout component for implementation

// Video APIs (using Supabase)
export const videoAPI = {
  // Get all videos
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      return [];
    }
  },

  // Add video (admin only)
  add: async (videoData) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .insert([videoData])
        .select()
        .single();

      if (error) {
        console.error('Error adding video:', error);
        throw error;
      }

      return { success: true, video: data };
    } catch (error) {
      console.error('Failed to add video:', error);
      throw error;
    }
  },

  // Update video (admin only)
  update: async (id, videoData) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .update(videoData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating video:', error);
        throw error;
      }

      return { success: true, video: data };
    } catch (error) {
      console.error('Failed to update video:', error);
      throw error;
    }
  },

  // Delete video (admin only)
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting video:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to delete video:', error);
      throw error;
    }
  },
};

// Export auth token getter
export { getAuthToken };

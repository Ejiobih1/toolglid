import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// IMPORTANT: Set these in your deployment environment variables
// Get these values from: https://app.supabase.com/project/_/settings/api
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
  throw new Error('Supabase configuration error: Missing environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Export the URL for use in edge function calls
export const SUPABASE_URL = supabaseUrl;

// Supabase client configuration
// Using dynamic import to avoid webpack ESM issues

let supabaseClient = null;

export const getSupabase = async () => {
  if (supabaseClient) return supabaseClient;

  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
};

// Export synchronous client (will be initialized on first import)
export let supabase;

(async () => {
  supabase = await getSupabase();
})();

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a singleton supabase client
let _supabase: SupabaseClient | null = null;

// Function to get or create the Supabase client
export const getSupabaseClient = (): SupabaseClient => {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Supabase configuration error. Please check your environment variables.');
    }
    
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true, 
        detectSessionInUrl: true,
        storageKey: 'sb:token', // Use a consistent storage key
      },
      global: {
        headers: { 'x-application-name': 'ridepilot-mobile' },
      },
      // Set more conservative timeouts for mobile connections
      realtime: {
        params: {
          eventsPerSecond: 1
        } 
      },
      // More conservative network settings for mobile
      db: {
        schema: 'public'
      },
      // Add network resilience
      queryTimeout: 30000,
      requestHook: async (request) => {
        request.headers.append('X-Client-Info', 'mobile-web');
        return request;
      }
    });
  }
  
  return _supabase;
};

// Export the singleton instance
export const supabase = getSupabaseClient();

// Test Supabase connection
export const testConnection = async (): Promise<boolean> => {
  try {
    // A lightweight health check
    const { data, error } = await supabase.from('companies').select('count').single();
    
    if (error) {
      console.error('Supabase connection error:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unable to connect to Supabase:', error);
    return false;
  }
};

// Utility function for better error handling in Supabase queries
export const safeQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const { data, error } = await queryFn();
    if (error) {
      return { data: null, error: error.message || 'Database error occurred' };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Query error:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'An unknown error occurred'
    };
  }
};
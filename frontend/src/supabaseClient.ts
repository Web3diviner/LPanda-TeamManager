import { createClient } from '@supabase/supabase-js';

// Pull the keys from your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create and export the secure connection
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
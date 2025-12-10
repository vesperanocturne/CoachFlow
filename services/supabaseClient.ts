import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Debug log to help verify connection details in console
console.log('Supabase Config:', { 
  url: supabaseUrl ? 'Set' : 'Missing', 
  key: supabaseAnonKey ? 'Set' : 'Missing' 
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Key is missing. Authentication will fail.');
}

// Use provided credentials as robust fallback
const urlToUse = supabaseUrl || 'https://ihzaahmeqomncumwlcsg.supabase.co';
const keyToUse = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloemFhaG1lcW9tbmN1bXdsY3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODU1MjEsImV4cCI6MjA4MDk2MTUyMX0.NV7a7Qly7nSBP5bIkJjpbTHJmOmG2ybwc9A9DkpIaQQ';

// Casting to any to bypass strict type checks between v1/v2 if necessary
export const supabase = createClient(
  urlToUse,
  keyToUse
) as any;
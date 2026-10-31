import { createClient } from '@supabase/supabase-js';

// Safe environment variable getter that works in Vite browser client, Node.js, and test runtimes
const getEnvVar = (key: string, fallback: string = ''): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {
    // ignore
  }
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch {
    // ignore
  }
  return fallback;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://ysvykofkwxjmrilqoutn.supabase.co');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'sb_publishable_tyUKFbd9g7a3j-QffHPDqg_nx27A2Y1');

// Service role key for administrative operations (Auth user creation and full RLS bypass on profiles)
const supabaseServiceRoleKey = 
  getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY') || 
  getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzdnlrb2Zrd3hqbXJpbHFvdXRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTYzNzI0NSwiZXhwIjoyMTA3MjEzMjQ1fQ.mvK3SfVTECpyoLLbkWaZ-6Gu0hEMlZ2zoA-NG53_AzM';

// Standard client for public/client operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Administrative client initialized with VITE_SUPABASE_SERVICE_ROLE_KEY
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

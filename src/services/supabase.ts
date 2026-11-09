import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
// Strip trailing /rest/v1 or trailing slashes to guarantee the root Supabase API base URL
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder')
);

// Optional service role key for administrative operations (if provided in environment)
const supabaseServiceRoleKey = 
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  supabaseAnonKey || 
  'placeholder-service-key';

// Safe client initialization ensuring no unhandled constructor errors
const safeUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-anon-key';

// Standard client for public/client operations
export const supabase = createClient(safeUrl, safeKey);

// Administrative client initialized with service role key (or anon key fallback)
export const supabaseAdmin = createClient(safeUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

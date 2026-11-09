import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
// Strip trailing /rest/v1 or trailing slashes to guarantee the root Supabase API base URL
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Optional service role key for administrative operations (if provided in environment)
const supabaseServiceRoleKey = 
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  supabaseAnonKey;

// Standard client for public/client operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Administrative client initialized with service role key (or anon key fallback)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

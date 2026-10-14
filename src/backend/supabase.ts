import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ysvykofkwxjmrilqoutn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_tyUKFbd9g7a3j-QffHPDqg_nx27A2Y1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

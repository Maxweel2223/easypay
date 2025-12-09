import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rpaylntkijyehmssvmrw.supabase.co';
const supabaseAnonKey = 'sb_publishable__2n_PtLMf0Qmn9H9e3tfRg_7D77FLve';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
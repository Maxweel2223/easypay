import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rpaylntkijyehmssvmrw.supabase.co';
const supabaseAnonKey = 'sb_publishable__2n_PtLMf0Qmn9H9e3tfRg_7D77FLve';

// Safe storage adapter to handle SecurityError in restricted iframes/browsers
const safeStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Ignore storage errors
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore storage errors
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
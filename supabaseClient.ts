import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rpaylntkijyehmssvmrw.supabase.co';
const supabaseAnonKey = 'sb_publishable__2n_PtLMf0Qmn9H9e3tfRg_7D77FLve';

// Safe storage adapter to handle SecurityError in restricted iframes/browsers
// Accessing window.localStorage can throw SecurityError if cookies are disabled or in sandboxed iframes
const safeStorage = {
  getItem: (key: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      // Ignore storage errors
    }
  },
  removeItem: (key: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
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
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhsrqhrlhgimypkfwmuq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpoc3JxaHJsaGdpbXlwa2Z3bXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTE3NzAsImV4cCI6MjA4MDQyNzc3MH0.FINYsnLB8nM1PiehkR5hXeNmlvLImS6aHzV0QDwWpvI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
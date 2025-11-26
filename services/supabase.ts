
import { createClient } from '@supabase/supabase-js';

// Configuration constants
// NOTE: In a real production build, these should be in a .env file.
const SUPABASE_URL = 'https://oinlofcjvpeejflnnipq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbmxvZmNqdnBlZWpmbG5uaXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjI2MTYsImV4cCI6MjA3OTczODYxNn0.LlmdC7-r6vwnCSGza_bvzVSjijo8WRKL83F08FQC550';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

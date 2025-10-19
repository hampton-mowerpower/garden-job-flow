export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const HAS_ENV = !!SUPABASE_URL && !!SUPABASE_ANON;

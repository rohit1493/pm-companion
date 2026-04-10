import { createClient } from '@supabase/supabase-js'

/*
  Run this SQL in your Supabase SQL editor to create the table:

  create table user_profiles (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now(),
    experience_level text,
    primary_goal text,
    topics text[],
    session_id text
  );
*/

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

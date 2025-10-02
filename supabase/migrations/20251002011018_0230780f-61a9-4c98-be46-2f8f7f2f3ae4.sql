-- Create table for bandroom visit tracking
CREATE TABLE public.bandroom_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  room_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bandroom_visits ENABLE ROW LEVEL SECURITY;

-- Everyone can view bandroom visits
CREATE POLICY "Anyone can view bandroom visits"
ON public.bandroom_visits
FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own visits
CREATE POLICY "Users can insert their own visits"
ON public.bandroom_visits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add profile fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS skill_level INTEGER CHECK (skill_level >= 1 AND skill_level <= 5),
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS bragging_links JSONB DEFAULT '[]'::jsonb;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bandroom_visits_visited_at ON public.bandroom_visits(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_bandroom_visits_room_id ON public.bandroom_visits(room_id);
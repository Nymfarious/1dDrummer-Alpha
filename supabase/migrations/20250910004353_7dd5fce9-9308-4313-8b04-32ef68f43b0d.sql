-- Fix security vulnerability: Remove public read access to profiles table
-- Replace the overly permissive policy with user-specific access control

-- Drop the existing public read policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a new policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Optional: Add policy to allow viewing profiles by username for specific use cases
-- (Only enable this if your app needs users to find each other by username)
-- CREATE POLICY "Profiles can be viewed by username lookup" 
-- ON public.profiles 
-- FOR SELECT 
-- USING (username IS NOT NULL);
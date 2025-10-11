-- Fix device_sessions schema to match code expectations
-- Step 1: Add missing columns to device_sessions
ALTER TABLE public.device_sessions 
  DROP COLUMN IF EXISTS device_info,
  ADD COLUMN IF NOT EXISTS browser_info text,
  ADD COLUMN IF NOT EXISTS device_name text,
  ADD COLUMN IF NOT EXISTS device_type text;

-- Step 2: Add missing RLS policies for device_sessions
-- Allow users to insert their own device sessions
CREATE POLICY "Users can register their own devices"
  ON public.device_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own device sessions
CREATE POLICY "Users can update their own device sessions"
  ON public.device_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own device sessions (revoke devices)
CREATE POLICY "Users can delete their own device sessions"
  ON public.device_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 3: Fix app_settings to require authentication
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;

CREATE POLICY "Authenticated users can read app settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (true);
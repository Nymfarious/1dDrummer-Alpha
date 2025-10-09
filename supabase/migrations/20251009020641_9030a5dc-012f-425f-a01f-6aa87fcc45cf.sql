-- Create a table to store app-wide settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings
  FOR SELECT
  USING (true);

-- Only allow service role to update settings (via edge functions or admin panel)
CREATE POLICY "Service role can manage app settings"
  ON public.app_settings
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Insert the signup blocking setting (default to enabled/blocked)
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES ('signups_blocked', '{"blocked": true}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Update the block_new_signups function to check the setting
CREATE OR REPLACE FUNCTION public.block_new_signups()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signups_blocked boolean;
BEGIN
  -- Check if signups are blocked
  SELECT (setting_value->>'blocked')::boolean
  INTO signups_blocked
  FROM public.app_settings
  WHERE setting_key = 'signups_blocked';
  
  -- If signups are blocked, prevent the insert
  IF signups_blocked THEN
    RAISE EXCEPTION 'New account registration is currently closed. Please contact the administrator for access.'
      USING HINT = 'signup_disabled';
  END IF;
  
  RETURN NEW;
END;
$$;
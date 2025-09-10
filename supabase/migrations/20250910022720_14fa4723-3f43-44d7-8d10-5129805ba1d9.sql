-- Fix user_settings unique constraint issue
ALTER TABLE public.user_settings
DROP CONSTRAINT IF EXISTS user_settings_user_id_key;

-- Add proper unique constraint
ALTER TABLE public.user_settings
ADD CONSTRAINT user_settings_user_id_unique UNIQUE (user_id);

-- Create function to handle user_settings creation conflicts
CREATE OR REPLACE FUNCTION public.create_user_settings_safe()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
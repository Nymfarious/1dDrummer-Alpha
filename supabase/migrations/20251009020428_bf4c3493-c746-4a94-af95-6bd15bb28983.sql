-- Create a function to block new signups
CREATE OR REPLACE FUNCTION public.block_new_signups()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if signups are allowed (you can change this flag later)
  -- For now, we'll block all new signups
  RAISE EXCEPTION 'New account registration is currently closed. Please contact the administrator for access.'
    USING HINT = 'signup_disabled';
  RETURN NULL;
END;
$$;

-- Create trigger on auth.users to block new signups
-- This trigger fires before any new user is inserted
DROP TRIGGER IF EXISTS prevent_new_signups ON auth.users;
CREATE TRIGGER prevent_new_signups
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.block_new_signups();
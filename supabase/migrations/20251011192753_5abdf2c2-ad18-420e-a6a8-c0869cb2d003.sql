-- Remove insecure Google Drive token storage from profiles
-- This will be replaced with proper OAuth flow later
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS google_drive_token;
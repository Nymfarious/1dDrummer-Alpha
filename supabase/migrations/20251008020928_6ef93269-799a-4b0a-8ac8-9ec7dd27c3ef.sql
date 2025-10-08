-- Add max_library_files setting to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS max_library_files integer DEFAULT 10 CHECK (max_library_files IN (3, 5, 10));
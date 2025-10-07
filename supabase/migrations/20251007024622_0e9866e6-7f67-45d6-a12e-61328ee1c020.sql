-- Add new profile fields for enhanced user profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS avatar_ring_color text DEFAULT 'blue',
ADD COLUMN IF NOT EXISTS avatar_position jsonb DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,
ADD COLUMN IF NOT EXISTS group_skill_level integer,
ADD COLUMN IF NOT EXISTS solo_skill_level integer,
ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{"new_users": true, "direct_messages": true, "emails": true}'::jsonb,
ADD COLUMN IF NOT EXISTS default_metronome_sound text DEFAULT 'standard';

-- Update skill_level to be group_skill_level if it exists
UPDATE public.profiles
SET group_skill_level = skill_level
WHERE skill_level IS NOT NULL AND group_skill_level IS NULL;

-- Add constraint for avatar ring color
ALTER TABLE public.profiles
ADD CONSTRAINT avatar_ring_color_check 
CHECK (avatar_ring_color IN ('blue', 'green', 'red'));

-- Add constraints for skill levels (1-5 range)
ALTER TABLE public.profiles
ADD CONSTRAINT group_skill_level_check 
CHECK (group_skill_level >= 1 AND group_skill_level <= 5);

ALTER TABLE public.profiles
ADD CONSTRAINT solo_skill_level_check 
CHECK (solo_skill_level >= 1 AND solo_skill_level <= 5);
-- Create avatar_collection table to store user's saved avatars
CREATE TABLE public.avatar_collection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  avatar_url TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('upload', 'ai_generated', 'preset')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_current BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.avatar_collection ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own avatar collection"
ON public.avatar_collection FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own avatar collection"
ON public.avatar_collection FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatar collection"
ON public.avatar_collection FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own avatar collection"
ON public.avatar_collection FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_avatar_collection_user_id ON public.avatar_collection(user_id);
CREATE INDEX idx_avatar_collection_created_at ON public.avatar_collection(created_at DESC);
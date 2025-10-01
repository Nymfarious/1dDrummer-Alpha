-- Create table to track AI trial access
CREATE TABLE public.user_ai_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  total_requests INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_ai_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI access info
CREATE POLICY "Users can view their own AI access"
  ON public.user_ai_access
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can manage AI access (for edge functions)
CREATE POLICY "Service role can manage AI access"
  ON public.user_ai_access
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE TRIGGER update_user_ai_access_updated_at
  BEFORE UPDATE ON public.user_ai_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create AI access on profile creation
CREATE OR REPLACE FUNCTION public.create_user_ai_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_ai_access (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create AI access when profile is created
CREATE TRIGGER on_profile_created_ai_access
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_ai_access();
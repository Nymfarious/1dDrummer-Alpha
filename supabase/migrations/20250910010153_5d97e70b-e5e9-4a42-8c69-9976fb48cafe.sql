-- Create user_security_settings table for 2FA and security preferences
CREATE TABLE public.user_security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret TEXT,
  backup_codes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_security_settings
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_security_settings
CREATE POLICY "Users can view their own security settings" 
ON public.user_security_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security settings" 
ON public.user_security_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings" 
ON public.user_security_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create device_sessions table for device tracking
CREATE TABLE public.device_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  browser_info TEXT,
  ip_address INET,
  location_info JSONB,
  is_trusted BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '90 days')
);

-- Enable RLS on device_sessions
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for device_sessions
CREATE POLICY "Users can view their own device sessions" 
ON public.device_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device sessions" 
ON public.device_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device sessions" 
ON public.device_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device sessions" 
ON public.device_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create account_lockouts table for tracking failed attempts
CREATE TABLE public.account_lockouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT,
  ip_address INET,
  failed_attempts INTEGER NOT NULL DEFAULT 1,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on account_lockouts (admin access only)
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_device_sessions_user_id ON public.device_sessions(user_id);
CREATE INDEX idx_device_sessions_fingerprint ON public.device_sessions(device_fingerprint);
CREATE INDEX idx_account_lockouts_email ON public.account_lockouts(email);
CREATE INDEX idx_account_lockouts_ip ON public.account_lockouts(ip_address);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_user_security_settings_updated_at
BEFORE UPDATE ON public.user_security_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_account_lockouts_updated_at
BEFORE UPDATE ON public.account_lockouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.device_sessions 
  WHERE expires_at < now();
  
  DELETE FROM public.account_lockouts 
  WHERE locked_until IS NOT NULL AND locked_until < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
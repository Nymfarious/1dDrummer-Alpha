-- Enable Row Level Security on account_lockouts table
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

-- Create policy to completely restrict access to regular users
-- Only service role and authenticated admin functions should access this data
CREATE POLICY "Restrict account lockout data access"
ON public.account_lockouts
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Allow service role to manage account lockouts for security functions
CREATE POLICY "Service role can manage account lockouts"
ON public.account_lockouts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
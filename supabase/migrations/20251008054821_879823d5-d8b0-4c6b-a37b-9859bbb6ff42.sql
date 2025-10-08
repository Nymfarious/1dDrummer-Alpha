-- Fix account_lockouts table security issue
-- Add RLS policy to restrict SELECT access to only the user's own lockout data

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Service role can manage account lockouts" ON public.account_lockouts;

-- Create a policy for users to view only their own lockout data
CREATE POLICY "Users can view their own account lockouts"
ON public.account_lockouts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create a policy for service role to manage all lockouts
CREATE POLICY "Service role can manage all account lockouts"
ON public.account_lockouts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create a policy to allow inserting lockout records (needed for the account lockout system)
CREATE POLICY "System can insert account lockouts"
ON public.account_lockouts
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Create a policy to allow updating lockout records for the account lockout system
CREATE POLICY "System can update account lockouts"
ON public.account_lockouts
FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);
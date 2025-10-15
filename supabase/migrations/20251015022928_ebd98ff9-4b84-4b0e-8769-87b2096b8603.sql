-- Fix security issue: Prevent email enumeration through account_lockouts table
-- Drop the insecure policy that allows viewing lockouts by email
DROP POLICY IF EXISTS "Users can view their lockouts" ON public.account_lockouts;

-- Create a secure policy that only allows users to view their own lockout records by user_id
CREATE POLICY "Users can view their own lockouts only"
ON public.account_lockouts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add comment explaining the security measure
COMMENT ON POLICY "Users can view their own lockouts only" ON public.account_lockouts IS 
'Restricts SELECT to only the authenticated user''s own records to prevent email enumeration attacks';
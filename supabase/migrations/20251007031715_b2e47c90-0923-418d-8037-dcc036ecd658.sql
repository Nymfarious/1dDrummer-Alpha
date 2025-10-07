-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view bandroom visits" ON public.bandroom_visits;

-- Create a new policy that only allows authenticated users to view bandroom visits
CREATE POLICY "Authenticated users can view bandroom visits" 
ON public.bandroom_visits 
FOR SELECT 
TO authenticated
USING (true);
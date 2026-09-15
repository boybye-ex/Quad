-- Allow anonymous users to read campuses
-- This is required for the sign-up flow where users need to select their campus
-- before they have authenticated.

-- Drop the existing authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can read campuses" ON campuses;

-- Create a new policy that allows anyone (including anonymous users) to read campuses
CREATE POLICY "Anyone can read campuses"
  ON campuses FOR SELECT
  TO public
  USING (true);

COMMENT ON POLICY "Anyone can read campuses" ON campuses IS 
  'Public read access for campuses - required for sign-up flow where users select their campus before authentication.';

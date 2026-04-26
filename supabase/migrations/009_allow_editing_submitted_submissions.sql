-- Update RLS policy to allow builders to update their own submissions
-- This allows editing after submission, not just when pending

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Builders can update own submissions" ON submissions;

-- Create new policy that allows updating own submissions regardless of status
CREATE POLICY "Builders can update own submissions"
  ON submissions FOR UPDATE
  USING (user_id = auth.uid());

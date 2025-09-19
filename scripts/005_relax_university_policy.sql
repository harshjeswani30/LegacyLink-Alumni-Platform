-- Allow authenticated users to create a university (prototype/demo)
-- Existing policy only lets super_admin manage universities; this adds an INSERT policy.

-- Remove existing conflicting INSERT policies if any (safe no-op if none)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'universities' AND policyname = 'Users can create universities'
  ) THEN
    EXECUTE 'DROP POLICY "Users can create universities" ON public.universities;';
  END IF;
END $$;

CREATE POLICY "Users can create universities"
ON universities
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');



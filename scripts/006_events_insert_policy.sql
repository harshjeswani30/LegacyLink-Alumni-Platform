-- Allow university admins to INSERT events for their own university

-- Drop existing generic policy if it conflicts (safe if not present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'University admins can insert events'
  ) THEN
    EXECUTE 'DROP POLICY "University admins can insert events" ON public.events;';
  END IF;
END $$;

CREATE POLICY "University admins can insert events"
ON events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'university_admin'
      AND profiles.university_id = events.university_id
  )
);



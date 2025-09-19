-- Demo seed for Chandigarh University workflow

-- Ensure Chandigarh University exists and capture id
WITH upsert_uni AS (
  INSERT INTO universities (name, domain, approved)
  VALUES ('Chandigarh University', 'cuchd.in', true)
  ON CONFLICT (domain) DO UPDATE SET name = EXCLUDED.name, approved = true
  RETURNING id
)
SELECT * FROM upsert_uni;

-- Create sample alumni profiles (requires existing users in auth.users)
-- Replace the emails below with real signed-up users to link profiles.
-- Example placeholders (no-op if profiles/emails don’t exist):
-- UPDATE profiles SET role='alumni', university_id=(SELECT id FROM universities WHERE domain='cuchd.in'), verified=true WHERE email IN ('alumni1@cuchd.in','alumni2@cuchd.in');

-- Create a couple of events for CU (admin will be able to manage)
INSERT INTO events (university_id, title, description, event_date, location, max_attendees)
SELECT id, 'Alumni Networking Night', 'Connect with fellow alumni and students', NOW() + INTERVAL '7 days', 'Main Auditorium', 100
FROM universities WHERE domain='cuchd.in'
ON CONFLICT DO NOTHING;

INSERT INTO events (university_id, title, description, event_date, location, max_attendees)
SELECT id, 'Career Mentorship Workshop', 'Meet mentors across industries', NOW() + INTERVAL '14 days', 'Seminar Hall 2', 80
FROM universities WHERE domain='cuchd.in'
ON CONFLICT DO NOTHING;

-- Seed badges catalog by issuing a few badges to self if desired (optional demo)
-- UPDATE badges SET ...



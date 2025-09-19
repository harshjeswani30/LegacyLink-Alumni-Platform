-- Demo users and data for verification workflow and features
-- IMPORTANT: Replace the sample emails below with real signed-up users in auth.users

-- Variables (change these emails to the ones you actually signed up with Supabase Auth)
-- Example:
--   \set alumni_email 'alumni1@cuchd.in'
--   \set student_email 'student1@cuchd.in'

-- If your SQL console supports variables, uncomment the two lines above and set values.
-- Otherwise, edit the emails directly in the queries below.

-- Insert profile rows for existing auth users (no-op if users not found or profile exists)
INSERT INTO profiles (id, email, full_name, role, university_id, verified)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email,'@',1)), 'alumni', (SELECT id FROM universities WHERE domain='cuchd.in'), false
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'alumni1@cuchd.in' AND p.id IS NULL;

INSERT INTO profiles (id, email, full_name, role, university_id, verified)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email,'@',1)), 'student', (SELECT id FROM universities WHERE domain='cuchd.in'), false
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'student1@cuchd.in' AND p.id IS NULL;

-- Alumni extended profile (alumni_profiles) if the alumni profile exists
INSERT INTO alumni_profiles (user_id, skills, current_job, current_company, bio, graduation_year, degree, available_for_mentoring)
SELECT p.id,
       ARRAY['javascript','react','node.js'],
       'Software Engineer',
       'TechCorp, Chandigarh',
       'Passionate about mentoring and web development.',
       EXTRACT(YEAR FROM NOW())::int - 5,
       'B.Tech CSE',
       true
FROM profiles p
WHERE p.email = 'alumni1@cuchd.in'
ON CONFLICT (user_id) DO NOTHING;

-- Create a pending mentorship request (student -> alumni)
INSERT INTO mentorships (mentor_id, mentee_id, status, message)
SELECT mentor.id, mentee.id, 'pending', 'I would love guidance on web development career paths.'
FROM profiles mentor, profiles mentee
WHERE mentor.email = 'alumni1@cuchd.in' AND mentee.email = 'student1@cuchd.in'
ON CONFLICT DO NOTHING;

-- Register student to an upcoming event (if exists)
INSERT INTO event_registrations (event_id, user_id)
SELECT e.id, s.id
FROM events e
JOIN profiles s ON s.email = 'student1@cuchd.in'
WHERE e.university_id = (SELECT id FROM universities WHERE domain='cuchd.in')
ORDER BY e.event_date ASC
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add a demo badge to the alumni (unverified yet, just for UI)
INSERT INTO badges (user_id, title, description, points, badge_type)
SELECT p.id, 'Community Contributor', 'Helped organize an alumni meetup', 50, 'community'
FROM profiles p
WHERE p.email = 'alumni1@cuchd.in'
ON CONFLICT DO NOTHING;



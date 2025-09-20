-- Add Realistic Chandigarh University Alumni Data
-- This will make the platform look authentic and well-populated

-- First, let's get the Chandigarh University ID
DO $$
DECLARE
    chu_id UUID;
BEGIN
    -- Get Chandigarh University ID
    SELECT id INTO chu_id FROM universities WHERE name = 'Chandigarh University';
    
    -- Insert realistic alumni profiles
    INSERT INTO profiles (id, email, full_name, role, university_id, verified, created_at) VALUES
    
    -- Computer Science & Engineering Alumni
    (gen_random_uuid(), 'arjun.sharma@gmail.com', 'Arjun Sharma', 'alumni', chu_id, true, NOW() - INTERVAL '2 years'),
    (gen_random_uuid(), 'priya.gupta@microsoft.com', 'Priya Gupta', 'alumni', chu_id, true, NOW() - INTERVAL '18 months'),
    (gen_random_uuid(), 'rohit.verma@google.com', 'Rohit Verma', 'alumni', chu_id, true, NOW() - INTERVAL '3 years'),
    (gen_random_uuid(), 'sneha.patel@amazon.com', 'Sneha Patel', 'alumni', chu_id, true, NOW() - INTERVAL '1 year'),
    (gen_random_uuid(), 'vikash.singh@tcs.com', 'Vikash Singh', 'alumni', chu_id, true, NOW() - INTERVAL '4 years'),
    
    -- Business & Management Alumni
    (gen_random_uuid(), 'ananya.joshi@deloitte.com', 'Ananya Joshi', 'alumni', chu_id, true, NOW() - INTERVAL '2.5 years'),
    (gen_random_uuid(), 'karan.malhotra@pwc.com', 'Karan Malhotra', 'alumni', chu_id, true, NOW() - INTERVAL '3 months'),
    (gen_random_uuid(), 'divya.mehta@kpmg.com', 'Divya Mehta', 'alumni', chu_id, true, NOW() - INTERVAL '1.5 years'),
    
    -- Engineering Alumni
    (gen_random_uuid(), 'rajesh.kumar@infosys.com', 'Rajesh Kumar', 'alumni', chu_id, true, NOW() - INTERVAL '5 years'),
    (gen_random_uuid(), 'pooja.agarwal@wipro.com', 'Pooja Agarwal', 'alumni', chu_id, true, NOW() - INTERVAL '2 years'),
    (gen_random_uuid(), 'amit.pandey@cognizant.com', 'Amit Pandey', 'alumni', chu_id, true, NOW() - INTERVAL '6 months'),
    
    -- Design & Arts Alumni
    (gen_random_uuid(), 'ritu.chawla@adobe.com', 'Ritu Chawla', 'alumni', chu_id, true, NOW() - INTERVAL '1 year'),
    (gen_random_uuid(), 'manish.goyal@flipkart.com', 'Manish Goyal', 'alumni', chu_id, true, NOW() - INTERVAL '8 months'),
    
    -- Startup Founders & Entrepreneurs
    (gen_random_uuid(), 'neeraj.bansal@startup.in', 'Neeraj Bansal', 'alumni', chu_id, true, NOW() - INTERVAL '3 years'),
    (gen_random_uuid(), 'kavya.reddy@techcorp.co', 'Kavya Reddy', 'alumni', chu_id, true, NOW() - INTERVAL '2 years'),
    
    -- Recent Graduates
    (gen_random_uuid(), 'abhishek.yadav@gmail.com', 'Abhishek Yadav', 'alumni', chu_id, true, NOW() - INTERVAL '2 months'),
    (gen_random_uuid(), 'shreya.kapoor@yahoo.com', 'Shreya Kapoor', 'alumni', chu_id, true, NOW() - INTERVAL '4 months'),
    (gen_random_uuid(), 'deepak.jain@outlook.com', 'Deepak Jain', 'alumni', chu_id, true, NOW() - INTERVAL '1 month'),
    
    -- International Alumni
    (gen_random_uuid(), 'simran.kaur@apple.com', 'Simran Kaur', 'alumni', chu_id, true, NOW() - INTERVAL '4 years'),
    (gen_random_uuid(), 'rahul.saxena@tesla.com', 'Rahul Saxena', 'alumni', chu_id, true, NOW() - INTERVAL '3 years');

END $$;

-- Now add detailed alumni profiles with career information
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    -- Add alumni_profiles for some of the newly created profiles
    FOR profile_record IN 
        SELECT id, full_name, email FROM profiles 
        WHERE university_id = (SELECT id FROM universities WHERE name = 'Chandigarh University')
        AND role = 'alumni'
        AND full_name NOT IN ('prateek', 's', 'Harsh Kumar', 'Akanksha Khurana')  -- Skip existing ones
        LIMIT 15
    LOOP
        INSERT INTO alumni_profiles (
            user_id, 
            skills, 
            current_job, 
            current_company, 
            achievements, 
            graduation_year, 
            degree, 
            bio, 
            available_for_mentoring
        ) VALUES (
            profile_record.id,
            -- Skills based on name patterns
            CASE 
                WHEN profile_record.full_name LIKE '%Arjun%' OR profile_record.full_name LIKE '%Rohit%' THEN 
                    ARRAY['Python', 'JavaScript', 'React', 'Node.js', 'AWS', 'Docker']
                WHEN profile_record.full_name LIKE '%Priya%' OR profile_record.full_name LIKE '%Sneha%' THEN 
                    ARRAY['Java', 'Spring Boot', 'Microservices', 'Kubernetes', 'Azure', 'MongoDB']
                WHEN profile_record.full_name LIKE '%Ananya%' OR profile_record.full_name LIKE '%Karan%' THEN 
                    ARRAY['Business Analysis', 'Project Management', 'Data Analytics', 'SQL', 'Tableau']
                WHEN profile_record.full_name LIKE '%Rajesh%' OR profile_record.full_name LIKE '%Amit%' THEN 
                    ARRAY['C++', 'System Design', 'Linux', 'DevOps', 'Jenkins', 'Git']
                WHEN profile_record.full_name LIKE '%Ritu%' OR profile_record.full_name LIKE '%Manish%' THEN 
                    ARRAY['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping']
                ELSE 
                    ARRAY['Leadership', 'Communication', 'Team Management', 'Strategic Planning']
            END,
            -- Job titles
            CASE 
                WHEN profile_record.email LIKE '%microsoft%' THEN 'Senior Software Engineer'
                WHEN profile_record.email LIKE '%google%' THEN 'Staff Software Engineer'
                WHEN profile_record.email LIKE '%amazon%' THEN 'Software Development Engineer II'
                WHEN profile_record.email LIKE '%deloitte%' OR profile_record.email LIKE '%pwc%' THEN 'Senior Consultant'
                WHEN profile_record.email LIKE '%adobe%' THEN 'Senior UX Designer'
                WHEN profile_record.email LIKE '%startup%' OR profile_record.email LIKE '%techcorp%' THEN 'Founder & CEO'
                WHEN profile_record.email LIKE '%apple%' THEN 'iOS Developer'
                WHEN profile_record.email LIKE '%tesla%' THEN 'Software Engineer'
                ELSE 'Software Engineer'
            END,
            -- Company names
            CASE 
                WHEN profile_record.email LIKE '%@microsoft%' THEN 'Microsoft'
                WHEN profile_record.email LIKE '%@google%' THEN 'Google'
                WHEN profile_record.email LIKE '%@amazon%' THEN 'Amazon'
                WHEN profile_record.email LIKE '%@tcs%' THEN 'Tata Consultancy Services'
                WHEN profile_record.email LIKE '%@infosys%' THEN 'Infosys'
                WHEN profile_record.email LIKE '%@deloitte%' THEN 'Deloitte'
                WHEN profile_record.email LIKE '%@pwc%' THEN 'PricewaterhouseCoopers'
                WHEN profile_record.email LIKE '%@adobe%' THEN 'Adobe Systems'
                WHEN profile_record.email LIKE '%@flipkart%' THEN 'Flipkart'
                WHEN profile_record.email LIKE '%@apple%' THEN 'Apple Inc.'
                WHEN profile_record.email LIKE '%@tesla%' THEN 'Tesla Inc.'
                WHEN profile_record.email LIKE '%startup%' THEN 'TechVenture Solutions'
                WHEN profile_record.email LIKE '%techcorp%' THEN 'InnovateX Technologies'
                ELSE 'Tech Innovations Pvt Ltd'
            END,
            -- Achievements
            CASE 
                WHEN profile_record.email LIKE '%google%' OR profile_record.email LIKE '%microsoft%' THEN 
                    'Led development of scalable microservices handling 10M+ requests daily. Winner of Hack4Good 2023.'
                WHEN profile_record.email LIKE '%startup%' OR profile_record.email LIKE '%techcorp%' THEN 
                    'Founded successful startup with $2M seed funding. Featured in Forbes 30 Under 30.'
                WHEN profile_record.email LIKE '%deloitte%' OR profile_record.email LIKE '%pwc%' THEN 
                    'Delivered digital transformation projects worth $5M+. Certified Project Management Professional.'
                ELSE 
                    'Consistently high performer with multiple client appreciations. Active contributor to open source projects.'
            END,
            -- Graduation year (2018-2023)
            2018 + (ABS(HASHTEXT(profile_record.full_name)) % 6),
            -- Degree
            CASE 
                WHEN profile_record.full_name LIKE '%Arjun%' OR profile_record.full_name LIKE '%Rohit%' OR profile_record.full_name LIKE '%Priya%' THEN 
                    'B.Tech Computer Science Engineering'
                WHEN profile_record.full_name LIKE '%Ananya%' OR profile_record.full_name LIKE '%Karan%' THEN 
                    'MBA - Business Administration'
                WHEN profile_record.full_name LIKE '%Ritu%' OR profile_record.full_name LIKE '%Manish%' THEN 
                    'B.Des - User Experience Design'
                ELSE 
                    'B.Tech Electronics & Communication Engineering'
            END,
            -- Bio
            'Passionate about technology and innovation. Alumni of Chandigarh University with experience in leading tech companies. Always eager to connect with fellow alumni and current students.',
            -- Available for mentoring (random true/false)
            (ABS(HASHTEXT(profile_record.email)) % 2) = 0
        );
    END LOOP;
END $$;

-- Add some current students as well
INSERT INTO profiles (id, email, full_name, role, university_id, verified, created_at) VALUES
(gen_random_uuid(), '24bcs11001@cuchd.in', 'Aarav Gupta', 'student', (SELECT id FROM universities WHERE name = 'Chandigarh University'), true, NOW() - INTERVAL '3 months'),
(gen_random_uuid(), '24bcs11002@cuchd.in', 'Diya Sharma', 'student', (SELECT id FROM universities WHERE name = 'Chandigarh University'), true, NOW() - INTERVAL '2 months'),
(gen_random_uuid(), '24bcs11003@cuchd.in', 'Aryan Patel', 'student', (SELECT id FROM universities WHERE name = 'Chandigarh University'), true, NOW() - INTERVAL '1 month'),
(gen_random_uuid(), '24bcs11004@cuchd.in', 'Kavya Singh', 'student', (SELECT id FROM universities WHERE name = 'Chandigarh University'), true, NOW() - INTERVAL '2 weeks'),
(gen_random_uuid(), '24bcs11005@cuchd.in', 'Ishaan Kumar', 'student', (SELECT id FROM universities WHERE name = 'Chandigarh University'), true, NOW() - INTERVAL '1 week');

-- Final verification
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'alumni' THEN 1 END) as alumni_count,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count,
    COUNT(CASE WHEN role = 'university_admin' THEN 1 END) as admin_count
FROM profiles 
WHERE university_id = (SELECT id FROM universities WHERE name = 'Chandigarh University');

-- Show some sample alumni data
SELECT 
    p.full_name,
    p.email,
    ap.current_job,
    ap.current_company,
    ap.graduation_year,
    ap.available_for_mentoring
FROM profiles p
LEFT JOIN alumni_profiles ap ON ap.user_id = p.id
WHERE p.university_id = (SELECT id FROM universities WHERE name = 'Chandigarh University')
AND p.role = 'alumni'
ORDER BY p.created_at DESC
LIMIT 10;
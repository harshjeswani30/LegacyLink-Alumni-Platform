-- FIXED: Add Realistic Chandigarh University Alumni Data
-- This properly creates auth users first, then their profiles

-- First, create auth users for our realistic alumni
-- Note: In production, users would sign up normally, but for demo data we'll simulate this

DO $$
DECLARE
    chu_id UUID;
    new_user_id UUID;
    alumni_emails TEXT[] := ARRAY[
        'arjun.sharma@gmail.com',
        'priya.gupta@microsoft.com', 
        'rohit.verma@google.com',
        'sneha.patel@amazon.com',
        'vikash.singh@tcs.com',
        'ananya.joshi@deloitte.com',
        'karan.malhotra@pwc.com',
        'divya.mehta@kpmg.com',
        'rajesh.kumar@infosys.com',
        'pooja.agarwal@wipro.com',
        'amit.pandey@cognizant.com',
        'ritu.chawla@adobe.com',
        'manish.goyal@flipkart.com',
        'neeraj.bansal@startup.in',
        'kavya.reddy@techcorp.co',
        'abhishek.yadav@gmail.com',
        'shreya.kapoor@yahoo.com',
        'deepak.jain@outlook.com',
        'simran.kaur@apple.com',
        'rahul.saxena@tesla.com'
    ];
    alumni_names TEXT[] := ARRAY[
        'Arjun Sharma',
        'Priya Gupta',
        'Rohit Verma', 
        'Sneha Patel',
        'Vikash Singh',
        'Ananya Joshi',
        'Karan Malhotra',
        'Divya Mehta',
        'Rajesh Kumar',
        'Pooja Agarwal',
        'Amit Pandey',
        'Ritu Chawla',
        'Manish Goyal',
        'Neeraj Bansal',
        'Kavya Reddy',
        'Abhishek Yadav',
        'Shreya Kapoor',
        'Deepak Jain',
        'Simran Kaur',
        'Rahul Saxena'
    ];
    student_emails TEXT[] := ARRAY[
        '24bcs11001@cuchd.in',
        '24bcs11002@cuchd.in', 
        '24bcs11003@cuchd.in',
        '24bcs11004@cuchd.in',
        '24bcs11005@cuchd.in'
    ];
    student_names TEXT[] := ARRAY[
        'Aarav Gupta',
        'Diya Sharma',
        'Aryan Patel',
        'Kavya Singh', 
        'Ishaan Kumar'
    ];
    i INTEGER;
BEGIN
    -- Get Chandigarh University ID
    SELECT id INTO chu_id FROM universities WHERE name = 'Chandigarh University';
    
    -- Create auth users and profiles for alumni
    FOR i IN 1..array_length(alumni_emails, 1) LOOP
        new_user_id := gen_random_uuid();
        
        -- Insert to auth.users (simulating signup)
        INSERT INTO auth.users (
            id,
            email,
            email_confirmed_at,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            alumni_emails[i],
            NOW() - INTERVAL '1 year' * (i * 0.2), -- Simulate different signup times
            jsonb_build_object(
                'full_name', alumni_names[i],
                'role', 'alumni',
                'university_id', chu_id::text
            ),
            NOW() - INTERVAL '1 year' * (i * 0.2),
            NOW() - INTERVAL '1 year' * (i * 0.2)
        );
        
        -- Insert corresponding profile
        INSERT INTO profiles (
            id,
            email,
            full_name,
            role,
            university_id,
            verified,
            created_at
        ) VALUES (
            new_user_id,
            alumni_emails[i],
            alumni_names[i],
            'alumni',
            chu_id,
            true,
            NOW() - INTERVAL '1 year' * (i * 0.2)
        );
    END LOOP;
    
    -- Create auth users and profiles for students
    FOR i IN 1..array_length(student_emails, 1) LOOP
        new_user_id := gen_random_uuid();
        
        -- Insert to auth.users
        INSERT INTO auth.users (
            id,
            email,
            email_confirmed_at,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            student_emails[i],
            NOW() - INTERVAL '1 month' * i,
            jsonb_build_object(
                'full_name', student_names[i],
                'role', 'student',
                'university_id', chu_id::text
            ),
            NOW() - INTERVAL '1 month' * i,
            NOW() - INTERVAL '1 month' * i
        );
        
        -- Insert corresponding profile
        INSERT INTO profiles (
            id,
            email,
            full_name,
            role,
            university_id,
            verified,
            created_at
        ) VALUES (
            new_user_id,
            student_emails[i],
            student_names[i],
            'student',
            chu_id,
            true,
            NOW() - INTERVAL '1 month' * i
        );
    END LOOP;
    
    RAISE NOTICE 'Created % alumni and % students', array_length(alumni_emails, 1), array_length(student_emails, 1);
END $$;

-- Now add detailed alumni profiles with career information
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    -- Add alumni_profiles for the newly created alumni
    FOR profile_record IN 
        SELECT id, full_name, email FROM profiles 
        WHERE university_id = (SELECT id FROM universities WHERE name = 'Chandigarh University')
        AND role = 'alumni'
        AND email IN (
            'arjun.sharma@gmail.com', 'priya.gupta@microsoft.com', 'rohit.verma@google.com',
            'sneha.patel@amazon.com', 'vikash.singh@tcs.com', 'ananya.joshi@deloitte.com',
            'karan.malhotra@pwc.com', 'divya.mehta@kpmg.com', 'rajesh.kumar@infosys.com',
            'pooja.agarwal@wipro.com', 'amit.pandey@cognizant.com', 'ritu.chawla@adobe.com',
            'manish.goyal@flipkart.com', 'neeraj.bansal@startup.in', 'kavya.reddy@techcorp.co'
        )
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
            -- Skills based on email domain
            CASE 
                WHEN profile_record.email LIKE '%microsoft%' OR profile_record.email LIKE '%google%' THEN 
                    ARRAY['Python', 'JavaScript', 'React', 'Node.js', 'AWS', 'Docker']
                WHEN profile_record.email LIKE '%amazon%' OR profile_record.email LIKE '%tcs%' THEN 
                    ARRAY['Java', 'Spring Boot', 'Microservices', 'Kubernetes', 'Azure', 'MongoDB']
                WHEN profile_record.email LIKE '%deloitte%' OR profile_record.email LIKE '%pwc%' THEN 
                    ARRAY['Business Analysis', 'Project Management', 'Data Analytics', 'SQL', 'Tableau']
                WHEN profile_record.email LIKE '%infosys%' OR profile_record.email LIKE '%cognizant%' THEN 
                    ARRAY['C++', 'System Design', 'Linux', 'DevOps', 'Jenkins', 'Git']
                WHEN profile_record.email LIKE '%adobe%' OR profile_record.email LIKE '%flipkart%' THEN 
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
                WHEN profile_record.email LIKE '%tcs%' THEN 'Technical Lead'
                WHEN profile_record.email LIKE '%infosys%' THEN 'Senior Systems Engineer'
                WHEN profile_record.email LIKE '%flipkart%' THEN 'Product Designer'
                ELSE 'Software Engineer'
            END,
            -- Company names
            CASE 
                WHEN profile_record.email LIKE '%microsoft%' THEN 'Microsoft'
                WHEN profile_record.email LIKE '%google%' THEN 'Google'
                WHEN profile_record.email LIKE '%amazon%' THEN 'Amazon'
                WHEN profile_record.email LIKE '%tcs%' THEN 'Tata Consultancy Services'
                WHEN profile_record.email LIKE '%infosys%' THEN 'Infosys'
                WHEN profile_record.email LIKE '%deloitte%' THEN 'Deloitte'
                WHEN profile_record.email LIKE '%pwc%' THEN 'PricewaterhouseCoopers'
                WHEN profile_record.email LIKE '%adobe%' THEN 'Adobe Systems'
                WHEN profile_record.email LIKE '%flipkart%' THEN 'Flipkart'
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
            2018 + (length(profile_record.full_name) % 6),
            -- Degree
            CASE 
                WHEN profile_record.email LIKE '%microsoft%' OR profile_record.email LIKE '%google%' OR profile_record.email LIKE '%amazon%' THEN 
                    'B.Tech Computer Science Engineering'
                WHEN profile_record.email LIKE '%deloitte%' OR profile_record.email LIKE '%pwc%' THEN 
                    'MBA - Business Administration'
                WHEN profile_record.email LIKE '%adobe%' OR profile_record.email LIKE '%flipkart%' THEN 
                    'B.Des - User Experience Design'
                ELSE 
                    'B.Tech Electronics & Communication Engineering'
            END,
            -- Bio
            'Passionate about technology and innovation. Alumni of Chandigarh University with experience in leading tech companies. Always eager to connect with fellow alumni and current students.',
            -- Available for mentoring (alternating pattern)
            (length(profile_record.email) % 2) = 0
        );
    END LOOP;
END $$;

-- Final verification
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'alumni' THEN 1 END) as alumni_count,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count,
    COUNT(CASE WHEN role = 'university_admin' THEN 1 END) as admin_count
FROM profiles 
WHERE university_id = (SELECT id FROM universities WHERE name = 'Chandigarh University');

-- Show sample alumni data with career details
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
AND p.email LIKE '%@%'
ORDER BY p.created_at DESC
LIMIT 10;
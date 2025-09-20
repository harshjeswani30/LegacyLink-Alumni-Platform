-- SAFE: Add Realistic Chandigarh University Alumni Data
-- This version checks for existing users to prevent duplicates

-- First, let's see what we already have
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'alumni' THEN 1 END) as current_alumni,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as current_students
FROM profiles 
WHERE university_id = (SELECT id FROM universities WHERE name = 'Chandigarh University');

-- Only add new alumni/students that don't already exist
DO $$
DECLARE
    chu_id UUID;
    new_user_id UUID;
    alumni_data RECORD;
    existing_email TEXT;
    alumni_list TEXT[][] := ARRAY[
        ['arjun.sharma@gmail.com', 'Arjun Sharma'],
        ['priya.gupta@microsoft.com', 'Priya Gupta'], 
        ['rohit.verma@google.com', 'Rohit Verma'],
        ['sneha.patel@amazon.com', 'Sneha Patel'],
        ['vikash.singh@tcs.com', 'Vikash Singh'],
        ['ananya.joshi@deloitte.com', 'Ananya Joshi'],
        ['karan.malhotra@pwc.com', 'Karan Malhotra'],
        ['divya.mehta@kpmg.com', 'Divya Mehta'],
        ['rajesh.kumar@infosys.com', 'Rajesh Kumar'],
        ['pooja.agarwal@wipro.com', 'Pooja Agarwal'],
        ['amit.pandey@cognizant.com', 'Amit Pandey'],
        ['ritu.chawla@adobe.com', 'Ritu Chawla'],
        ['manish.goyal@flipkart.com', 'Manish Goyal'],
        ['neeraj.bansal@startup.in', 'Neeraj Bansal'],
        ['kavya.reddy@techcorp.co', 'Kavya Reddy'],
        ['abhishek.yadav@gmail.com', 'Abhishek Yadav'],
        ['shreya.kapoor@yahoo.com', 'Shreya Kapoor'],
        ['deepak.jain@outlook.com', 'Deepak Jain'],
        ['simran.kaur@apple.com', 'Simran Kaur'],
        ['rahul.saxena@tesla.com', 'Rahul Saxena']
    ];
    student_list TEXT[][] := ARRAY[
        ['24bcs11001@cuchd.in', 'Aarav Gupta'],
        ['24bcs11002@cuchd.in', 'Diya Sharma'],
        ['24bcs11003@cuchd.in', 'Aryan Patel'],
        ['24bcs11004@cuchd.in', 'Kavya Singh'],
        ['24bcs11005@cuchd.in', 'Ishaan Kumar']
    ];
    i INTEGER;
    created_count INTEGER := 0;
BEGIN
    -- Get Chandigarh University ID
    SELECT id INTO chu_id FROM universities WHERE name = 'Chandigarh University';
    
    RAISE NOTICE 'Starting to add alumni data for Chandigarh University (ID: %)', chu_id;
    
    -- Add alumni that don't exist
    FOR i IN 1..array_length(alumni_list, 1) LOOP
        -- Check if this email already exists
        SELECT email INTO existing_email 
        FROM profiles 
        WHERE email = alumni_list[i][1] 
        LIMIT 1;
        
        IF existing_email IS NULL THEN
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
                alumni_list[i][1], -- email
                NOW() - INTERVAL '1 year' * (i * 0.2),
                jsonb_build_object(
                    'full_name', alumni_list[i][2], -- name
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
                alumni_list[i][1], -- email
                alumni_list[i][2], -- name
                'alumni',
                chu_id,
                true,
                NOW() - INTERVAL '1 year' * (i * 0.2)
            );
            
            created_count := created_count + 1;
            RAISE NOTICE 'Created alumni: % (%)', alumni_list[i][2], alumni_list[i][1];
        ELSE
            RAISE NOTICE 'Alumni already exists: % (%)', alumni_list[i][2], alumni_list[i][1];
        END IF;
    END LOOP;
    
    -- Add students that don't exist
    FOR i IN 1..array_length(student_list, 1) LOOP
        -- Check if this email already exists
        SELECT email INTO existing_email 
        FROM profiles 
        WHERE email = student_list[i][1] 
        LIMIT 1;
        
        IF existing_email IS NULL THEN
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
                student_list[i][1], -- email
                NOW() - INTERVAL '1 month' * i,
                jsonb_build_object(
                    'full_name', student_list[i][2], -- name
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
                student_list[i][1], -- email
                student_list[i][2], -- name
                'student',
                chu_id,
                true,
                NOW() - INTERVAL '1 month' * i
            );
            
            created_count := created_count + 1;
            RAISE NOTICE 'Created student: % (%)', student_list[i][2], student_list[i][1];
        ELSE
            RAISE NOTICE 'Student already exists: % (%)', student_list[i][2], student_list[i][1];
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total new profiles created: %', created_count;
END $$;

-- Add detailed alumni profiles (only for those that don't have them)
DO $$
DECLARE
    profile_record RECORD;
    profile_count INTEGER := 0;
BEGIN
    -- Add alumni_profiles for alumni who don't have detailed profiles yet
    FOR profile_record IN 
        SELECT p.id, p.full_name, p.email 
        FROM profiles p
        LEFT JOIN alumni_profiles ap ON ap.user_id = p.id
        WHERE p.university_id = (SELECT id FROM universities WHERE name = 'Chandigarh University')
        AND p.role = 'alumni'
        AND ap.user_id IS NULL  -- Only those without detailed profiles
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
        
        profile_count := profile_count + 1;
        RAISE NOTICE 'Added detailed profile for: %', profile_record.full_name;
    END LOOP;
    
    RAISE NOTICE 'Total detailed profiles added: %', profile_count;
END $$;

-- Final verification and results
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'alumni' THEN 1 END) as alumni_count,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count,
    COUNT(CASE WHEN role = 'university_admin' THEN 1 END) as admin_count
FROM profiles 
WHERE university_id = (SELECT id FROM universities WHERE name = 'Chandigarh University');

-- Show sample of the new alumni data
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
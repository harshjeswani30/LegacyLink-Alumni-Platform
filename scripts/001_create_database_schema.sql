-- LegacyLink Alumni Platform Database Schema
-- Multi-university alumni engagement platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Universities table
CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'university_admin', 'alumni', 'student')),
    university_id UUID REFERENCES universities(id),
    linkedin_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alumni profiles with extended information
CREATE TABLE IF NOT EXISTS alumni_profiles (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    skills TEXT[],
    current_job TEXT,
    current_company TEXT,
    achievements TEXT,
    photo_url TEXT,
    graduation_year INTEGER,
    degree TEXT,
    bio TEXT,
    available_for_mentoring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    max_attendees INTEGER,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event registrations
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Mentorships table
CREATE TABLE IF NOT EXISTS mentorships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    mentee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mentor_id, mentee_id)
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    payment_id TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges/Achievements table
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    badge_type TEXT NOT NULL CHECK (badge_type IN ('mentorship', 'donation', 'event', 'profile', 'community')),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Universities
CREATE POLICY "Universities are viewable by everyone" ON universities FOR SELECT USING (approved = true);
CREATE POLICY "Super admins can manage universities" ON universities FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'super_admin'
    )
);

-- RLS Policies for Profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "University admins can view profiles from their university" ON profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'university_admin' 
        AND p.university_id = profiles.university_id
    )
);

-- RLS Policies for Alumni Profiles
CREATE POLICY "Alumni can manage their own profile" ON alumni_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Alumni profiles are viewable by same university" ON alumni_profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p1, profiles p2 
        WHERE p1.id = auth.uid() 
        AND p2.id = alumni_profiles.user_id 
        AND p1.university_id = p2.university_id
    )
);

-- RLS Policies for Events
CREATE POLICY "Events are viewable by university members" ON events FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.university_id = events.university_id
    )
);
CREATE POLICY "University admins can manage events" ON events FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'university_admin' 
        AND profiles.university_id = events.university_id
    )
);

-- RLS Policies for Event Registrations
CREATE POLICY "Users can manage their own registrations" ON event_registrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Event creators can view registrations" ON event_registrations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM events 
        WHERE events.id = event_registrations.event_id 
        AND events.created_by = auth.uid()
    )
);

-- RLS Policies for Mentorships
CREATE POLICY "Users can view their own mentorships" ON mentorships FOR SELECT USING (
    auth.uid() = mentor_id OR auth.uid() = mentee_id
);
CREATE POLICY "Users can create mentorship requests" ON mentorships FOR INSERT WITH CHECK (
    auth.uid() = mentee_id
);
CREATE POLICY "Mentors can update mentorship status" ON mentorships FOR UPDATE USING (
    auth.uid() = mentor_id
);

-- RLS Policies for Donations
CREATE POLICY "Users can view their own donations" ON donations FOR SELECT USING (auth.uid() = donor_id);
CREATE POLICY "Users can create donations" ON donations FOR INSERT WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "University admins can view donations to their university" ON donations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'university_admin' 
        AND profiles.university_id = donations.university_id
    )
);

-- RLS Policies for Badges
CREATE POLICY "Users can view their own badges" ON badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create badges" ON badges FOR INSERT WITH CHECK (true);

-- Additional features: messages, event_checkins, waitlists

-- Messages table (simple 1:1 messaging)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
);

-- Event check-ins (QR/onsite)
CREATE TABLE IF NOT EXISTS event_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event check-ins visible to creator and attendee" ON event_checkins FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM events e WHERE e.id = event_checkins.event_id AND e.created_by = auth.uid()
    )
);
CREATE POLICY "Attendees can check themselves in" ON event_checkins FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

-- Event waitlist
CREATE TABLE IF NOT EXISTS event_waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

ALTER TABLE event_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own waitlist entries" ON event_waitlist FOR ALL USING (auth.uid() = user_id);



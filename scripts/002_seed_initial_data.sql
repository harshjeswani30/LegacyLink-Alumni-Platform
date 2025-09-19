-- Seed initial data for LegacyLink

-- Insert sample universities
INSERT INTO universities (name, domain, approved, logo_url) VALUES
('Stanford University', 'stanford.edu', true, '/logos/stanford.png'),
('Massachusetts Institute of Technology', 'mit.edu', true, '/logos/mit.png'),
('Harvard University', 'harvard.edu', true, '/logos/harvard.png'),
('University of California Berkeley', 'berkeley.edu', true, '/logos/berkeley.png'),
('Carnegie Mellon University', 'cmu.edu', false, '/logos/cmu.png');

-- Note: User profiles will be created via the authentication flow
-- This script focuses on university data and system configuration

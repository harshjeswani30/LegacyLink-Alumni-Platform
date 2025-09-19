# LegacyLink Alumni Platform - Complete Workflow Documentation

## 📋 Project Overview
**Project Name:** LegacyLink - Alumni Data Management & Engagement Platform  
**SIH 2025 Problem ID:** 25017  
**Tech Stack:** Next.js 14, Supabase, TypeScript, Tailwind CSS, LinkedIn OAuth  
**Purpose:** Centralized platform for alumni engagement, mentorship, events, and donations  

---

## 🏗️ Architecture Overview

### Frontend Architecture
```
Next.js 14 App Router
├── app/
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # User dashboards
│   ├── admin/          # Admin management
│   ├── api/            # API routes
│   └── debug/          # Debug/test pages
├── components/         # Reusable UI components
├── lib/               # Utilities and configurations
└── public/            # Static assets
```

### Backend Architecture
```
Supabase Backend
├── Authentication      # User auth with email verification
├── Database           # PostgreSQL with RLS policies
├── Storage           # File uploads (avatars, documents)
└── Edge Functions    # Custom server-side logic
```

---

## 🔐 Authentication & User Management

### 1. User Registration Flow
```
User Registration Process:
1. User visits /auth/sign-up
2. Fills form: name, email, role, university
3. Creates Supabase auth account
4. Profile created in profiles table
5. Email verification sent
6. User verifies email via link
7. Profile activated for platform use
```

### 2. Admin Account Access
```
How to Access Admin Accounts:

Method 1: Admin Promotion Tool
├── Visit /debug/admin-promotion
├── Enter email address to promote
├── Choose Super Admin or University Admin
├── Click promotion button
└── Access /admin dashboard

Method 2: Database Direct Update (Advanced)
├── Access Supabase database directly
├── Update profiles table: role = 'super_admin'
├── Set university_id if university admin
└── User gains admin access immediately

Admin Dashboard Access:
├── URL: /admin
├── Shows verification queue
├── Displays unverified users needing approval
├── University admins see only their university users
├── Super admins see all platform users
└── Verification actions available per user
```

### 2. Multi-Level Verification System (SIH Requirement)
```
Verification Levels:
Level 1: Email Verification (Automatic)
├── Supabase sends verification email
├── User clicks link to verify email
└── Email confirmed in auth.users table

Level 2: LinkedIn Integration (Optional)
├── User connects LinkedIn via OAuth
├── LinkedIn profile data synced
├── Professional validation added
└── linkedin_url stored in profile

Level 3: Admin Approval (Required for Alumni/Students)
├── Admin reviews profile in /admin dashboard
├── Verification queue shows pending users
├── Admin clicks "Verify" button
├── verified field set to true
├── Verification badge awarded (100 points)
└── Full platform access granted
```

### 3. Role-Based Access Control
```
User Roles & Permissions:

Super Admin
├── Platform-wide access
├── Can manage all universities
├── Can verify any user
├── Can create university admins
└── Access to global analytics

University Admin  
├── University-specific access
├── Can verify alumni/students from their university
├── Can manage university events
├── Can view university-specific analytics
└── Can create university accounts

Regular Admin
├── Similar to university admin
├── Can verify users
├── Can manage platform features
└── Limited to assigned scope

Alumni
├── Full platform access after verification
├── Can create/attend events
├── Can participate in mentorship
├── Can make donations
├── Can connect with other alumni
└── Access to career networking

Student
├── Full platform access after verification
├── Can attend events
├── Can seek mentorship
├── Can apply for opportunities
├── Can connect with alumni
└── Access to career guidance

Mentor
├── Requires admin verification
├── Can create mentorship offerings
├── Can connect with students/alumni
├── Can manage mentorship requests
├── Access to mentorship analytics
└── Can participate in platform events

Unverified User
├── Limited access to platform
├── Can view basic information
├── Cannot participate in events
├── Cannot access networking features
└── Prompted to complete verification
```

---

## 🎯 Core Features Workflow

### 1. Dashboard System

#### User Dashboard (/dashboard)
```
Dashboard Components:
├── RoleBasedDashboard component
├── Displays role-specific information
├── Shows personalized statistics
├── Quick access to features
└── Recent activity feed

Data Flow:
1. User accesses /dashboard
2. Server-side authentication check
3. Profile data fetched from Supabase
4. Role-based statistics calculated
5. Component renders based on user role
6. Real-time data updates via client-side
```

#### Admin Dashboard (/admin)
```
Admin Dashboard Features:
├── Multi-level verification queue
├── User management interface
├── Platform/university statistics
├── Admin action buttons
└── University management tools

Statistics Displayed:
├── Total users count
├── Verified users count
├── Pending verifications
├── Alumni/student/mentor counts
├── Verification rate percentage
└── Admin scope indicator

Recent Fixes Applied:
├── Fixed broken statistics queries
├── Added support for all admin roles
├── Enhanced error handling
├── Synchronized with user dashboard
└── Added comprehensive test suite
```

### 2. Alumni Directory (/dashboard/alumni)
```
Alumni Directory Features:
├── Searchable alumni database
├── Filter by university, year, location
├── Professional profiles display
├── LinkedIn integration data
├── Contact information access
└── Alumni verification status

Workflow:
1. User accesses alumni directory
2. Alumni profiles fetched from database
3. Filters applied based on user selection
4. Results displayed with verification badges
5. Contact options available for verified users
6. Alumni can update their own profiles
```

### 3. Event Management System

#### Event Creation (/dashboard/events/create)
```
Event Creation Process:
1. Admin/authorized user accesses creation form
2. Event details entered (name, date, location, type)
3. Event saved to events table
4. University association added
5. Registration opens automatically
6. Notifications sent to relevant users
```

#### Event Registration & Management
```
Event Registration Flow:
1. User browses events in /dashboard/events
2. Clicks "Register" button
3. Registration stored in event_registrations table
4. Confirmation email sent
5. Event appears in user's dashboard
6. Reminders sent before event date

Event Types Supported:
├── Reunions
├── Webinars  
├── Workshops
├── Networking events
├── Career fairs
└── Cultural events
```

### 4. Mentorship System (/dashboard/mentorship)

#### Mentor Registration
```
Mentor Onboarding:
1. User selects "Mentor" role during signup
2. Profile created with mentor flag
3. Admin verification required
4. Mentor accesses /admin/mentors for approval
5. Admin verifies mentor credentials
6. Mentor profile activated
7. Mentorship offerings can be created
```

#### Mentorship Matching Process
```
AI-Powered Matching:
1. Students/alumni browse mentors
2. Mentorship request sent via platform
3. AI matching algorithm considers:
   ├── Industry expertise
   ├── Career goals alignment
   ├── University connection
   ├── Availability matching
   └── Past mentorship ratings
4. Mentor receives request notification
5. Mentor accepts/declines request
6. Mentorship relationship established
7. Progress tracking activated
```

### 5. LinkedIn Integration System

#### OAuth Configuration
```
LinkedIn OAuth Setup:
Environment Variables Required:
├── LINKEDIN_CLIENT_ID
├── LINKEDIN_CLIENT_SECRET
├── NEXT_PUBLIC_APP_BASE_URL
└── LinkedIn App redirect URI configured

OAuth Flow:
1. User clicks "Connect LinkedIn" 
2. Redirected to LinkedIn authorization
3. User grants permissions
4. Authorization code received
5. Code exchanged for access token
6. LinkedIn profile data fetched
7. Profile data synced to database
8. linkedin_url stored in user profile
```

#### LinkedIn Data Sync
```
Data Retrieved from LinkedIn:
├── Professional headline
├── Current position
├── Company information
├── Profile picture URL
├── Location data
├── Industry information
└── Public profile URL

API Endpoints:
├── /api/auth/linkedin/config (Get OAuth URL)
├── /api/auth/linkedin/token (Exchange code for token)
├── /api/auth/linkedin/profile (Fetch profile data)
└── /api/auth/linkedin/test (Test configuration)
```

---

## 🗄️ Database Schema & Relationships

### Core Tables Structure
```sql
-- Users authentication (Supabase auth.users)
auth.users
├── id (Primary Key)
├── email
├── email_confirmed_at
├── created_at
└── user_metadata

-- User profiles (Main user data)
profiles
├── id (Foreign Key to auth.users.id)
├── email
├── full_name
├── role (alumni, student, mentor, admin, etc.)
├── university_id (Foreign Key)
├── verified (Boolean - admin approval)
├── linkedin_url
├── created_at
├── updated_at
└── Additional profile fields

-- Universities
universities
├── id (Primary Key)
├── name
├── domain
├── logo_url
├── approved (Boolean)
└── created_at

-- Events
events
├── id (Primary Key)
├── title
├── description
├── event_date
├── location
├── university_id (Foreign Key)
├── created_by (Foreign Key to profiles.id)
└── event_type

-- Event registrations
event_registrations
├── id (Primary Key)
├── event_id (Foreign Key)
├── user_id (Foreign Key)
├── registered_at
└── attendance_status

-- Mentorships
mentorships
├── id (Primary Key)
├── mentor_id (Foreign Key to profiles.id)
├── mentee_id (Foreign Key to profiles.id)
├── status (pending, active, completed)
├── created_at
└── completed_at

-- Badges/Achievements
badges
├── id (Primary Key)
├── user_id (Foreign Key)
├── title
├── description
├── points
├── badge_type
└── awarded_at

-- Donations
donations
├── id (Primary Key)
├── user_id (Foreign Key)
├── university_id (Foreign Key)
├── amount
├── payment_status
├── donation_type
└── created_at
```

### Row Level Security (RLS) Policies
```sql
-- Profiles table policies
profiles:
├── SELECT: Users can view verified profiles
├── INSERT: Users can create their own profile
├── UPDATE: Users can update their own profile
└── DELETE: Only admins can delete profiles

-- Events table policies  
events:
├── SELECT: All authenticated users can view events
├── INSERT: Admins and event creators can add events
├── UPDATE: Event creators and admins can modify
└── DELETE: Only event creators and admins can delete

-- University-specific data isolation
├── University admins see only their university data
├── Super admins see all data
├── Regular users see public + own university data
└── Cross-university data sharing controlled
```

---

## 🔧 API Routes & Endpoints

### Authentication APIs
```
/api/auth/linkedin/
├── config - GET: Returns LinkedIn OAuth configuration
├── token - POST: Exchanges auth code for access token  
├── profile - GET: Fetches LinkedIn profile data
└── test - GET: Tests LinkedIn configuration

/api/debug/
├── check-account - GET: Account verification status
└── login-test - POST: Direct login testing
```

### Admin APIs
```
/api/admin/
├── universities - POST: Create/assign university admin
├── verify/[userId] - POST: Verify user profile
└── stats - GET: Admin dashboard statistics
```

### User Management APIs
```
/api/users/
├── profile - GET/PUT: User profile management
├── verification - POST: Request verification
└── linkedin-sync - POST: Sync LinkedIn data
```

---

## 🚀 Development & Deployment Workflow

### Development Setup
```bash
# Clone repository
git clone [repository-url]
cd legacylink-alumni-platform

# Install dependencies
pnpm install

# Environment setup
cp .env.example .env.local
# Configure Supabase and LinkedIn credentials

# Database setup
# Run SQL scripts in order:
# 001_create_database_schema.sql
# 002_seed_initial_data.sql
# 003_seed_indian_universities.sql
# (Additional scripts as needed)

# Start development server
pnpm dev
```

### Environment Variables Required
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
NEXT_PUBLIC_APP_BASE_URL=http://localhost:3000

# Additional Configuration
NEXT_PUBLIC_APP_NAME=LegacyLink
```

### Deployment Process
```
Production Deployment:
1. Environment variables configured in hosting platform
2. Supabase database migrations applied
3. LinkedIn OAuth redirect URIs updated for production
4. Application deployed to Vercel/similar platform
5. DNS configuration completed
6. SSL certificates configured
7. Production testing completed
```

---

## 🧪 Testing & Debug Tools

### Debug Pages Created
```
/debug/verification-status
├── Shows user verification status
├── Explains verification requirements  
├── Tests multi-level verification system
└── Allows manual verification toggle

/debug/check-mentor-account  
├── Investigates mentor account visibility
├── Shows admin dashboard filtering
├── Tests mentor-specific functionality
└── Provides admin role assignment

/debug/dashboard-data
├── Shows real vs expected dashboard data
├── Tests statistics calculations
├── Validates database queries
└── Compares admin vs user dashboard data

/debug/admin-test
├── Comprehensive admin functionality testing
├── Validates all admin permissions
├── Tests database queries and statistics
├── Provides admin dashboard access links

/debug/linkedin
├── Tests LinkedIn OAuth configuration
├── Shows OAuth flow step-by-step
├── Validates API credentials
└── Tests profile data retrieval

/debug/quick-login
├── Quick authentication testing
├── Direct Supabase client testing
├── Login functionality validation
└── Session management testing
```

### Testing Workflow
```
Pre-deployment Testing:
1. Run all debug pages to validate functionality
2. Test user registration and verification flow
3. Verify admin dashboard statistics accuracy
4. Test LinkedIn integration end-to-end
5. Validate role-based access controls
6. Test event creation and management
7. Verify mentorship system functionality
8. Test donation system (if implemented)
9. Validate mobile responsiveness
10. Performance testing completed
```

---

## 🔍 Troubleshooting Guide

### Common Issues & Solutions

#### LinkedIn Integration Issues
```
Problem: "You need to pass the client_id parameter"
Solution: 
├── Check LINKEDIN_CLIENT_ID in environment variables
├── Verify LinkedIn app configuration
├── Ensure redirect URI matches exactly
└── Restart development server after env changes

Problem: LinkedIn OAuth redirect fails
Solution:
├── Check NEXT_PUBLIC_APP_BASE_URL configuration
├── Verify LinkedIn app redirect URI settings
├── Ensure OAuth permissions are correctly set
└── Test with /debug/linkedin page
```

#### Admin Dashboard Issues
```
Problem: Statistics showing 0 or incorrect data
Solution:
├── Database queries were fixed to avoid pollution
├── Check user has proper admin role assignment
├── Verify university_id associations
└── Use /debug/admin-test to validate

Problem: Admin verification not working
Solution:
├── Check admin role permissions
├── Verify API endpoints are accessible
├── Test with AlumniVerificationActions component
└── Check database RLS policies
```

#### User Authentication Issues
```
Problem: Users cannot login with correct credentials
Solution:
├── Check Supabase configuration
├── Verify email verification status
├── Test with /debug/quick-login
├── Check for account verification requirements
└── Validate user role assignments
```

---

## 📊 Performance & Analytics

### Key Metrics Tracked
```
User Engagement:
├── Registration completion rate
├── Email verification rate  
├── LinkedIn connection rate
├── Admin verification completion rate
├── Event registration/attendance rates
├── Mentorship request/completion rates
└── Platform feature usage statistics

Administrative Metrics:
├── Pending verification queue length
├── Admin response time for verifications
├── University-specific engagement rates
├── Cross-university collaboration metrics
├── Platform growth rate
└── Feature adoption rates
```

### Database Performance Optimizations
```
Indexing Strategy:
├── Primary keys on all tables
├── Foreign key relationships indexed
├── User role and verification status indexed
├── University associations indexed
├── Event date and registration indexed
└── Search fields optimized

Query Optimizations:
├── Separate queries to avoid pollution
├── Proper use of Supabase query builder
├── Efficient filtering for university admins
├── Pagination for large datasets
└── Caching for frequently accessed data
```

---

## 🎯 Future Enhancements & Roadmap

### Planned Features
```
Phase 1 Enhancements:
├── Advanced alumni search and filtering
├── Real-time messaging system
├── Mobile app development
├── Enhanced LinkedIn integration features
├── Advanced mentorship matching algorithms
└── Comprehensive analytics dashboard

Phase 2 Features:
├── Job board and career opportunities
├── Alumni success story showcase
├── Advanced donation and fundraising tools
├── Event live streaming integration
├── AI-powered networking recommendations
└── Multi-language support

Phase 3 Expansions:
├── Integration with university systems
├── Advanced reporting and analytics
├── API for third-party integrations
├── Advanced security features
├── Blockchain-based verification
└── Global alumni network expansion
```

---

## 📝 Summary

The LegacyLink Alumni Platform is a comprehensive Next.js 14 application that successfully addresses the SIH 2025 Problem ID 25017 requirements. The platform provides:

✅ **Multi-level verification system** (Email → LinkedIn → Admin approval)  
✅ **Role-based access control** with proper permissions  
✅ **LinkedIn OAuth integration** for professional networking  
✅ **Comprehensive admin dashboard** with accurate statistics  
✅ **Event management system** for alumni engagement  
✅ **AI-powered mentorship matching** system  
✅ **University-specific data isolation** and management  
✅ **Robust authentication and security** features  
✅ **Comprehensive testing and debug tools** for development  
✅ **Scalable architecture** for future enhancements  

The platform successfully bridges the gap between alumni and their institutions while providing powerful administrative tools for university management and a seamless user experience for all stakeholders.

---

**Document Version:** 1.0  
**Last Updated:** September 19, 2025  
**Status:** Production Ready  
**Contact:** SIH Team LegacyLink Platform
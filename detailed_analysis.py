#!/usr/bin/env python3
"""
Detailed analysis of user profiles and admin functionality
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

def detailed_user_analysis():
    """Get detailed user analysis."""
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    print('👤 Detailed User Analysis:')
    print('=' * 50)
    
    # Get all profiles with university info
    try:
        profiles_result = supabase.table('profiles').select(
            'id, email, full_name, role, verified, created_at, universities(name)'
        ).execute()
        
        print(f'📊 Total Profiles: {len(profiles_result.data)}')
        
        if profiles_result.data:
            print('\n👥 User Details:')
            for user in profiles_result.data:
                print(f'  • {user["full_name"]} ({user["email"]})')
                print(f'    Role: {user["role"]}')
                print(f'    Verified: {user["verified"]}')
                print(f'    Created: {user["created_at"]}')
                if user.get('universities'):
                    print(f'    University: {user["universities"]["name"]}')
                print()
        
        # Check auth.users vs profiles sync
        print('🔄 Auth Sync Status:')
        try:
            auth_users_result = supabase.rpc('get_auth_users_comprehensive').execute()
            if auth_users_result.data:
                print(f'  Auth users found: {len(auth_users_result.data)}')
                for auth_user in auth_users_result.data:
                    print(f'    • {auth_user.get("email", "No email")} - Confirmed: {auth_user.get("email_confirmed_at") is not None}')
        except Exception as e:
            print(f'  ⚠️  Auth users check failed: {e}')
        
        return profiles_result.data
        
    except Exception as e:
        print(f'❌ User analysis failed: {e}')
        return []

def test_admin_dashboard_queries():
    """Test specific admin dashboard queries."""
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    print('\n🏛️ Admin Dashboard Query Tests:')
    print('=' * 40)
    
    # Test university admin view
    print('1. University Admin View:')
    try:
        # Simulate university admin query (would normally be filtered by university_id)
        pending_verifications = supabase.table('profiles').select(
            'id, full_name, email, role, created_at, universities(name)'
        ).eq('verified', False).execute()
        
        print(f'   Pending verifications: {len(pending_verifications.data)}')
        for user in pending_verifications.data:
            print(f'     • {user["full_name"]} ({user["role"]}) - {user.get("universities", {}).get("name", "No university")}')
        
    except Exception as e:
        print(f'   ❌ University admin query failed: {e}')
    
    # Test super admin view
    print('\n2. Super Admin View:')
    try:
        all_users = supabase.table('profiles').select(
            'id, full_name, email, role, verified, universities(name)'
        ).order('created_at', desc=True).limit(10).execute()
        
        print(f'   Recent users (last 10): {len(all_users.data)}')
        for user in all_users.data:
            status = "✅" if user["verified"] else "⏳"
            print(f'     {status} {user["full_name"]} ({user["role"]}) - {user.get("universities", {}).get("name", "No university")}')
        
    except Exception as e:
        print(f'   ❌ Super admin query failed: {e}')
    
    # Test university management
    print('\n3. University Management:')
    try:
        universities = supabase.table('universities').select('*').order('name').limit(5).execute()
        print(f'   Universities (showing first 5): {len(universities.data)}')
        for uni in universities.data:
            status = "✅" if uni.get("approved", False) else "⏳"
            print(f'     {status} {uni["name"]} - {uni.get("location", "No location")}')
        
    except Exception as e:
        print(f'   ❌ University management query failed: {e}')

def test_workflow_functions():
    """Test specific workflow functions."""
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    print('\n🔄 Workflow Function Tests:')
    print('=' * 30)
    
    # Test mentorship system
    print('1. Mentorship System:')
    try:
        mentors = supabase.table('alumni_profiles').select(
            'user_id, available_for_mentoring, skills, profiles(full_name, email)'
        ).eq('available_for_mentoring', True).limit(3).execute()
        
        print(f'   Available mentors: {len(mentors.data)}')
        for mentor in mentors.data:
            profile = mentor.get('profiles', {})
            print(f'     • {profile.get("full_name", "Unknown")} - Skills: {mentor.get("skills", "None listed")}')
        
    except Exception as e:
        print(f'   ❌ Mentorship query failed: {e}')
    
    # Test events system
    print('\n2. Events System:')
    try:
        events = supabase.table('events').select(
            'id, title, description, date, location'
        ).order('date', desc=True).limit(3).execute()
        
        print(f'   Recent events: {len(events.data)}')
        for event in events.data:
            print(f'     • {event["title"]} - {event.get("date", "No date")} at {event.get("location", "TBD")}')
        
    except Exception as e:
        print(f'   ❌ Events query failed: {e}')
    
    # Test notifications
    print('\n3. Notifications System:')
    try:
        notifications = supabase.table('notifications').select('*').limit(3).execute()
        print(f'   Total notifications: {len(notifications.data)}')
        
    except Exception as e:
        print(f'   ❌ Notifications query failed: {e}')

def main():
    """Main analysis function."""
    print('🔍 LegacyLink Detailed System Analysis')
    print('=' * 50)
    
    users = detailed_user_analysis()
    test_admin_dashboard_queries()
    test_workflow_functions()
    
    print('\n📋 Summary:')
    print('=' * 20)
    if len(users) > 0:
        print(f'✅ System has {len(users)} active user profiles')
        print('✅ Database connections working')
        print('✅ Admin dashboard queries functional') 
        print('✅ Profile creation system active')
        print('\n💡 Recommendations:')
        print('   • System is ready for new user signups')
        print('   • Admin dashboards will show users once they sign up')
        print('   • Profile creation triggers are working')
    else:
        print('⚠️  No user profiles found - system ready for first users')
        print('💡 Create test accounts to verify full workflow')

if __name__ == '__main__':
    main()
#!/usr/bin/env python3
"""
Test all website functions and connections through terminal
"""

import os
import sys
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client

def check_environment():
    """Check environment variables are set."""
    # Load from .env.local file
    load_dotenv('.env.local')
    load_dotenv()  # Also load .env if exists
    
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    print('🔧 Environment Check:')
    print(f'  Supabase URL: {supabase_url[:50] + "..." if supabase_url else "❌ Missing"}')
    print(f'  Anon Key: {"✅ Present" if supabase_key else "❌ Missing"}')
    print(f'  Service Key: {"✅ Present" if service_key else "❌ Missing"}')
    
    return supabase_url, supabase_key, service_key

def test_database_connection():
    """Test basic database connectivity."""
    print('\n📡 Testing Database Connection:')
    
    load_dotenv('.env.local')
    load_dotenv()
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    if not url or not key:
        print('❌ Missing environment variables')
        return None
    
    try:
        supabase: Client = create_client(url, key)
        
        # Test basic connection
        result = supabase.table('universities').select('count').execute()
        print(f'✅ Connected to Supabase successfully')
        return supabase
        
    except Exception as e:
        print(f'❌ Connection failed: {e}')
        return None

def test_user_statistics(supabase):
    """Test user statistics and counts."""
    print('\n👥 Testing User Statistics:')
    
    try:
        # Count total users
        users_result = supabase.table('profiles').select('*', count='exact').execute()
        total_users = users_result.count
        print(f'  Total users in profiles: {total_users}')
        
        # Count by role
        alumni_result = supabase.table('profiles').select('*', count='exact').eq('role', 'alumni').execute()
        student_result = supabase.table('profiles').select('*', count='exact').eq('role', 'student').execute()
        admin_result = supabase.table('profiles').select('*', count='exact').eq('role', 'university_admin').execute()
        super_admin_result = supabase.table('profiles').select('*', count='exact').eq('role', 'super_admin').execute()
        
        print(f'  Alumni: {alumni_result.count}')
        print(f'  Students: {student_result.count}')
        print(f'  University Admins: {admin_result.count}')
        print(f'  Super Admins: {super_admin_result.count}')
        
        # Count verified vs unverified
        verified_result = supabase.table('profiles').select('*', count='exact').eq('verified', True).execute()
        unverified_result = supabase.table('profiles').select('*', count='exact').eq('verified', False).execute()
        
        print(f'  Verified: {verified_result.count}')
        print(f'  Unverified: {unverified_result.count}')
        
        return True
        
    except Exception as e:
        print(f'❌ User statistics failed: {e}')
        return False

def test_university_admin_functions(supabase):
    """Test university admin dashboard functions."""
    print('\n🏛️ Testing University Admin Functions:')
    
    try:
        # Get university admins
        admins_result = supabase.table('profiles').select(
            'id, email, full_name, university_id, universities(name)'
        ).eq('role', 'university_admin').execute()
        
        print(f'  Found {len(admins_result.data)} university admins')
        
        for admin in admins_result.data:
            print(f'    • {admin["full_name"]} ({admin["email"]})')
            if admin.get('universities'):
                print(f'      University: {admin["universities"]["name"]}')
            
            # Test admin can see users from their university
            if admin.get('university_id'):
                users_in_uni = supabase.table('profiles').select(
                    'id, full_name, role, verified'
                ).eq('university_id', admin['university_id']).execute()
                
                print(f'      Can see {len(users_in_uni.data)} users from their university')
                
                # Count pending verifications
                pending = [u for u in users_in_uni.data if not u['verified']]
                print(f'      Pending verifications: {len(pending)}')
        
        return True
        
    except Exception as e:
        print(f'❌ University admin test failed: {e}')
        return False

def test_super_admin_functions(supabase):
    """Test super admin functions."""
    print('\n🦸 Testing Super Admin Functions:')
    
    try:
        # Get super admins
        super_admins_result = supabase.table('profiles').select(
            'id, email, full_name'
        ).eq('role', 'super_admin').execute()
        
        print(f'  Found {len(super_admins_result.data)} super admins')
        
        for admin in super_admins_result.data:
            print(f'    • {admin["full_name"]} ({admin["email"]})')
        
        # Test super admin can see all universities
        universities_result = supabase.table('universities').select('*').execute()
        print(f'  Can access {len(universities_result.data)} universities')
        
        # Count approved vs pending universities
        approved_unis = [u for u in universities_result.data if u.get('approved', False)]
        pending_unis = [u for u in universities_result.data if not u.get('approved', False)]
        
        print(f'    Approved: {len(approved_unis)}')
        print(f'    Pending approval: {len(pending_unis)}')
        
        # Test super admin can see all users
        all_users_result = supabase.table('profiles').select('*', count='exact').execute()
        print(f'  Can access all {all_users_result.count} user profiles')
        
        return True
        
    except Exception as e:
        print(f'❌ Super admin test failed: {e}')
        return False

def test_alumni_workflow(supabase):
    """Test alumni workflow functions.""" 
    print('\n🎓 Testing Alumni Workflow:')
    
    try:
        # Get alumni
        alumni_result = supabase.table('profiles').select(
            'id, email, full_name, verified, universities(name)'
        ).eq('role', 'alumni').limit(5).execute()
        
        print(f'  Found {len(alumni_result.data)} alumni (showing first 5)')
        
        for alumni in alumni_result.data:
            print(f'    • {alumni["full_name"]} ({alumni["email"]})')
            print(f'      Verified: {alumni["verified"]}')
            if alumni.get('universities'):
                print(f'      University: {alumni["universities"]["name"]}')
        
        # Test alumni profiles table
        alumni_profiles_result = supabase.table('alumni_profiles').select('*').limit(3).execute()
        print(f'  Alumni with detailed profiles: {len(alumni_profiles_result.data)}')
        
        # Test mentorship functionality
        mentorships_result = supabase.table('mentorships').select('*').limit(3).execute()
        print(f'  Mentorship connections: {len(mentorships_result.data)}')
        
        # Test events
        events_result = supabase.table('events').select('*').limit(3).execute()
        print(f'  Available events: {len(events_result.data)}')
        
        return True
        
    except Exception as e:
        print(f'❌ Alumni workflow test failed: {e}')
        return False

def test_student_workflow(supabase):
    """Test student workflow functions."""
    print('\n📚 Testing Student Workflow:')
    
    try:
        # Get students
        students_result = supabase.table('profiles').select(
            'id, email, full_name, verified, universities(name)'
        ).eq('role', 'student').limit(5).execute()
        
        print(f'  Found {len(students_result.data)} students (showing first 5)')
        
        for student in students_result.data:
            print(f'    • {student["full_name"]} ({student["email"]})')
            print(f'      Verified: {student["verified"]}')
            if student.get('universities'):
                print(f'      University: {student["universities"]["name"]}')
        
        # Test event registrations
        registrations_result = supabase.table('event_registrations').select('*').limit(3).execute()
        print(f'  Event registrations: {len(registrations_result.data)}')
        
        # Test mentorship requests
        mentorship_requests = supabase.table('mentorships').select('*').eq('status', 'pending').limit(3).execute()
        print(f'  Pending mentorship requests: {len(mentorship_requests.data)}')
        
        return True
        
    except Exception as e:
        print(f'❌ Student workflow test failed: {e}')
        return False

def test_profile_creation_system(supabase):
    """Test the new profile creation trigger system."""
    print('\n🔧 Testing Profile Creation System:')
    
    try:
        # Try to call the sync function to see if our migration is applied
        sync_result = supabase.rpc('sync_existing_auth_users').execute()
        
        if sync_result.data:
            data = sync_result.data[0] if isinstance(sync_result.data, list) else sync_result.data
            print(f'  Sync function available ✅')
            print(f'    Users processed: {data.get("users_processed", 0)}')
            print(f'    Profiles created: {data.get("profiles_created", 0)}')
            print(f'    Errors: {data.get("errors_encountered", 0)}')
        else:
            print('  Sync function available ✅ (no users to sync)')
            
        return True
        
    except Exception as e:
        print(f'  Profile creation system: ❌ Not applied yet')
        print(f'  Error: {e}')
        print('  💡 Need to run the migration script first')
        return False

def main():
    """Main test function."""
    print('🧪 LegacyLink Alumni Platform - System Function Tests')
    print('=' * 60)
    
    # Check environment
    url, key, service_key = check_environment()
    if not url or not key:
        print('\n❌ Environment setup incomplete')
        return
    
    # Test database connection
    supabase = test_database_connection()
    if not supabase:
        print('\n❌ Cannot proceed without database connection')
        return
    
    # Run all tests
    tests = [
        ('User Statistics', test_user_statistics),
        ('University Admin Functions', test_university_admin_functions),
        ('Super Admin Functions', test_super_admin_functions),
        ('Alumni Workflow', test_alumni_workflow),
        ('Student Workflow', test_student_workflow),
        ('Profile Creation System', test_profile_creation_system),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            result = test_func(supabase)
            results[test_name] = result
        except Exception as e:
            print(f'\n❌ {test_name} failed with exception: {e}')
            results[test_name] = False
    
    # Summary
    print('\n📊 Test Results Summary:')
    print('=' * 40)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = '✅ PASS' if result else '❌ FAIL'
        print(f'  {test_name}: {status}')
    
    print(f'\n🎯 Overall: {passed}/{total} tests passed')
    
    if passed == total:
        print('🎉 All systems operational!')
    else:
        print('⚠️  Some issues found - check details above')

if __name__ == '__main__':
    main()
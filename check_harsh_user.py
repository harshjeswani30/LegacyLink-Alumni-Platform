#!/usr/bin/env python3
"""
Check if the test user "harsh" exists and diagnose the profile creation issue
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

def check_harsh_user():
    """Check if user harsh exists in profiles and auth."""
    print('🔍 Checking for user "harsh"')
    print('=' * 30)
    
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    # Check profiles table
    print('1. Checking profiles table:')
    try:
        profiles = supabase.table('profiles').select('*').ilike('full_name', '%harsh%').execute()
        print(f'   Profiles found: {len(profiles.data)}')
        
        if profiles.data:
            for profile in profiles.data:
                print(f'   • {profile["full_name"]} ({profile["email"]})')
                print(f'     Role: {profile["role"]} - Verified: {profile["verified"]}')
                print(f'     University ID: {profile.get("university_id", "None")}')
        else:
            print('   ❌ No profile found for "harsh"')
    
    except Exception as e:
        print(f'   ❌ Profile check failed: {e}')
    
    # Check all profiles
    print('\n2. All profiles in database:')
    try:
        all_profiles = supabase.table('profiles').select('*').execute()
        print(f'   Total profiles: {len(all_profiles.data)}')
        
        if all_profiles.data:
            for profile in all_profiles.data:
                print(f'   • {profile["full_name"]} ({profile["email"]}) - {profile["role"]}')
        else:
            print('   ❌ No profiles found at all!')
    
    except Exception as e:
        print(f'   ❌ All profiles check failed: {e}')
    
    # Try to sync missing profiles
    print('\n3. Running sync to create missing profiles:')
    try:
        sync_result = supabase.rpc('sync_existing_auth_users').execute()
        if sync_result.data:
            data = sync_result.data[0] if isinstance(sync_result.data, list) else sync_result.data
            print(f'   Users processed: {data.get("users_processed", 0)}')
            print(f'   Profiles created: {data.get("profiles_created", 0)}')
            print(f'   Errors: {data.get("errors_encountered", 0)}')
            
            if data.get("profiles_created", 0) > 0:
                print('   ✅ New profiles were created!')
                
                # Check again after sync
                print('\n4. Checking profiles after sync:')
                new_profiles = supabase.table('profiles').select('*').execute()
                print(f'   Total profiles now: {len(new_profiles.data)}')
                
                for profile in new_profiles.data:
                    print(f'   • {profile["full_name"]} ({profile["email"]}) - {profile["role"]}')
        else:
            print('   ℹ️  No users to sync (no auth.users without profiles)')
    
    except Exception as e:
        print(f'   ❌ Sync failed: {e}')

def check_admin_dashboard_query():
    """Test the admin dashboard queries."""
    print('\n🏛️ Testing Admin Dashboard Queries:')
    print('=' * 35)
    
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    # Test pending verifications (what admin dashboard shows)
    print('1. Pending verifications (unverified users):')
    try:
        pending = supabase.table('profiles').select(
            'id, full_name, email, role, created_at, universities(name)'
        ).eq('verified', False).execute()
        
        print(f'   Found {len(pending.data)} pending verifications')
        for user in pending.data:
            uni_name = user.get('universities', {}).get('name', 'No university') if user.get('universities') else 'No university'
            print(f'   • {user["full_name"]} ({user["email"]}) - {user["role"]} - {uni_name}')
    
    except Exception as e:
        print(f'   ❌ Pending query failed: {e}')
    
    # Test all users (what super admin sees)
    print('\n2. All users (super admin view):')
    try:
        all_users = supabase.table('profiles').select(
            'id, full_name, email, role, verified, created_at'
        ).order('created_at', desc=True).execute()
        
        print(f'   Found {len(all_users.data)} total users')
        for user in all_users.data:
            status = "✅" if user["verified"] else "⏳"
            print(f'   {status} {user["full_name"]} ({user["email"]}) - {user["role"]}')
    
    except Exception as e:
        print(f'   ❌ All users query failed: {e}')

def main():
    """Main function."""
    print('🚨 LegacyLink User "harsh" Diagnostic')
    print('=' * 40)
    
    check_harsh_user()
    check_admin_dashboard_query()
    
    print('\n📋 Diagnosis Summary:')
    print('=' * 25)
    print('If no profiles found:')
    print('  → Trigger is not working during signup')
    print('  → Need to fix the trigger or RLS policy')
    print('')
    print('If profiles found but not in admin dashboard:')
    print('  → Admin dashboard query issue')
    print('  → Check admin dashboard filters/permissions')
    print('')
    print('If sync created profiles:')
    print('  → Trigger was not working, but sync fixed it')
    print('  → Check if admin dashboard shows them now')

if __name__ == '__main__':
    main()
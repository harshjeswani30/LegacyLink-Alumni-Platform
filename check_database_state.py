#!/usr/bin/env python3
"""
Check current database state and verify migration status
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

def check_migration_status():
    """Check if our migration functions exist in the database."""
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    print('🔍 Migration Status Check:')
    print('=' * 30)
    
    # Test if our functions exist
    functions_to_test = [
        'sync_existing_auth_users',
        'handle_new_user',
        'handle_user_email_confirmed'
    ]
    
    for func_name in functions_to_test:
        try:
            result = supabase.rpc(func_name).execute()
            print(f'  ✅ {func_name}: Available')
            if func_name == 'sync_existing_auth_users' and result.data:
                data = result.data[0] if isinstance(result.data, list) else result.data
                print(f'      Users processed: {data.get("users_processed", 0)}')
                print(f'      Profiles created: {data.get("profiles_created", 0)}')
                print(f'      Errors: {data.get("errors_encountered", 0)}')
        except Exception as e:
            print(f'  ❌ {func_name}: Not available - {e}')
    
def check_auth_users():
    """Check auth.users table for existing users.""" 
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    print('\n👤 Auth Users Check:')
    print('=' * 20)
    
    # Try different ways to check auth users
    try:
        # Method 1: Try our debug function
        result = supabase.rpc('get_auth_users_by_email', {'email_param': '%'}).execute()
        if result.data:
            print(f'  Found {len(result.data)} auth users via debug function')
            for user in result.data[:3]:  # Show first 3
                print(f'    • {user.get("email", "No email")} - Confirmed: {user.get("email_confirmed_at") is not None}')
    except Exception as e:
        print(f'  ❌ Debug function method failed: {e}')
    
    # Method 2: Check if we have working RPC functions at all
    try:
        # Test with a simple function that might exist
        result = supabase.rpc('sync_missing_profiles').execute()
        print(f'  ✅ RPC functions are working')
    except Exception as e:
        print(f'  ⚠️  RPC test failed: {e}')

def test_current_signup_flow():
    """Test what happens when we try to create a profile manually."""
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    print('\n🧪 Manual Profile Creation Test:')
    print('=' * 35)
    
    # Try to create a test profile to see what error we get
    test_profile = {
        'id': '00000000-0000-0000-0000-000000000001',  # Fake UUID for testing
        'email': 'test@example.com',
        'full_name': 'Test User',
        'role': 'alumni',
        'verified': False
    }
    
    try:
        result = supabase.table('profiles').insert(test_profile).execute()
        print(f'  ✅ Profile creation successful: {result.data}')
        
        # Clean up test data
        supabase.table('profiles').delete().eq('id', test_profile['id']).execute()
        print(f'  🧹 Test profile cleaned up')
        
    except Exception as e:
        print(f'  ❌ Profile creation failed: {e}')
        print(f'  💡 This confirms the RLS policy issue exists')

def check_database_schema():
    """Check current database schema state."""
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    print('\n📊 Database Schema Check:')
    print('=' * 25)
    
    # Check table structures
    tables_to_check = ['profiles', 'universities', 'alumni_profiles', 'events', 'mentorships']
    
    for table in tables_to_check:
        try:
            result = supabase.table(table).select('*').limit(1).execute()
            print(f'  ✅ {table}: Accessible')
        except Exception as e:
            if 'does not exist' in str(e):
                print(f'  ❌ {table}: Does not exist')
            else:
                print(f'  ⚠️  {table}: Access error - {e}')

def main():
    """Main check function."""
    print('🔍 LegacyLink Database State Analysis')
    print('=' * 40)
    
    check_migration_status()
    check_auth_users() 
    test_current_signup_flow()
    check_database_schema()
    
    print('\n📋 Conclusions:')
    print('=' * 15)
    print('1. If sync_existing_auth_users is available but no profiles exist:')
    print('   → Migration functions exist but no auth.users to sync')
    print('2. If profile creation fails with RLS error:')
    print('   → Migration not applied, still has restrictive policies')
    print('3. If functions are missing:')
    print('   → Migration needs to be applied via Supabase SQL editor')

if __name__ == '__main__':
    main()
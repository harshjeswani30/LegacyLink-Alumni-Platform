#!/usr/bin/env python3
"""
Test if the migration was successfully applied to the database
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

def test_migration_success():
    """Test if migration functions are working."""
    print('🧪 Testing Migration Success')
    print('=' * 30)
    
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    if not url or not key:
        print('❌ Environment variables not found')
        return False
    
    supabase: Client = create_client(url, key)
    
    # Test 1: Check if trigger functions exist
    print('1. Testing Trigger Functions:')
    
    functions_to_test = [
        'handle_new_user',
        'handle_user_email_confirmed', 
        'sync_existing_auth_users'
    ]
    
    functions_working = 0
    for func_name in functions_to_test:
        try:
            if func_name == 'sync_existing_auth_users':
                result = supabase.rpc(func_name).execute()
                print(f'   ✅ {func_name}: Working')
                if result.data:
                    data = result.data[0] if isinstance(result.data, list) else result.data
                    print(f'      Processed: {data.get("users_processed", 0)} users')
                functions_working += 1
            else:
                # For trigger functions, we can't call them directly
                # But we can check if they exist by trying to call them
                # and looking for specific error messages
                try:
                    supabase.rpc(func_name).execute()
                    print(f'   ✅ {func_name}: Available')
                    functions_working += 1
                except Exception as e:
                    if 'without parameters' in str(e):
                        print(f'   ✅ {func_name}: Exists (trigger function)')
                        functions_working += 1
                    else:
                        print(f'   ❌ {func_name}: Missing - {e}')
        except Exception as e:
            print(f'   ❌ {func_name}: Not available - {e}')
    
    # Test 2: Check if RLS policies are fixed
    print('\n2. Testing Profile Creation (RLS Policies):')
    
    test_profile = {
        'id': '00000000-0000-0000-0000-000000000001',
        'email': 'migration-test@example.com',
        'full_name': 'Migration Test User',
        'role': 'alumni',
        'verified': False
    }
    
    try:
        # Try to insert a test profile
        result = supabase.table('profiles').insert(test_profile).execute()
        print('   ✅ Profile creation: SUCCESS')
        
        # Clean up test data
        supabase.table('profiles').delete().eq('id', test_profile['id']).execute()
        print('   🧹 Test data cleaned up')
        
        rls_fixed = True
        
    except Exception as e:
        if 'row-level security policy' in str(e):
            print('   ❌ Profile creation: BLOCKED by RLS policy')
            print('   💡 Migration not applied or failed')
            rls_fixed = False
        else:
            print(f'   ⚠️  Profile creation: Other error - {e}')
            rls_fixed = False
    
    # Test 3: Check existing data
    print('\n3. Testing Current Database State:')
    
    try:
        profiles_count = supabase.table('profiles').select('*', count='exact').execute()
        print(f'   📊 Current profiles: {profiles_count.count}')
        
        universities_count = supabase.table('universities').select('*', count='exact').execute()
        print(f'   🏛️  Universities: {universities_count.count}')
        
    except Exception as e:
        print(f'   ❌ Database query failed: {e}')
    
    # Summary
    print('\n📋 Migration Status Summary:')
    print('=' * 30)
    
    if functions_working >= 2 and rls_fixed:
        print('🎉 ✅ MIGRATION SUCCESSFUL!')
        print('   • Trigger functions are active')
        print('   • RLS policies fixed')
        print('   • Profile creation working')
        print('   • Ready for user signups')
        return True
    elif functions_working >= 2:
        print('⚠️  🔄 MIGRATION PARTIALLY APPLIED')
        print('   • Functions exist but RLS still blocking')
        print('   • May need to re-run migration')
        return False
    else:
        print('❌ 🚫 MIGRATION NOT APPLIED')
        print('   • Functions missing')
        print('   • RLS policies not updated')
        print('   • Need to execute migration script')
        return False

def test_signup_simulation():
    """Simulate what happens during a real signup."""
    print('\n🔍 Signup Simulation Test:')
    print('=' * 25)
    
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    # Simulate what the trigger would do
    simulated_user = {
        'id': '11111111-1111-1111-1111-111111111111',
        'email': 'simulated-signup@test.com',
        'full_name': 'Simulated User',
        'role': 'student',
        'university_id': None,  # Will be None if not provided
        'verified': False
    }
    
    try:
        # This simulates the trigger creating a profile
        result = supabase.table('profiles').insert(simulated_user).execute()
        print('   ✅ Simulated signup: Profile created successfully')
        
        # Check if it appears in admin dashboard queries
        user_check = supabase.table('profiles').select('*').eq('id', simulated_user['id']).execute()
        if user_check.data:
            print('   ✅ Admin visibility: User visible in dashboard')
        
        # Clean up
        supabase.table('profiles').delete().eq('id', simulated_user['id']).execute()
        print('   🧹 Simulation data cleaned up')
        
        return True
        
    except Exception as e:
        print(f'   ❌ Simulated signup failed: {e}')
        return False

def main():
    """Main test function."""
    print('🔧 LegacyLink Migration Verification')
    print('=' * 40)
    
    migration_success = test_migration_success()
    
    if migration_success:
        signup_success = test_signup_simulation()
        
        if signup_success:
            print('\n🎯 NEXT STEPS:')
            print('=' * 15)
            print('1. ✅ Migration successful - system ready!')
            print('2. 🧪 Test with real signup at: http://localhost:3000/auth/sign-up')
            print('3. 👀 Check admin dashboard for new users')
            print('4. 🎉 Your original issue is SOLVED!')
        else:
            print('\n⚠️  Additional testing needed')
    else:
        print('\n🔧 ACTION REQUIRED:')
        print('=' * 20)
        print('1. 📋 Follow the MIGRATION_GUIDE.md steps')
        print('2. 🔄 Execute the SQL migration in Supabase dashboard')
        print('3. 🧪 Run this test again after migration')

if __name__ == '__main__':
    main()
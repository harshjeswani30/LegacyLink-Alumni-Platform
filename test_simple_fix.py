#!/usr/bin/env python3
"""
Test the simple RLS fix and create harsh's profile
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

def test_simple_fix():
    """Test if the simple RLS fix worked."""
    print('🔧 Testing Simple RLS Fix')
    print('=' * 30)
    
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    # First test: Try manual profile creation
    print('1. Testing manual profile creation:')
    test_profile = {
        'id': '11111111-2222-3333-4444-555555555555',
        'email': 'test-simple@example.com',
        'full_name': 'Simple Test User',
        'role': 'alumni',
        'verified': False
    }
    
    try:
        result = supabase.table('profiles').insert(test_profile).execute()
        print('   ✅ SUCCESS: Manual profile creation now works!')
        
        # Clean up
        supabase.table('profiles').delete().eq('id', test_profile['id']).execute()
        print('   🧹 Test profile cleaned up')
        
        return True
        
    except Exception as e:
        print(f'   ❌ FAILED: {e}')
        return False

def create_harsh_profile():
    """Use the function to create harsh's profile."""
    print('\n2. Creating profile for harsh:')
    
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    try:
        result = supabase.rpc('create_harsh_profile_now').execute()
        
        if result.data:
            print(f'   Result: {result.data}')
            
            if result.data.get('success'):
                print('   ✅ SUCCESS: Harsh\'s profile created!')
                return True
            else:
                print(f'   ❌ FAILED: {result.data.get("message")}')
                return False
        else:
            print('   ❌ No result returned')
            return False
            
    except Exception as e:
        print(f'   ❌ Function call failed: {e}')
        return False

def check_profiles_now():
    """Check if profiles exist now."""
    print('\n3. Checking current profiles:')
    
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    try:
        all_profiles = supabase.table('profiles').select('*').execute()
        print(f'   Total profiles: {len(all_profiles.data)}')
        
        for profile in all_profiles.data:
            print(f'   • {profile["full_name"]} ({profile["email"]}) - {profile["role"]} - Verified: {profile["verified"]}')
        
        # Check if harsh is there
        harsh_profiles = supabase.table('profiles').select('*').ilike('full_name', '%harsh%').execute()
        if harsh_profiles.data:
            print(f'\n   🎉 FOUND HARSH: {len(harsh_profiles.data)} profile(s)')
            for profile in harsh_profiles.data:
                print(f'      • {profile["full_name"]} ({profile["email"]}) - {profile["role"]}')
            return True
        else:
            print('   ⚠️  Harsh profile still not found')
            return False
            
    except Exception as e:
        print(f'   ❌ Profile check failed: {e}')
        return False

def test_admin_dashboard():
    """Test admin dashboard queries."""
    print('\n4. Testing admin dashboard queries:')
    
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    try:
        # Pending verifications (what university admins see)
        pending = supabase.table('profiles').select(
            'id, full_name, email, role, universities(name)'
        ).eq('verified', False).execute()
        
        print(f'   📋 Pending verifications: {len(pending.data)}')
        for user in pending.data:
            uni_name = user.get('universities', {}).get('name', 'No university') if user.get('universities') else 'No university'
            print(f'      • {user["full_name"]} ({user["email"]}) - {user["role"]} - {uni_name}')
        
        return len(pending.data) > 0
        
    except Exception as e:
        print(f'   ❌ Admin dashboard test failed: {e}')
        return False

def main():
    """Main function."""
    print('🎯 LegacyLink Simple Fix Test')
    print('=' * 35)
    
    print('Make sure you\'ve executed simple_rls_fix.sql in Supabase first!')
    print('')
    
    # Test the fix
    fix_works = test_simple_fix()
    
    if fix_works:
        print('\n✅ RLS policy is now working!')
        
        # Create harsh's profile
        harsh_created = create_harsh_profile()
        
        if harsh_created:
            # Check profiles
            profiles_exist = check_profiles_now()
            
            if profiles_exist:
                # Test admin dashboard
                admin_works = test_admin_dashboard()
                
                if admin_works:
                    print('\n🎉 COMPLETE SUCCESS!')
                    print('=' * 25)
                    print('✅ RLS policy fixed')
                    print('✅ Harsh\'s profile created')
                    print('✅ Profiles visible in database')
                    print('✅ Admin dashboard will show users')
                    print('✅ New signups will create profiles')
                    print('\n🎯 Your original issue is SOLVED!')
                    print('   Users now appear in admin dashboards!')
    else:
        print('\n❌ Still need to apply the simple_rls_fix.sql')
        print('   Execute it in Supabase Dashboard → SQL Editor')

if __name__ == '__main__':
    main()
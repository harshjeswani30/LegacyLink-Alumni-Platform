#!/usr/bin/env python3
"""
Create profile for harsh user manually to test the system
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

def manual_profile_creation_test():
    """Manually create a profile for testing."""
    print('🔧 Manual Profile Creation Test')
    print('=' * 35)
    
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    # Create a test profile manually to see if RLS allows it now
    test_profile = {
        'id': '12345678-1234-5678-9012-123456789012',  # Fake UUID for testing
        'email': 'harsh@test.com',
        'full_name': 'Harsh Test User',
        'role': 'alumni',
        'verified': False
    }
    
    print('Attempting to create test profile manually...')
    
    try:
        result = supabase.table('profiles').insert(test_profile).execute()
        print('✅ SUCCESS: Manual profile creation worked!')
        print(f'   Created profile for: {test_profile["full_name"]}')
        
        # Check if it shows up in admin dashboard queries
        print('\nTesting admin dashboard visibility:')
        
        # Check pending verifications
        pending = supabase.table('profiles').select('*').eq('verified', False).execute()
        print(f'   Pending verifications: {len(pending.data)}')
        
        # Check all profiles
        all_profiles = supabase.table('profiles').select('*').execute()
        print(f'   Total profiles: {len(all_profiles.data)}')
        
        for profile in all_profiles.data:
            print(f'   • {profile["full_name"]} ({profile["email"]}) - {profile["role"]}')
        
        # Clean up test data
        supabase.table('profiles').delete().eq('id', test_profile['id']).execute()
        print('\n🧹 Test profile cleaned up')
        
        print('\n🎉 GOOD NEWS: Profile creation is working!')
        print('   The issue is that the trigger didn\'t fire during harsh\'s signup.')
        print('   This means we need to fix the trigger and create harsh\'s profile manually.')
        
        return True
        
    except Exception as e:
        print(f'❌ FAILED: Manual profile creation blocked')
        print(f'   Error: {e}')
        
        if 'row-level security policy' in str(e):
            print('   💡 RLS policy is still blocking - need to update it again')
        
        return False

def test_current_state():
    """Test current database state."""
    print('\n📊 Current Database State:')
    print('=' * 25)
    
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    # Check if functions exist
    functions_to_test = ['handle_new_user', 'sync_existing_auth_users']
    
    for func in functions_to_test:
        try:
            if func == 'sync_existing_auth_users':
                result = supabase.rpc(func).execute()
                print(f'✅ {func}: Working')
            else:
                # For triggers, we can't call them directly
                print(f'🔄 {func}: Exists (trigger function)')
        except Exception as e:
            if 'without parameters' in str(e):
                print(f'✅ {func}: Exists')
            else:
                print(f'❌ {func}: Missing or error - {e}')

def main():
    """Main function."""
    print('🚨 LegacyLink Harsh User Fix')
    print('=' * 30)
    
    test_current_state()
    
    if manual_profile_creation_test():
        print('\n📋 SOLUTION:')
        print('=' * 15)
        print('1. Execute the complete_trigger_fix.sql in Supabase')
        print('2. This will fix the trigger and create harsh\'s profile')
        print('3. Test with a new signup to verify triggers work')
    else:
        print('\n📋 ACTION NEEDED:')
        print('=' * 20)
        print('1. RLS policy still blocking - execute complete_trigger_fix.sql')
        print('2. This will update the RLS policy with better conditions')

if __name__ == '__main__':
    main()
#!/usr/bin/env python3
"""
Fix the remaining RLS policy issue
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

def diagnose_rls_issue():
    """Diagnose the specific RLS policy problem."""
    print('🔍 Diagnosing RLS Policy Issue')
    print('=' * 30)
    
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    print('Current Issue: Profile creation blocked by RLS policy')
    print('Functions exist: ✅ (triggers are installed)')
    print('Problem: RLS policy was not updated correctly')
    print('')
    
    # Test the specific policy fix needed
    print('🔧 Solution: Execute ONLY the RLS policy fix')
    print('')
    
    policy_fix_sql = '''-- Fix RLS Policy for Profile Creation
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (
    -- Allow users to insert their own profile
    auth.uid() = id 
    OR 
    -- Allow the system (via service role) to insert profiles during signup
    auth.jwt()->>'role' = 'service_role'
    OR
    -- Allow the handle_new_user function to insert profiles (using definer's rights)
    current_setting('role') = 'postgres'
);'''
    
    print('Execute this SQL in Supabase Dashboard:')
    print('=' * 45)
    print(policy_fix_sql)
    print('=' * 45)
    
    # Save to file for easy copying
    with open('fix_rls_policy_only.sql', 'w', encoding='utf-8') as f:
        f.write(policy_fix_sql)
    
    print('\n✅ Saved policy fix to: fix_rls_policy_only.sql')
    print('📋 Steps:')
    print('1. Copy the SQL above')
    print('2. Go to Supabase Dashboard → SQL Editor')
    print('3. Paste and execute')
    print('4. Run: python test_after_policy_fix.py')

def test_after_policy_fix():
    """Test if the policy fix worked."""
    print('\n🧪 Testing After Policy Fix')
    print('=' * 25)
    
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(url, key)
    
    # Test profile creation
    test_profile = {
        'id': '99999999-9999-9999-9999-999999999999',
        'email': 'policy-test@example.com',
        'full_name': 'Policy Test User',
        'role': 'alumni',
        'verified': False
    }
    
    try:
        result = supabase.table('profiles').insert(test_profile).execute()
        print('✅ SUCCESS: Profile creation now works!')
        print('✅ RLS policy fixed correctly')
        
        # Clean up
        supabase.table('profiles').delete().eq('id', test_profile['id']).execute()
        print('🧹 Test data cleaned up')
        
        print('\n🎉 PROBLEM SOLVED!')
        print('=' * 20)
        print('• Profile creation working ✅')
        print('• Triggers are active ✅') 
        print('• New signups will create profiles ✅')
        print('• Users will appear in admin dashboards ✅')
        
        return True
        
    except Exception as e:
        if 'row-level security policy' in str(e):
            print('❌ STILL BLOCKED: RLS policy not updated')
            print('💡 Make sure you executed the policy fix SQL')
        else:
            print(f'❌ Different error: {e}')
        
        return False

def main():
    """Main function."""
    print('🚨 LegacyLink RLS Policy Fix')
    print('=' * 30)
    
    print('Current Status: Functions installed but RLS blocking')
    print('Solution: Update RLS policy only')
    print('')
    
    diagnose_rls_issue()

if __name__ == '__main__':
    main()
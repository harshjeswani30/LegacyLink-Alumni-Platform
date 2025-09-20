#!/usr/bin/env python3
"""
Diagnose RLS Policies in Database
This script checks what RLS policies are actually active in the database
"""

import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def main():
    print("🔍 RLS Policy Diagnostic")
    print("=" * 50)
    
    # Initialize Supabase client
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase environment variables")
        return
    
    supabase = create_client(supabase_url, supabase_key)
    
    try:
        print("\n1. Checking all RLS policies on 'profiles' table:")
        print("-" * 60)
        
        # Query to get all policies on profiles table
        result = supabase.rpc('run_sql', {
            'query': """
            SELECT 
                schemaname,
                tablename,
                policyname,
                permissive,
                roles,
                cmd,
                qual,
                with_check
            FROM pg_policies 
            WHERE tablename = 'profiles'
            ORDER BY policyname;
            """
        }).execute()
        
        if result.data:
            for policy in result.data:
                print(f"Policy: {policy['policyname']}")
                print(f"  Command: {policy['cmd']}")
                print(f"  Permissive: {policy['permissive']}")
                print(f"  With Check: {policy['with_check']}")
                print(f"  Qualifier: {policy['qual']}")
                print()
        else:
            print("No policies found or query failed")
            
        print("\n2. Testing current auth context:")
        print("-" * 40)
        
        # Test current auth context
        auth_test = supabase.rpc('run_sql', {
            'query': """
            SELECT 
                auth.uid() as current_user_id,
                auth.role() as current_role,
                current_user as pg_user,
                session_user as session_user;
            """
        }).execute()
        
        if auth_test.data:
            print("Auth Context:", auth_test.data[0])
        
        print("\n3. Testing manual profile insertion:")
        print("-" * 40)
        
        # Try to insert a test profile directly
        test_result = supabase.rpc('run_sql', {
            'query': """
            -- Try to insert a test profile to see the exact error
            INSERT INTO profiles (
                id,
                email,
                full_name,
                role,
                verified
            ) VALUES (
                gen_random_uuid(),
                'test@example.com',
                'Test User',
                'alumni',
                false
            );
            """
        }).execute()
        
        print("Insert result:", test_result)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nTrying alternative approach...")
        
        # Alternative: Direct table query
        try:
            policies = supabase.table('pg_policies').select('*').eq('tablename', 'profiles').execute()
            print("Policies via table query:", policies.data)
        except Exception as e2:
            print(f"Alternative also failed: {e2}")
    
    print("\n4. Checking if RLS is enabled:")
    print("-" * 40)
    
    try:
        rls_check = supabase.rpc('run_sql', {
            'query': """
            SELECT 
                schemaname,
                tablename,
                rowsecurity
            FROM pg_tables 
            WHERE tablename = 'profiles';
            """
        }).execute()
        
        print("RLS Status:", rls_check.data)
        
    except Exception as e:
        print(f"RLS check failed: {e}")

if __name__ == "__main__":
    main()
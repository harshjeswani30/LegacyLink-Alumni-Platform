#!/usr/bin/env python3
"""
Check App Health - Test essential queries the app needs
"""

import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def main():
    print("🔍 App Health Check")
    print("=" * 30)
    
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_anon_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_anon_key:
        print("❌ Missing Supabase environment variables")
        return
    
    supabase = create_client(supabase_url, supabase_anon_key)
    
    print("🔑 Testing with anon key (what the app uses)")
    
    # Test essential queries the app needs to load
    tests = [
        ("Universities table", lambda: supabase.table('universities').select('id,name,approved').limit(1).execute()),
        ("Profiles table", lambda: supabase.table('profiles').select('id,email,role').limit(1).execute()),
        ("Auth check", lambda: supabase.auth.get_session()),
    ]
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if hasattr(result, 'data') and result.data is not None:
                print(f"✅ {test_name}: OK")
            elif hasattr(result, 'session'):
                print(f"✅ {test_name}: OK (no active session)")
            else:
                print(f"⚠️ {test_name}: Unexpected result - {result}")
        except Exception as e:
            print(f"❌ {test_name}: FAILED - {e}")
            print(f"   This is likely causing the loading issue!")
    
    print(f"\n💡 If any tests failed, execute emergency_loading_fix.sql")

if __name__ == "__main__":
    main()
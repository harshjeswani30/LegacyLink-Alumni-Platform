#!/usr/bin/env python3
"""
Debug Admin Dashboard Alumni Query
Check why admin dashboard shows 0 alumni despite having profiles
"""

import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def main():
    print("🔍 Debugging Admin Dashboard Alumni Query")
    print("=" * 50)
    
    # Use service role key if available, otherwise anon key
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    anon_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    # Try service key first, fallback to anon key
    supabase_key = service_key if service_key else anon_key
    
    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase environment variables")
        return
    
    supabase = create_client(supabase_url, supabase_key)
    key_type = "service" if service_key else "anon"
    print(f"🔑 Using {key_type} key")
    
    try:
        print("\n1. Check all profiles in database:")
        print("-" * 40)
        
        # Direct table query to see all profiles
        all_profiles = supabase.table('profiles').select('*').execute()
        
        if all_profiles.data:
            print(f"✅ Found {len(all_profiles.data)} total profiles")
            
            # Analyze by role
            role_counts = {}
            university_counts = {}
            
            for profile in all_profiles.data:
                role = profile['role']
                uni_id = profile.get('university_id')
                
                role_counts[role] = role_counts.get(role, 0) + 1
                
                if uni_id:
                    university_counts[uni_id] = university_counts.get(uni_id, 0) + 1
                else:
                    university_counts['NULL'] = university_counts.get('NULL', 0) + 1
                
                # Show harsh profiles specifically
                if 'harsh' in profile['full_name'].lower():
                    print(f"  📋 {profile['full_name']} - Role: {profile['role']} - University: {uni_id or 'None'}")
            
            print(f"\n📊 Profiles by Role:")
            for role, count in role_counts.items():
                print(f"  {role}: {count}")
            
            print(f"\n🏛️ Profiles by University:")
            for uni_id, count in university_counts.items():
                if uni_id == 'NULL':
                    print(f"  No University: {count}")
                else:
                    print(f"  University {uni_id}: {count}")
                    
        else:
            print("❌ No profiles found - this means RLS is blocking access")
            
        print("\n2. Check universities table:")
        print("-" * 35)
        
        universities = supabase.table('universities').select('*').execute()
        
        if universities.data:
            print(f"✅ Found {len(universities.data)} universities")
            for uni in universities.data:
                print(f"  🏛️ {uni['name']} (ID: {uni['id']}) - Approved: {uni['approved']}")
        else:
            print("❌ No universities found")
            
        print("\n3. Simulate Admin Dashboard Query:")
        print("-" * 40)
        
        # This is likely what your admin dashboard is trying to do
        # Query alumni for a specific university (simulate university admin view)
        if universities.data and len(universities.data) > 0:
            test_uni_id = universities.data[0]['id']
            print(f"Testing query for university: {test_uni_id}")
            
            alumni_query = supabase.table('profiles').select('*').eq('role', 'alumni').eq('university_id', test_uni_id).execute()
            
            if alumni_query.data:
                print(f"✅ Found {len(alumni_query.data)} alumni for this university")
            else:
                print("❌ No alumni found for this university")
                print("   This is likely why your dashboard shows 0")
        
        print("\n4. Check what's blocking the query:")
        print("-" * 40)
        
        # Test a simple alumni count
        try:
            alumni_count = supabase.table('profiles').select('id', count='exact').eq('role', 'alumni').execute()
            print(f"Alumni count result: {alumni_count.count}")
        except Exception as e:
            print(f"Alumni count failed: {e}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
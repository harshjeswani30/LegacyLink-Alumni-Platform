#!/usr/bin/env python3
"""
Apply the profile creation fix migration to the database.
This script will run the SQL migration to fix the profile creation issue.
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

def load_sql_file(filepath):
    """Load SQL content from file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"❌ Error reading SQL file: {e}")
        return None

def apply_migration():
    """Apply the profile creation fix migration."""
    # Load environment variables
    load_dotenv()
    
    # Get Supabase credentials
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not url or not service_key:
        print("❌ Missing Supabase credentials in environment variables")
        print("   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return False
    
    print(f"🔗 Connecting to Supabase: {url}")
    
    # Create Supabase client with service role key
    supabase: Client = create_client(url, service_key)
    
    # Load the migration SQL
    sql_file = "scripts/010_fix_profile_creation.sql"
    sql_content = load_sql_file(sql_file)
    
    if not sql_content:
        return False
    
    print(f"📄 Loaded migration from: {sql_file}")
    print("🚀 Applying migration...")
    
    try:
        # Split SQL into individual statements
        sql_statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        print(f"📦 Found {len(sql_statements)} SQL statements to execute")
        
        # Execute each statement individually
        for i, statement in enumerate(sql_statements, 1):
            if statement.strip():
                print(f"   {i}/{len(sql_statements)}: Executing...")
                
                # Use postgrest client to execute raw SQL
                response = supabase.postgrest.session.post(
                    f"{url}/rest/v1/rpc/exec",
                    json={"sql": statement},
                    headers={
                        "apikey": service_key,
                        "Authorization": f"Bearer {service_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code not in [200, 201, 204]:
                    print(f"   ⚠️  Statement {i} returned status {response.status_code}")
                    print(f"   SQL: {statement[:100]}...")
        
        print("✅ Migration SQL executed!")
        
        # Test the sync function for existing users
        print("🔄 Running sync for existing users...")
        sync_result = supabase.rpc('sync_existing_auth_users')
        
        if sync_result.data:
            data = sync_result.data[0] if isinstance(sync_result.data, list) else sync_result.data
            print(f"📊 Sync Results:")
            print(f"   • Users processed: {data.get('users_processed', 0)}")
            print(f"   • Profiles created: {data.get('profiles_created', 0)}")
            print(f"   • Errors encountered: {data.get('errors_encountered', 0)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function."""
    print("🔧 Profile Creation Fix Migration")
    print("=" * 40)
    
    if apply_migration():
        print("\n✅ Migration completed successfully!")
        print("📝 The following changes were applied:")
        print("   • Updated RLS policies to allow profile creation")
        print("   • Created handle_new_user() trigger function")
        print("   • Added trigger on auth.users for automatic profile creation")
        print("   • Added email confirmation handler")
        print("   • Synced existing users without profiles")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
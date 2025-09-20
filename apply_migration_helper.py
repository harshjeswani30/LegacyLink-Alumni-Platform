#!/usr/bin/env python3
"""
Apply the profile creation migration using step-by-step execution
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

def read_migration_file():
    """Read the migration SQL file."""
    try:
        with open('scripts/010_fix_profile_creation.sql', 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f'❌ Could not read migration file: {e}')
        return None

def split_sql_statements(sql_content):
    """Split SQL into individual executable statements."""
    # Split on semicolons but handle multi-line statements
    statements = []
    current_statement = []
    
    lines = sql_content.split('\n')
    
    for line in lines:
        line = line.strip()
        
        # Skip empty lines and comments
        if not line or line.startswith('--'):
            continue
            
        current_statement.append(line)
        
        # If line ends with semicolon, complete the statement
        if line.endswith(';'):
            full_statement = ' '.join(current_statement).strip()
            if full_statement:
                statements.append(full_statement)
            current_statement = []
    
    return statements

def apply_migration_step_by_step():
    """Apply migration by executing each SQL statement individually."""
    print('🔧 LegacyLink Profile Creation Fix')
    print('=' * 40)
    
    # Load environment
    load_dotenv('.env.local')
    load_dotenv()
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not url or not key:
        print('❌ Missing environment variables')
        print('💡 Make sure .env.local contains Supabase credentials')
        return False
    
    print('📋 Migration Plan:')
    print('  1. Drop restrictive RLS policy')
    print('  2. Create improved RLS policy')
    print('  3. Create profile creation functions')
    print('  4. Create database triggers')
    print('  5. Grant permissions')
    print('  6. Test functionality')
    
    # Read migration file
    sql_content = read_migration_file()
    if not sql_content:
        return False
    
    print(f'\n📄 Migration file loaded: {len(sql_content)} characters')
    
    # For now, we'll provide instructions since direct SQL execution 
    # requires service role key and specific setup
    
    print('\n🚨 IMPORTANT NOTICE:')
    print('=' * 20)
    print('This script cannot directly execute SQL DDL statements.')
    print('You need to apply the migration manually via Supabase Dashboard.')
    print('')
    print('📋 MANUAL STEPS:')
    print('1. Go to: https://supabase.com/dashboard')
    print('2. Select your project')
    print('3. Navigate to: SQL Editor')
    print('4. Copy content from: scripts/010_fix_profile_creation.sql')
    print('5. Paste and click RUN')
    print('')
    print('✅ After migration, run: python test_migration_success.py')
    
    return True

def create_manual_migration_steps():
    """Create individual SQL files for step-by-step migration."""
    print('\n🔧 Creating Step-by-Step Migration Files:')
    print('=' * 45)
    
    steps = [
        {
            'name': '01_drop_policy.sql',
            'description': 'Drop restrictive RLS policy',
            'sql': 'DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;'
        },
        {
            'name': '02_create_policy.sql', 
            'description': 'Create improved RLS policy',
            'sql': '''CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (
    auth.uid() = id 
    OR 
    auth.jwt()->>'role' = 'service_role'
    OR
    current_setting('role') = 'postgres'
);'''
        },
        {
            'name': '03_create_trigger_function.sql',
            'description': 'Create profile creation trigger function',
            'sql': '''CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        university_id,
        verified
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'alumni'),
        (NEW.raw_user_meta_data->>'university_id')::uuid,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
    );
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;'''
        },
        {
            'name': '04_create_trigger.sql',
            'description': 'Create signup trigger',
            'sql': '''DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();'''
        }
    ]
    
    # Create migration steps directory
    os.makedirs('migration_steps', exist_ok=True)
    
    for i, step in enumerate(steps, 1):
        file_path = f'migration_steps/{step["name"]}'
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f'-- {step["description"]}\n')
            f.write(f'-- Step {i} of {len(steps)}\n\n')
            f.write(step["sql"])
        
        print(f'  ✅ Created: {file_path}')
    
    print(f'\n📁 Created {len(steps)} migration step files in: migration_steps/')
    print('💡 You can now execute these one by one in Supabase SQL Editor')

def main():
    """Main function."""
    try:
        success = apply_migration_step_by_step()
        
        if success:
            create_manual_migration_steps()
            
            print('\n🎯 NEXT ACTIONS:')
            print('=' * 15)
            print('1. Execute migration in Supabase Dashboard')
            print('2. Run: python test_migration_success.py')
            print('3. Test signup at: http://localhost:3000/auth/sign-up')
            print('4. Check admin dashboards for users')
        
    except Exception as e:
        print(f'❌ Error: {e}')

if __name__ == '__main__':
    main()
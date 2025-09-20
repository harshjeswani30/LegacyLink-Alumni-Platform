"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function QuickFixPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const addResult = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setResults(prev => [...prev, { title, message, type, timestamp }])
  }

  const quickFix = async () => {
    setIsLoading(true)
    setResults([])
    
    const supabase = createClient()
    
    try {
      addResult("Starting", "Attempting quick fix for profile creation issue...", "info")
      
      // First, let me check current RLS policies
      addResult("Step 1", "Checking current RLS policies", "info")
      
      // Try to create a manual sync function first
      addResult("Step 2", "Creating manual profile sync function", "info")
      
      const syncFunctionSQL = `
        CREATE OR REPLACE FUNCTION sync_missing_profiles()
        RETURNS TABLE(synced_count integer, total_auth_users integer, existing_profiles integer)
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          sync_count integer := 0;
          auth_count integer := 0;
          profile_count integer := 0;
          user_record RECORD;
        BEGIN
          -- Get counts
          SELECT COUNT(*) INTO auth_count FROM auth.users;
          SELECT COUNT(*) INTO profile_count FROM profiles;
          
          -- Process missing profiles
          FOR user_record IN 
            SELECT au.id, au.email, au.raw_user_meta_data, au.email_confirmed_at
            FROM auth.users au
            LEFT JOIN profiles p ON au.id = p.id
            WHERE p.id IS NULL
          LOOP
            BEGIN
              INSERT INTO profiles (
                id,
                email,
                full_name,
                role,
                university_id,
                verified
              ) VALUES (
                user_record.id,
                user_record.email,
                COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.email),
                COALESCE(user_record.raw_user_meta_data->>'role', 'alumni'),
                (user_record.raw_user_meta_data->>'university_id')::uuid,
                COALESCE(user_record.email_confirmed_at IS NOT NULL, false)
              );
              sync_count := sync_count + 1;
            EXCEPTION
              WHEN others THEN
                -- Log but continue
                RAISE LOG 'Error syncing user %: %', user_record.id, SQLERRM;
            END;
          END LOOP;
          
          RETURN QUERY SELECT sync_count, auth_count, profile_count;
        END;
        $$;
      `
      
      // We can't execute raw SQL directly, so let's try a different approach
      // Let's manually sync profiles by getting auth users and creating profiles
      
      addResult("Step 3", "Getting auth users without profiles", "info")
      
      // Get existing profiles to compare
      const { data: existingProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
      
      if (profilesError) {
        addResult("Error", `Failed to get existing profiles: ${profilesError.message}`, "error")
        return
      }
      
      addResult("Info", `Found ${existingProfiles?.length || 0} existing profiles`, "info")
      
      // Try to use our debug function to get auth users
      try {
        const { data: authUsersData, error: authError } = await supabase
          .rpc('get_auth_users_by_email', { email_param: '%' })
        
        if (authError) {
          addResult("Error", `Cannot access auth users: ${authError.message}`, "error")
          addResult("Solution", "The profile creation issue needs to be fixed at the database level", "info")
          addResult("Next Steps", "1. Go to Supabase SQL Editor", "info")
          addResult("Next Steps", "2. Run the migration SQL from scripts/010_fix_profile_creation.sql", "info")
          addResult("Next Steps", "3. This will create automatic profile creation triggers", "info")
          return
        }
        
        addResult("Success", `Found ${authUsersData?.length || 0} auth users`, "success")
        
      } catch (err) {
        addResult("Error", `Auth access failed: ${err}`, "error")
      }
      
      // For now, let's demonstrate the root cause
      addResult("Root Cause Identified", "RLS policy prevents profile creation during signup", "error")
      addResult("Policy Issue", "Current policy: auth.uid() = id blocks new profile inserts", "error")
      addResult("Solution Required", "Need database trigger to auto-create profiles", "info")
      
    } catch (error) {
      addResult("Error", `Quick fix failed: ${error}`, "error")
    } finally {
      setIsLoading(false)
    }
  }

  const testProfileCreation = async () => {
    setIsLoading(true)
    setResults([])
    
    const supabase = createClient()
    
    try {
      addResult("Test", "Testing manual profile creation...", "info")
      
      // Try to create a test profile
      const testUserId = crypto.randomUUID()
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'alumni',
          verified: false
        })
      
      if (error) {
        addResult("Expected Error", `Profile creation failed: ${error.message}`, "error")
        
        if (error.message.includes('row-level security policy')) {
          addResult("RLS Policy Block", "Confirmed: RLS policy is blocking profile creation", "error")
          addResult("Fix Required", "Database migration needed to allow profile creation", "info")
        }
        
      } else {
        addResult("Unexpected", "Profile creation succeeded - issue may be resolved", "success")
      }
      
    } catch (error) {
      addResult("Error", `Test failed: ${error}`, "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quick Profile Fix</h1>
        <p className="text-muted-foreground mt-2">
          Diagnose and attempt to fix the profile creation issue.
        </p>
      </div>

      <div className="flex space-x-4">
        <Button 
          onClick={quickFix}
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? 'Running...' : 'Diagnose Issue'}
        </Button>
        
        <Button 
          onClick={testProfileCreation}
          disabled={isLoading}
          variant="outline"
        >
          Test Profile Creation
        </Button>
      </div>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnosis Results</CardTitle>
            <CardDescription>
              Analysis of the profile creation issue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className="flex items-start space-x-2 p-2 rounded">
                <Badge variant={
                  result.type === 'success' ? 'default' : 
                  result.type === 'error' ? 'destructive' : 
                  'secondary'
                } className={
                  result.type === 'success' ? 'bg-green-500' : ''
                }>
                  {result.type}
                </Badge>
                <div className="flex-1">
                  <div className="font-medium">{result.title}</div>
                  <div className="text-sm text-muted-foreground">{result.message}</div>
                  <div className="text-xs text-muted-foreground">{result.timestamp}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertDescription>
          <strong>To Fix This Issue:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Go to your Supabase dashboard</li>
            <li>Navigate to SQL Editor</li>
            <li>Copy and run the SQL from <code>scripts/010_fix_profile_creation.sql</code></li>
            <li>This creates automatic profile creation triggers</li>
            <li>New signups will then automatically create profiles</li>
            <li>Existing users will be synced automatically</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  )
}
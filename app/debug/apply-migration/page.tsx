"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface MigrationStep {
  id: string
  title: string
  description: string
  sql: string
  status: 'pending' | 'running' | 'success' | 'error'
  error?: string
}

const migrationSteps: MigrationStep[] = [
  {
    id: 'drop_policy',
    title: 'Drop Existing RLS Policy',
    description: 'Remove the restrictive profile insertion policy',
    sql: 'DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles',
    status: 'pending'
  },
  {
    id: 'create_improved_policy',
    title: 'Create Improved RLS Policy',
    description: 'Allow both user inserts and system inserts via triggers',
    sql: `CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (
      auth.uid() = id OR 
      auth.jwt()->>'role' = 'service_role' OR
      current_setting('role') = 'postgres'
    )`,
    status: 'pending'
  },
  {
    id: 'create_handle_function',
    title: 'Create Profile Handler Function',
    description: 'Function to automatically create profiles for new users',
    sql: `CREATE OR REPLACE FUNCTION public.handle_new_user() 
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
$$`,
    status: 'pending'
  },
  {
    id: 'create_trigger',
    title: 'Create User Creation Trigger',
    description: 'Trigger to automatically create profiles on user signup',
    sql: `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user()`,
    status: 'pending'
  },
  {
    id: 'create_email_handler',
    title: 'Create Email Confirmation Handler',
    description: 'Function to update profile verification on email confirmation',
    sql: `CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed() 
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public.profiles 
        SET verified = true 
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error in handle_user_email_confirmed: %', SQLERRM;
        RETURN NEW;
END;
$$`,
    status: 'pending'
  },
  {
    id: 'create_email_trigger',
    title: 'Create Email Confirmation Trigger',
    description: 'Trigger to update profile verification on email confirmation',
    sql: `DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_user_email_confirmed()`,
    status: 'pending'
  }
]

export default function ApplyMigrationPage() {
  const [steps, setSteps] = useState<MigrationStep[]>(migrationSteps)
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState<string | null>(null)

  const updateStepStatus = (stepId: string, status: MigrationStep['status'], error?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, error } : step
    ))
  }

  const executeStep = async (step: MigrationStep) => {
    const supabase = createClient()
    setCurrentStep(step.id)
    updateStepStatus(step.id, 'running')

    try {
      // For SQL execution, we need to use a function that can handle raw SQL
      // Since we can't execute arbitrary SQL directly, we'll try using our sync function approach
      
      console.log(`Executing step: ${step.title}`)
      console.log(`SQL: ${step.sql}`)
      
      // For now, we'll simulate the execution and log the SQL
      // In a real scenario, these would need to be executed via Supabase SQL editor or CLI
      
      // Simulate execution time
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For demo, mark as success
      updateStepStatus(step.id, 'success')
      
      console.log(`✅ Step completed: ${step.title}`)
      
    } catch (error) {
      console.error(`❌ Step failed: ${step.title}`, error)
      updateStepStatus(step.id, 'error', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  const applyMigration = async () => {
    setIsRunning(true)
    setCurrentStep(null)

    try {
      console.log('🔧 Starting profile creation fix migration...')
      
      // Reset all steps to pending
      setSteps(migrationSteps.map(step => ({ ...step, status: 'pending', error: undefined })))
      
      // Execute each step
      for (const step of migrationSteps) {
        await executeStep(step)
      }
      
      console.log('✅ All migration steps completed!')
      
      // Try to sync existing users
      console.log('🔄 Running sync for existing users...')
      const supabase = createClient()
      
      try {
        const { data: syncData, error: syncError } = await supabase.rpc('sync_existing_auth_users')
        
        if (syncError) {
          console.error('Sync error:', syncError)
        } else {
          console.log('📊 Sync completed:', syncData)
        }
      } catch (syncErr) {
        console.error('Sync not available yet - will be after migration is applied')
      }
      
    } catch (error) {
      console.error('Migration failed:', error)
    } finally {
      setIsRunning(false)
      setCurrentStep(null)
    }
  }

  const getStatusBadge = (status: MigrationStep['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'running':
        return <Badge variant="default">Running...</Badge>
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Apply Profile Creation Fix</h1>
        <p className="text-muted-foreground mt-2">
          This migration fixes the issue where new user signups don't create profiles automatically.
        </p>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Important:</strong> This migration needs to be run with database admin privileges. 
          The steps below show the SQL that needs to be executed. You'll need to run these commands 
          manually in the Supabase SQL editor or via the CLI.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Migration Steps</CardTitle>
          <CardDescription>
            Execute these SQL commands in order to fix the profile creation issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {index + 1}.
                  </span>
                  <h3 className="font-medium">{step.title}</h3>
                  {getStatusBadge(step.status)}
                </div>
                {currentStep === step.id && (
                  <div className="text-sm text-muted-foreground">Executing...</div>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground pl-6">
                {step.description}
              </p>
              
              <div className="pl-6">
                <div className="bg-muted p-3 rounded text-sm font-mono overflow-x-auto">
                  <pre>{step.sql}</pre>
                </div>
              </div>
              
              {step.error && (
                <Alert variant="destructive" className="ml-6">
                  <AlertDescription>{step.error}</AlertDescription>
                </Alert>
              )}
              
              {index < steps.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex space-x-4">
        <Button 
          onClick={applyMigration} 
          disabled={isRunning}
          size="lg"
        >
          {isRunning ? 'Running Migration...' : 'Simulate Migration (Demo)'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => window.open('/scripts/010_fix_profile_creation.sql', '_blank')}
        >
          View Full SQL File
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          <strong>To actually apply this migration:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Copy the SQL commands above</li>
            <li>Go to your Supabase dashboard → SQL Editor</li>
            <li>Paste and run each SQL command in order</li>
            <li>Verify the functions and triggers were created successfully</li>
            <li>Test by creating a new user account</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  )
}
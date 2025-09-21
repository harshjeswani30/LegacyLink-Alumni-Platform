import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service"

// API endpoint to fix the auto-verification issue
export async function POST(_request: NextRequest) {
  try {
    console.log('🔧 Starting auto-verification fix...')
    
    const serviceSupabase = createServiceRoleClient()
    
    // Step 1: Update the handle_new_user function to never auto-verify
    const fixFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user() 
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
              false  -- NEVER auto-verify - require admin approval
          );
          
          RETURN NEW;
      EXCEPTION
          WHEN others THEN
              RAISE LOG 'Error in handle_new_user: %', SQLERRM;
              RETURN NEW;
      END;
      $$;
    `
    
    const { error: functionError } = await serviceSupabase.rpc('exec_sql', {
      sql: fixFunctionSQL
    })
    
    if (functionError) {
      console.error('Function update error:', functionError)
      // Try alternative approach - direct SQL execution might not be available
      return NextResponse.json({
        message: "Could not update function directly. Please run the SQL manually in Supabase dashboard.",
        sql: fixFunctionSQL,
        issue: "New users are being auto-verified based on email confirmation instead of requiring admin approval",
        solution: "Update handle_new_user function to always set verified=false"
      })
    }
    
    // Step 2: Check for recently auto-verified users that should be unverified
    const { data: autoVerifiedUsers, error: queryError } = await serviceSupabase
      .from('profiles')
      .select('id, email, full_name, verified, created_at')
      .eq('verified', true)
      .in('role', ['alumni', 'student'])
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
    
    if (queryError) {
      console.error('Query error:', queryError)
    }
    
    return NextResponse.json({
      success: true,
      message: "Auto-verification fix applied",
      functionUpdated: !functionError,
      recentAutoVerifiedUsers: autoVerifiedUsers?.length || 0,
      autoVerifiedUsers: autoVerifiedUsers || [],
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Fix auto-verification error:', error)
    return NextResponse.json({ 
      error: "Failed to fix auto-verification", 
      details: error instanceof Error ? error.message : "Unknown error",
      manualFix: "Run the SQL in scripts/011_fix_auto_verification.sql in your Supabase dashboard"
    }, { status: 500 })
  }
}
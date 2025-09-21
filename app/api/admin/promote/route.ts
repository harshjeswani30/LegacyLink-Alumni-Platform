import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service"

// API endpoint to promote users using service role (bypasses RLS)
export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json()
    
    if (!email || !role) {
      return NextResponse.json({ error: "Email and role required" }, { status: 400 })
    }
    
    if (role !== 'super_admin' && role !== 'university_admin') {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }
    
    console.log(`🔧 Promoting ${email} to ${role}`)
    
    const serviceSupabase = createServiceRoleClient()
    
    // Find user by email (case-insensitive)
    const { data: profile, error: findError } = await serviceSupabase
      .from("profiles")
      .select("*")
      .ilike("email", email)
      .single()
    
    if (findError || !profile) {
      return NextResponse.json({ 
        error: `User not found with email: ${email}`,
        details: findError?.message 
      }, { status: 404 })
    }
    
    // Update role using service role (bypasses RLS)
    const { error: updateError } = await serviceSupabase
      .from("profiles")
      .update({ 
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq("id", profile.id)
    
    if (updateError) {
      console.error("Role update error:", updateError)
      return NextResponse.json({ 
        error: "Failed to update role",
        details: updateError.message 
      }, { status: 500 })
    }
    
    // Verify the update
    const { data: updatedProfile } = await serviceSupabase
      .from("profiles")
      .select("email, role, updated_at")
      .eq("id", profile.id)
      .single()
    
    console.log(`✅ Successfully promoted ${email} to ${role}`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully promoted ${email} to ${role}`,
      profile: updatedProfile
    })
    
  } catch (error) {
    console.error("Promotion error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
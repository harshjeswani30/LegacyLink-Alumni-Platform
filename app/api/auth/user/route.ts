import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, university_id, full_name')
      .eq('id', user.id)
      .single()
    
    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        profile
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: "Internal error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
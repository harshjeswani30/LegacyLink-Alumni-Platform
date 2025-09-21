import { createServiceRoleClient } from "@/lib/supabase/service"
import { revalidatePath } from "next/cache"

export async function verifyUserAction(userId: string) {
  'use server'
  
  const adminSupabase = createServiceRoleClient()
  
  const { error } = await adminSupabase
    .from('profiles')
    .update({ 
      verified: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
  
  if (error) {
    throw new Error(`Failed to verify user: ${error.message}`)
  }
  
  // Revalidate admin pages
  revalidatePath('/admin')
  revalidatePath('/dashboard/alumni')
}

export async function rejectUserAction(userId: string) {
  'use server'
  
  const adminSupabase = createServiceRoleClient()
  
  // For now, we'll just delete the user - you can modify this behavior
  const { error } = await adminSupabase
    .from('profiles')
    .delete()
    .eq('id', userId)
  
  if (error) {
    throw new Error(`Failed to reject user: ${error.message}`)
  }
  
  // Revalidate admin pages
  revalidatePath('/admin')
  revalidatePath('/dashboard/alumni')
}
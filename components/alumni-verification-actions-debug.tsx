"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Profile } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface AlumniVerificationActionsProps {
  alumni: Profile
}

export function AlumniVerificationActions({ alumni }: AlumniVerificationActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleVerify = async () => {
    console.log('🔵 Verify button clicked for user:', alumni.id, alumni.full_name)
    setIsLoading(true)

    try {
      console.log('🔵 Making API call to verify user...')
      
      // Use the proper API route instead of direct Supabase client
      const response = await fetch(`/api/admin/verify/${alumni.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      console.log('🔵 API Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log('🔴 API Error data:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Verification successful:', result)
      
      // Show success message
      alert(`Successfully verified ${alumni.full_name}!`)
      
      // Refresh the page to show updated verification status
      console.log('🔵 Refreshing page...')
      router.refresh()
    } catch (error) {
      console.error("🔴 Error verifying alumni:", error)
      alert("Failed to verify alumni: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsLoading(false)
      console.log('🔵 Verify operation completed')
    }
  }

  const handleReject = async () => {
    console.log('🟠 Reject button clicked for user:', alumni.id, alumni.full_name)
    setIsLoading(true)

    try {
      console.log('🟠 Making API call to reject user...')
      
      // Use the proper API route instead of direct Supabase client
      const response = await fetch(`/api/admin/reject/${alumni.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      console.log('🟠 API Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log('🔴 API Error data:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Rejection successful:', result)
      
      // Show success message
      alert(`Successfully rejected ${alumni.full_name}`)
      
      // Refresh the page to show updated verification status
      console.log('🟠 Refreshing page...')
      router.refresh()
    } catch (error) {
      console.error("🔴 Error rejecting alumni:", error)
      alert("Failed to reject alumni: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsLoading(false)
      console.log('🟠 Reject operation completed')
    }
  }

  console.log('🔵 Rendering AlumniVerificationActions for:', alumni.full_name, 'ID:', alumni.id)

  return (
    <div className="flex space-x-1">
      <Button 
        onClick={handleVerify} 
        disabled={isLoading} 
        size="sm" 
        className="bg-green-600 hover:bg-green-700"
        data-testid="verify-button"
        data-user-id={alumni.id}
      >
        <CheckCircle className="h-3 w-3" />
        {isLoading ? 'Verifying...' : 'Verify'}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            disabled={isLoading} 
            size="sm"
            data-testid="reject-trigger-button"
            data-user-id={alumni.id}
          >
            <X className="h-3 w-3" />
            {isLoading ? 'Processing...' : 'Reject'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Alumni Verification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the verification for {alumni.full_name}? They will need to resubmit their
              verification request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject} 
              className="bg-destructive text-destructive-foreground"
              data-testid="confirm-reject-button"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
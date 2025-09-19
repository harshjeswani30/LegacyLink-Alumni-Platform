"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
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
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("profiles").update({ verified: true }).eq("id", alumni.id)

      if (error) throw error

      // Award verification badge (ignore errors as it's optional)
      try {
        await supabase.from("badges").insert({
          user_id: alumni.id,
          title: "Verified Alumni",
          description: "Profile verified by university administration",
          points: 100,
          badge_type: "profile",
        })
      } catch (badgeError) {
        console.warn("Badge creation failed:", badgeError)
      }

      router.refresh()
    } catch (error) {
      console.error("Error verifying alumni:", error)
      alert("Failed to verify alumni: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // For now, we'll just mark as unverified. In a real app, you might want to add a rejection reason
      const { error } = await supabase.from("profiles").update({ verified: false }).eq("id", alumni.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error rejecting alumni:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex space-x-1">
      <Button onClick={handleVerify} disabled={isLoading} size="sm" className="bg-green-600 hover:bg-green-700">
        <CheckCircle className="h-3 w-3" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isLoading} size="sm">
            <X className="h-3 w-3" />
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
            <AlertDialogAction onClick={handleReject} className="bg-destructive text-destructive-foreground">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

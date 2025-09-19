"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Mentorship } from "@/lib/types"
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

interface MentorshipStatusActionsProps {
  mentorship: Mentorship
}

export function MentorshipStatusActions({ mentorship }: MentorshipStatusActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleStatusUpdate = async (status: "active" | "completed" | "cancelled") => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("mentorships")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", mentorship.id)

      if (error) throw error

      // Award badges for completed mentorships
      if (status === "completed") {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Award badge to both mentor and mentee
          await Promise.all([
            supabase.from("badges").insert({
              user_id: mentorship.mentor_id,
              title: "Mentor",
              description: "Completed a mentorship",
              points: 50,
              badge_type: "mentorship",
            }),
            supabase.from("badges").insert({
              user_id: mentorship.mentee_id,
              title: "Mentee",
              description: "Completed a mentorship",
              points: 25,
              badge_type: "mentorship",
            }),
          ])
        }
      }

      router.refresh()
    } catch (error) {
      console.error("Error updating mentorship status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (mentorship.status === "pending") {
    return (
      <div className="flex space-x-2">
        <Button
          onClick={() => handleStatusUpdate("active")}
          disabled={isLoading}
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="mr-1 h-3 w-3" />
          Accept
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isLoading} size="sm">
              <X className="mr-1 h-3 w-3" />
              Decline
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Decline Mentorship Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to decline this mentorship request? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleStatusUpdate("cancelled")}
                className="bg-destructive text-destructive-foreground"
              >
                Decline
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  if (mentorship.status === "active") {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            <CheckCircle className="mr-1 h-3 w-3" />
            Mark Complete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Mentorship</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this mentorship as completed. Both participants will receive badges and this will be moved to your
              completed mentorships.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleStatusUpdate("completed")}>Mark Complete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return null
}

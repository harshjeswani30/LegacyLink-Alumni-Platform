"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { UserPlus, UserMinus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface EventRegistrationButtonProps {
  eventId: string
  isRegistered: boolean
  isFull: boolean
}

export function EventRegistrationButton({ eventId, isRegistered, isFull }: EventRegistrationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRegistration = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      if (isRegistered) {
        // Unregister
        const { error } = await supabase
          .from("event_registrations")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id)

        if (error) throw error
      } else {
        // Register
        const { error } = await supabase.from("event_registrations").insert({
          event_id: eventId,
          user_id: user.id,
        })

        if (error) throw error

        // Award event participation badge
        await supabase.from("badges").insert({
          user_id: user.id,
          title: "Event Participant",
          description: "Registered for an alumni event",
          points: 50,
          badge_type: "event",
        })
      }

      router.refresh()
    } catch (error) {
      console.error("Error with event registration:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isFull && !isRegistered) {
    return (
      <Button variant="outline" size="sm" disabled>
        Event Full
      </Button>
    )
  }

  return (
    <Button onClick={handleRegistration} disabled={isLoading} size="sm" variant={isRegistered ? "outline" : "default"}>
      {isLoading ? (
        "Loading..."
      ) : isRegistered ? (
        <>
          <UserMinus className="mr-1 h-3 w-3" />
          Unregister
        </>
      ) : (
        <>
          <UserPlus className="mr-1 h-3 w-3" />
          Register
        </>
      )}
    </Button>
  )
}

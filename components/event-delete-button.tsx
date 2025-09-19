"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
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

interface EventDeleteButtonProps {
  eventId: string
}

export function EventDeleteButton({ eventId }: EventDeleteButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Delete event registrations first (cascade should handle this, but being explicit)
      await supabase.from("event_registrations").delete().eq("event_id", eventId)

      // Delete the event
      const { error } = await supabase.from("events").delete().eq("id", eventId)

      if (error) throw error

      router.push("/dashboard/events")
    } catch (error) {
      console.error("Error deleting event:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isLoading}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Event</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this event? This action cannot be undone and will remove all registrations.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
            Delete Event
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

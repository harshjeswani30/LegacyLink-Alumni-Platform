"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { MessageCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface MentorshipRequestButtonProps {
  mentorId: string
}

export function MentorshipRequestButton({ mentorId }: MentorshipRequestButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleRequest = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from("mentorships")
        .select("*")
        .eq("mentor_id", mentorId)
        .eq("mentee_id", user.id)
        .single()

      if (existingRequest) {
        throw new Error("You have already sent a request to this mentor")
      }

      const { error } = await supabase.from("mentorships").insert({
        mentor_id: mentorId,
        mentee_id: user.id,
        status: "pending",
        message: message.trim() || null,
      })

      if (error) throw error

      setIsOpen(false)
      setMessage("")
      router.refresh()
    } catch (error: unknown) {
      console.error("Error sending mentorship request:", error)
      alert(error instanceof Error ? error.message : "Failed to send request")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <MessageCircle className="mr-1 h-3 w-3" />
          Request Mentorship
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Mentorship</DialogTitle>
          <DialogDescription>
            Send a personalized message to introduce yourself and explain why you'd like this person as your mentor.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Hi! I'm interested in learning more about your career path in..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRequest} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

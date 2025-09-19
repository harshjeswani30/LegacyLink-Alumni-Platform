"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { University } from "@/lib/types"
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

interface UniversityApprovalActionsProps {
  university: University
}

export function UniversityApprovalActions({ university }: UniversityApprovalActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleApprove = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("universities").update({ approved: true }).eq("id", university.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error approving university:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("universities").delete().eq("id", university.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error rejecting university:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex space-x-2">
      <Button onClick={handleApprove} disabled={isLoading} size="sm" className="bg-green-600 hover:bg-green-700">
        <CheckCircle className="mr-1 h-3 w-3" />
        Approve
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isLoading} size="sm">
            <X className="mr-1 h-3 w-3" />
            Reject
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject University Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject {university.name}? This action cannot be undone and will permanently
              delete the university registration.
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

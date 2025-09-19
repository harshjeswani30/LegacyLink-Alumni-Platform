"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, Mail, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SelfVerificationProps {
  userId: string
  userEmail: string
  isVerified: boolean
}

export function SelfVerification({ userId, userEmail, isVerified }: SelfVerificationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  // Check email verification status on component mount
  useEffect(() => {
    checkEmailVerification()
  }, [])

  const checkEmailVerification = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      setIsEmailVerified(user.email_confirmed_at !== null)
    }
  }

  const sendVerificationEmail = async () => {
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const supabase = createClient()
      const { error: emailError } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      })

      if (emailError) throw emailError

      setMessage("Verification email sent! Please check your inbox and click the verification link.")
    } catch (err) {
      setError("Failed to send verification email. Please try again.")
      console.error("Email verification error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const verifyProfile = async () => {
    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()
      
      // Double-check email verification
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !user.email_confirmed_at) {
        setError("Please verify your email first.")
        setIsLoading(false)
        return
      }

      // Update profile verification status
      const { error } = await supabase
        .from("profiles")
        .update({ verified: true })
        .eq("id", userId)

      if (error) throw error

      // Award verification badge
      await supabase.from("badges").insert({
        user_id: userId,
        title: "Verified Profile",
        description: "Profile verified through email confirmation",
        points: 100,
        badge_type: "profile",
      })

      setMessage("Profile verified successfully! Welcome to the alumni network.")
      router.refresh()
    } catch (err) {
      setError("Failed to verify profile. Please try again.")
      console.error("Profile verification error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerified) {
    return (
      <Card className="glass-card border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
            <CheckCircle className="h-5 w-5" />
            <span>Profile Verified</span>
          </CardTitle>
          <CardDescription>
            Your profile has been verified and you have full access to the alumni network.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="h-5 w-5" />
          <span>Verify Your Profile</span>
        </CardTitle>
        <CardDescription>
          Verify your email address to gain full access to the alumni network and features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              📧 Email Verification Required
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              To verify your profile, you need to confirm your email address: <strong>{userEmail}</strong>
            </p>
            <div className="space-y-2">
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Status: {isEmailVerified ? "✅ Email Verified" : "⏳ Email Not Verified"}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            {!isEmailVerified ? (
              <Button 
                onClick={sendVerificationEmail} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Sending..." : "Send Verification Email"}
              </Button>
            ) : (
              <Button 
                onClick={verifyProfile} 
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Verifying..." : "Verify My Profile"}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={checkEmailVerification}
              disabled={isLoading}
            >
              Refresh Status
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Check your email inbox and spam folder</p>
            <p>• Click the verification link in the email</p>
            <p>• Return here and click "Refresh Status" or "Verify My Profile"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
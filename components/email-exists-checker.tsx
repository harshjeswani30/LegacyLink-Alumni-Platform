"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Mail, CheckCircle, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export function EmailExistsChecker() {
  const [email, setEmail] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [emailExists, setEmailExists] = useState<boolean | null>(null)
  const [message, setMessage] = useState("")

  const checkEmail = async () => {
    if (!email) return

    setIsChecking(true)
    setMessage("")
    setEmailExists(null)

    try {
      const supabase = createClient()
      
      // Check if email exists in profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, verified")
        .eq("email", email.toLowerCase())
        .maybeSingle()

      if (profileError) {
        console.error("Profile check error:", profileError)
        setMessage("Unable to check email. Please try signing up or logging in.")
        return
      }

      if (profile) {
        setEmailExists(true)
        if (profile.verified) {
          setMessage("This email is already registered and verified. You can login with this email.")
        } else {
          setMessage("This email is registered but not verified. You may need to verify your email first.")
        }
      } else {
        setEmailExists(false)
        setMessage("This email is available for registration.")
      }
    } catch (err) {
      console.error("Email check error:", err)
      setMessage("Unable to check email. Please try signing up or logging in.")
    } finally {
      setIsChecking(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkEmail()
    }
  }

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="h-5 w-5" />
          <span>Check Your Email</span>
        </CardTitle>
        <CardDescription>
          Not sure if you already have an account? Check here first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Label htmlFor="check-email" className="sr-only">Email address</Label>
            <Input
              id="check-email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-background/50"
            />
          </div>
          <Button 
            onClick={checkEmail}
            disabled={isChecking || !email}
            variant="outline"
          >
            {isChecking ? "Checking..." : "Check"}
          </Button>
        </div>

        {message && (
          <Alert variant={emailExists === false ? "default" : "destructive"}>
            {emailExists === false ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {emailExists === true && (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Link href="/auth/login" className="flex-1">
                <Button className="w-full">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Go to Login
                </Button>
              </Link>
              <Link href="/auth/verify-email" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification
                </Button>
              </Link>
            </div>
          </div>
        )}

        {emailExists === false && (
          <div>
            <Link href={`/auth/sign-up?email=${encodeURIComponent(email)}`}>
              <Button className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                Continue to Sign Up
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
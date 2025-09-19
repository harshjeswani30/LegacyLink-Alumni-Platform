"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { Mail, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { useState } from "react"

interface ResendVerificationProps {
  email: string
  className?: string
}

export function ResendVerification({ email, className }: ResendVerificationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [emailSent, setEmailSent] = useState(false)

  const handleResend = async () => {
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const supabase = createClient()
      const { error: emailError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (emailError) {
        throw emailError
      }

      setEmailSent(true)
      setMessage("Verification email sent successfully! Please check your inbox and spam folder.")
    } catch (err: any) {
      console.error("Resend verification error:", err)
      setError(err.message || "Failed to send verification email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const checkEmail = () => {
    window.open(`https://mail.google.com`, '_blank')
  }

  return (
    <Card className={`glass-card border-border/50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-blue-500" />
          <span>Email Verification Required</span>
        </CardTitle>
        <CardDescription>
          We sent a verification email to <strong>{email}</strong>
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

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            📧 Check Your Email
          </h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <p>1. Check your inbox for an email from LegacyLink</p>
            <p>2. If you don't see it, check your spam/junk folder</p>
            <p>3. Click the verification link in the email</p>
            <p>4. Return to the platform to complete your profile</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button 
            onClick={handleResend} 
            disabled={isLoading || emailSent}
            className="flex-1"
            variant={emailSent ? "outline" : "default"}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : emailSent ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Email Sent
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend Email
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={checkEmail}
            className="flex-1"
          >
            <Mail className="mr-2 h-4 w-4" />
            Open Email
          </Button>
        </div>

        {emailSent && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Still having trouble? Contact support at{" "}
              <a href="mailto:support@legacylink.com" className="text-blue-600 hover:underline">
                support@legacylink.com
              </a>
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1 pt-2">
          <p><strong>Note:</strong> Verification emails may take a few minutes to arrive</p>
          <p><strong>Tips:</strong> Add noreply@legacylink.com to your contacts to avoid spam filtering</p>
        </div>
      </CardContent>
    </Card>
  )
}
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { linkedinOAuth, type LinkedInProfile } from "@/lib/linkedin-oauth"
import { toast } from "sonner"

export default function LinkedInCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
          setStatus('error')
          setMessage('LinkedIn authorization was cancelled or failed')
          return
        }

        if (!code || !state) {
          setStatus('error')
          setMessage('Invalid callback parameters')
          return
        }

        // Handle LinkedIn OAuth callback
        const linkedinProfile = await linkedinOAuth.handleCallback(code, state)
        
        // Sync profile with user account
        await linkedinOAuth.syncProfile(linkedinProfile)
        
        setStatus('success')
        setMessage('LinkedIn profile connected successfully!')
        toast.success('LinkedIn profile connected successfully!')
        
        // Redirect to profile page after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/profile')
        }, 2000)

      } catch (error) {
        console.error('LinkedIn callback error:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Failed to connect LinkedIn profile')
        toast.error('Failed to connect LinkedIn profile')
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <Card className="glass-card border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {status === 'loading' && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
              {status === 'success' && <CheckCircle className="h-8 w-8 text-green-500" />}
              {status === 'error' && <XCircle className="h-8 w-8 text-red-500" />}
            </div>
            <CardTitle>
              {status === 'loading' && 'Connecting LinkedIn Profile...'}
              {status === 'success' && 'LinkedIn Connected!'}
              {status === 'error' && 'Connection Failed'}
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Please wait while we sync your LinkedIn profile'}
              {status === 'success' && 'Your LinkedIn profile has been successfully connected'}
              {status === 'error' && message}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {status === 'success' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Redirecting you to your profile page...
                </p>
                <Button onClick={() => router.push('/dashboard/profile')} className="w-full">
                  Go to Profile
                </Button>
              </div>
            )}
            {status === 'error' && (
              <div className="space-y-4">
                <Button onClick={() => router.push('/dashboard/profile')} variant="outline" className="w-full">
                  Go to Profile
                </Button>
                <Button onClick={() => router.push('/dashboard/profile')} className="w-full">
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


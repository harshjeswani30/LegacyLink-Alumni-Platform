"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Linkedin, CheckCircle, AlertCircle } from "lucide-react"
import { linkedinOAuth } from "@/lib/linkedin-oauth"
import { toast } from "sonner"
import type { Profile } from "@/lib/types"

interface LinkedInConnectionProps {
  profile: Profile
  onProfileUpdate?: () => void
}

export function LinkedInConnection({ profile, onProfileUpdate }: LinkedInConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const isLinkedInConnected = !!profile.linkedin_url
  const isLinkedInConfigured = linkedinOAuth.isConfigured()

  const handleConnectLinkedIn = async () => {
    setIsConnecting(true)
    try {
      if (!linkedinOAuth.isConfigured()) {
        toast.error('LinkedIn integration is not configured yet. Please contact the administrator.')
        setIsConnecting(false)
        return
      }
      
      const authUrl = linkedinOAuth.getAuthUrl()
      window.location.href = authUrl
    } catch (error) {
      console.error('Error initiating LinkedIn connection:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect LinkedIn'
      toast.error(errorMessage)
      setIsConnecting(false)
    }
  }

  const handleDisconnectLinkedIn = async () => {
    // In a real implementation, you'd call an API to remove the LinkedIn connection
    toast.success('LinkedIn disconnected successfully')
    onProfileUpdate?.()
  }

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Linkedin className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">LinkedIn Integration</CardTitle>
          </div>
          {isLinkedInConnected && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Connected</span>
            </Badge>
          )}
        </div>
        <CardDescription>
          Connect your LinkedIn profile to enhance your alumni network experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLinkedInConnected ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Your LinkedIn profile is connected</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(profile.linkedin_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View LinkedIn Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnectLinkedIn}
              >
                Disconnect
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>Connected benefits:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Enhanced profile with LinkedIn data</li>
                <li>Better mentorship matching</li>
                <li>Automatic skill extraction</li>
                <li>Professional network insights</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!isLinkedInConfigured ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>LinkedIn integration not configured</span>
                </div>
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                  <p className="font-medium mb-2">Configuration needed:</p>
                  <p>The LinkedIn OAuth integration requires environment variables to be set up. Please contact your administrator to configure:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><code>NEXT_PUBLIC_LINKEDIN_CLIENT_ID</code></li>
                    <li>LinkedIn OAuth callback setup</li>
                  </ul>
                </div>
                <Button
                  disabled={true}
                  className="w-full"
                  variant="outline"
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn Integration Disabled
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>LinkedIn profile not connected</span>
                </div>

                <Button
                  onClick={handleConnectLinkedIn}
                  disabled={isConnecting}
                  className="w-full"
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  {isConnecting ? 'Connecting...' : 'Connect LinkedIn Profile'}
                </Button>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <p>Connecting your LinkedIn profile will:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Import your professional information</li>
                <li>Extract skills automatically</li>
                <li>Improve mentorship matching</li>
                <li>Verify your professional background</li>
                <li>Enhance your alumni network presence</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


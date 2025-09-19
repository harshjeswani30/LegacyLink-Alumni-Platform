"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, ExternalLink, Info } from "lucide-react"
import { linkedinOAuth } from "@/lib/linkedin-oauth"

export default function LinkedInDebugPage() {
  const [config, setConfig] = useState<any>(null)
  const [authUrl, setAuthUrl] = useState("")

  useEffect(() => {
    // Get configuration info
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID
    const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || window.location.origin
    const redirectUri = `${baseUrl}/auth/linkedin/callback`
    
    setConfig({
      clientId: clientId || "NOT_SET",
      baseUrl,
      redirectUri,
      isConfigured: linkedinOAuth.isConfigured(),
      currentOrigin: window.location.origin
    })

    // Generate auth URL if configured
    if (linkedinOAuth.isConfigured()) {
      try {
        const url = linkedinOAuth.getAuthUrl()
        setAuthUrl(url)
      } catch (error) {
        console.error("Failed to generate auth URL:", error)
      }
    }
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!config) return <div>Loading...</div>

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>LinkedIn OAuth Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This page shows the exact redirect URI that your app is using. 
              Make sure this matches exactly what's configured in your LinkedIn Developer Console.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Current Configuration</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Client ID:</span>
                  <span className="font-mono">{config.clientId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Base URL (from env):</span>
                  <span className="font-mono">{config.baseUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Origin:</span>
                  <span className="font-mono">{config.currentOrigin}</span>
                </div>
                <div className="flex justify-between">
                  <span>Is Configured:</span>
                  <span className={config.isConfigured ? "text-green-600" : "text-red-600"}>
                    {config.isConfigured ? "✅ Yes" : "❌ No"}
                  </span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Redirect URI</h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 p-2 rounded text-sm">
                  {config.redirectUri}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(config.redirectUri)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ⚠️ This exact URL must be added to your LinkedIn app's "Authorized redirect URLs"
              </p>
            </div>

            {authUrl && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Generated Auth URL</h3>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 p-2 rounded text-sm break-all">
                    {authUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(authUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2">
                  <Button
                    size="sm"
                    onClick={() => window.open(authUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Test Auth URL
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>To fix the redirect_uri error:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Go to <a href="https://developer.linkedin.com/" target="_blank" className="underline">LinkedIn Developer Console</a></li>
                <li>Open your app and go to the "Auth" tab</li>
                <li>In "Authorized redirect URLs for your app", add: <code className="bg-blue-100 px-1 rounded">{config.redirectUri}</code></li>
                <li>Save the changes</li>
                <li>Try the LinkedIn connection again</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
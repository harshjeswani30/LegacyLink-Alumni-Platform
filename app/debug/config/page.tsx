"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from "lucide-react"
import { linkedinOAuth } from "@/lib/linkedin-oauth"

export default function ConfigurationStatusPage() {
  const linkedinConfigured = linkedinOAuth.isConfigured()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const configurations = [
    {
      name: "Supabase URL",
      configured: !!supabaseUrl,
      value: supabaseUrl ? "✓ Configured" : "❌ Missing",
      description: "Database connection URL"
    },
    {
      name: "Supabase Anon Key", 
      configured: !!supabaseKey,
      value: supabaseKey ? "✓ Configured" : "❌ Missing",
      description: "Public API key for Supabase"
    },
    {
      name: "LinkedIn Client ID",
      configured: linkedinConfigured,
      value: linkedinConfigured ? "✓ Configured" : "❌ Missing",
      description: "Required for LinkedIn OAuth integration"
    }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Configuration Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {configurations.map((config) => (
              <div key={config.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {config.configured ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium">{config.name}</div>
                    <div className="text-sm text-muted-foreground">{config.description}</div>
                  </div>
                </div>
                <Badge variant={config.configured ? "default" : "destructive"}>
                  {config.value}
                </Badge>
              </div>
            ))}
          </div>

          {!linkedinConfigured && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">LinkedIn Integration Not Configured</p>
                  <p>To enable LinkedIn features:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Create a LinkedIn app at the LinkedIn Developer Portal</li>
                    <li>Add <code>NEXT_PUBLIC_LINKEDIN_CLIENT_ID</code> to your .env.local file</li>
                    <li>Add <code>LINKEDIN_CLIENT_SECRET</code> to your .env.local file</li>
                    <li>Restart your development server</li>
                  </ol>
                  <a 
                    href="https://developer.linkedin.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline text-sm"
                  >
                    LinkedIn Developer Portal <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Current LinkedIn Integration Status:</p>
              <p className="text-sm">
                The LinkedIn connection feature is currently <strong>disabled</strong> because the required environment variables are not configured. 
                Users will see an informative message explaining that LinkedIn integration is not available.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Fix Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">To fix LinkedIn integration:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open your <code>.env.local</code> file</li>
                <li>Add your LinkedIn Client ID:
                  <pre className="bg-background p-2 rounded mt-1 text-xs">
                    NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_client_id_here
                  </pre>
                </li>
                <li>Add your LinkedIn Client Secret:
                  <pre className="bg-background p-2 rounded mt-1 text-xs">
                    LINKEDIN_CLIENT_SECRET=your_client_secret_here
                  </pre>
                </li>
                <li>Restart your development server with <code>pnpm dev</code></li>
              </ol>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Need detailed setup instructions? Check the <code>docs/LINKEDIN_SETUP.md</code> file for a complete guide.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AddUniversityPage() {
  const [name, setName] = useState("")
  const [domain, setDomain] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [approved, setApproved] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("universities").insert({
        name,
        domain,
        logo_url: logoUrl || null,
        approved,
      })

      if (error) throw error

      router.push("/dashboard/universities")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/universities">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add University</h1>
          <p className="text-muted-foreground">Register a new university on the platform</p>
        </div>
      </div>

      <Card className="glass-card border-border/50 max-w-2xl">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-primary" />
            <CardTitle>University Information</CardTitle>
          </div>
          <CardDescription>Enter the details for the new university</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">University Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Stanford University"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="domain">Email Domain</Label>
                <Input
                  id="domain"
                  type="text"
                  placeholder="stanford.edu"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground">
                  Students and alumni will use this domain to verify their affiliation
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="approved" checked={approved} onCheckedChange={setApproved} />
                <Label htmlFor="approved">Approve immediately</Label>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex space-x-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add University"}
              </Button>
              <Link href="/dashboard/universities">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

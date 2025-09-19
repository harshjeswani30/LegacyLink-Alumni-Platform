"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminCreateUniversity() {
  const [name, setName] = useState("")
  const [domain, setDomain] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/universities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domain }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      setMessage("University created and you are now its admin.")
    } catch (e: any) {
      setMessage(e.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create University</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm">University Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Chandigarh University" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Email Domain</label>
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="cuchd.in" required />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create & Become Admin"}
          </Button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </form>
      </CardContent>
    </Card>
  )
}



"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Search, X } from "lucide-react"

export function AlumniFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [skills, setSkills] = useState(searchParams.get("skills") || "")
  const [graduationYear, setGraduationYear] = useState(searchParams.get("graduation_year") || "")
  const [verified, setVerified] = useState(searchParams.get("verified") || "")

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (skills) params.set("skills", skills)
    if (graduationYear) params.set("graduation_year", graduationYear)
    if (verified) params.set("verified", verified)

    router.push(`/dashboard/alumni?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch("")
    setSkills("")
    setGraduationYear("")
    setVerified("")
    router.push("/dashboard/alumni")
  }

  const hasFilters = search || skills || graduationYear || verified

  // Generate graduation years (last 50 years)
  const currentYear = new Date().getFullYear()
  const graduationYears = Array.from({ length: 50 }, (_, i) => currentYear - i)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Search by name</label>
          <Input
            placeholder="Enter alumni name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Skills</label>
          <Input
            placeholder="e.g. Software Engineering"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Graduation Year</label>
          <Select value={graduationYear} onValueChange={setGraduationYear}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {graduationYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Verification Status</label>
          <Select value={verified} onValueChange={setVerified}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="All alumni" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All alumni</SelectItem>
              <SelectItem value="true">Verified only</SelectItem>
              <SelectItem value="false">Pending verification</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button onClick={applyFilters}>
          <Search className="mr-2 h-4 w-4" />
          Apply Filters
        </Button>
        {hasFilters && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  )
}

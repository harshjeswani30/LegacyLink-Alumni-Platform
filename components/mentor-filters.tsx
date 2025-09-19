"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Filter } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

interface MentorFiltersProps {
  skills: string[]
  companies: string[]
  graduationYears: number[]
  currentFilters: {
    skill?: string
    company?: string
    graduation_year?: string
  }
}

export function MentorFilters({ skills, companies, graduationYears, currentFilters }: MentorFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    router.push(`/dashboard/mentorship/discover?${params.toString()}`)
  }

  const clearAllFilters = () => {
    router.push("/dashboard/mentorship/discover")
  }

  const activeFiltersCount = Object.values(currentFilters).filter(Boolean).length

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle>Filters</CardTitle>
            {activeFiltersCount > 0 && <Badge variant="secondary">{activeFiltersCount} active</Badge>}
          </div>
          <div className="flex space-x-2">
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? "Hide" : "Show"} Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Skill</label>
              <Select
                value={currentFilters.skill || "allSkills"}
                onValueChange={(value) => updateFilter("skill", value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allSkills">All Skills</SelectItem>
                  {skills.map((skill) => (
                    <SelectItem key={skill} value={skill}>
                      {skill}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Select
                value={currentFilters.company || "allCompanies"}
                onValueChange={(value) => updateFilter("company", value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allCompanies">All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Graduation Year</label>
              <Select
                value={currentFilters.graduation_year || "allYears"}
                onValueChange={(value) => updateFilter("graduation_year", value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allYears">All Years</SelectItem>
                  {graduationYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
              {currentFilters.skill && currentFilters.skill !== "allSkills" && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <span>Skill: {currentFilters.skill}</span>
                  <button onClick={() => updateFilter("skill", null)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {currentFilters.company && currentFilters.company !== "allCompanies" && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <span>Company: {currentFilters.company}</span>
                  <button onClick={() => updateFilter("company", null)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {currentFilters.graduation_year && currentFilters.graduation_year !== "allYears" && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <span>Year: {currentFilters.graduation_year}</span>
                  <button onClick={() => updateFilter("graduation_year", null)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  MessageCircle,
  UserCheck,
  Sparkles,
  Target,
  TrendingUp
} from "lucide-react"
import type { Profile, AlumniProfile } from "@/lib/types"
type MentorshipMatch = { mentor: any; score: number; reasons: string[] }
type MentorshipPreferences = {
  skills?: string[]
  industries?: string[]
  experience_level?: 'entry' | 'mid' | 'senior' | 'executive'
  location?: string
  graduation_year_range?: [number, number]
}
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface MentorshipDiscoveryProps {
  profile: Profile & { alumni_profile?: AlumniProfile; university?: any }
}

export function MentorshipDiscovery({ profile }: MentorshipDiscoveryProps) {
  const [matches, setMatches] = useState<MentorshipMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [preferences, setPreferences] = useState<MentorshipPreferences>({
    skills: [],
    industries: [],
    experience_level: 'mid'
  })
  const [selectedTab, setSelectedTab] = useState("ai-matches")
  const router = useRouter()

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/mentorship/recommendations', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setMatches(data.matches || [])
    } catch (error) {
      console.error("Error loading mentorship matches:", error)
      toast.error("Failed to load mentorship recommendations")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    // For now reuse recommendations and let client-side filter apply
    await loadMatches()
  }

  const handleRequestMentorship = async (mentorId: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase.from("mentorships").insert({
        mentor_id: mentorId,
        mentee_id: profile.id,
        status: "pending",
        message: `Hi! I'd love to connect and learn from your experience.`
      })

      if (error) throw error

      toast.success("Mentorship request sent!")
      router.push("/dashboard/mentorship")
    } catch (error) {
      console.error("Error sending mentorship request:", error)
      toast.error("Failed to send mentorship request")
    }
  }

  const filteredMatches = matches.filter(match =>
    match.mentor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.mentor.alumni_profile?.current_company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.mentor.alumni_profile?.current_job?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* AI-Powered Matching Header */}
      <Card className="glass-card border-border/50 bg-gradient-to-r from-primary/10 to-blue-500/10">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">AI-Powered Mentor Matching</CardTitle>
          </div>
          <CardDescription>
            Our intelligent algorithm analyzes your profile, skills, and career goals to find the perfect mentor matches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm">Skill-based matching</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Experience level alignment</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Location preferences</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Find Your Perfect Mentor</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search mentors</Label>
              <Input
                id="search"
                placeholder="Search by name, company, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Experience Level</Label>
              <Select
                value={preferences.experience_level}
                onValueChange={(value: any) => setPreferences(prev => ({ ...prev, experience_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                  <SelectItem value="mid">Mid Level (3-7 years)</SelectItem>
                  <SelectItem value="senior">Senior Level (8-15 years)</SelectItem>
                  <SelectItem value="executive">Executive Level (15+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Searching..." : "Search Mentors"}
            </Button>
            <Button variant="outline" onClick={loadMatches}>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="ai-matches">AI Matches ({matches.length})</TabsTrigger>
          <TabsTrigger value="all-mentors">All Mentors</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-matches" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="glass-card border-border/50">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-muted rounded-full" />
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-24" />
                          <div className="h-3 bg-muted rounded w-32" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-3/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMatches.length === 0 ? (
            <Card className="glass-card border-border/50">
              <CardContent className="p-8 text-center">
                <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No mentors found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or check back later for new mentors.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMatches.map((match) => (
                <MentorCard
                  key={match.mentor.id}
                  match={match}
                  onRequestMentorship={handleRequestMentorship}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-mentors">
          <Card className="glass-card border-border/50">
            <CardContent className="p-8 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Browse All Mentors</h3>
              <p className="text-muted-foreground mb-4">
                View all available mentors from your university
              </p>
              <Button onClick={() => router.push("/dashboard/alumni")}>
                View Alumni Directory
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface MentorCardProps {
  match: MentorshipMatch
  onRequestMentorship: (mentorId: string) => void
}

function MentorCard({ match, onRequestMentorship }: MentorCardProps) {
  const { mentor, score, reasons } = match
  const compatibilityPercentage = Math.round(score * 100)

  return (
    <Card className="glass-card border-border/50 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={mentor.alumni_profile?.photo_url} />
              <AvatarFallback>
                {mentor.full_name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{mentor.full_name}</CardTitle>
              <CardDescription className="flex items-center space-x-1">
                <Briefcase className="h-3 w-3" />
                <span>{mentor.alumni_profile?.current_job || "Professional"}</span>
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{compatibilityPercentage}%</span>
            </div>
            <div className="text-xs text-muted-foreground">Match</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Compatibility Score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Compatibility</span>
            <span>{compatibilityPercentage}%</span>
          </div>
          <Progress value={compatibilityPercentage} className="h-2" />
        </div>

        {/* Match Reasons */}
        {reasons.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Why this match?</div>
            <div className="space-y-1">
              {reasons.slice(0, 2).map((reason, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mentor Details */}
        <div className="space-y-2 text-sm">
          {mentor.alumni_profile?.current_company && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{mentor.alumni_profile.current_company}</span>
            </div>
          )}
          {mentor.alumni_profile?.graduation_year && (
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-3 w-3 text-muted-foreground" />
              <span>Class of {mentor.alumni_profile.graduation_year}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {mentor.alumni_profile?.skills && mentor.alumni_profile.skills.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Skills</div>
            <div className="flex flex-wrap gap-1">
              {mentor.alumni_profile.skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {mentor.alumni_profile.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{mentor.alumni_profile.skills.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={() => onRequestMentorship(mentor.id)}
          className="w-full"
          size="sm"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Request Mentorship
        </Button>
      </CardContent>
    </Card>
  )
}


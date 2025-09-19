"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { User, Briefcase, GraduationCap, Award, X } from "lucide-react"
import type { Profile } from "@/lib/types"

interface ProfileFormProps {
  profile: Profile & {
    alumni_profile?: {
      skills?: string[]
      current_job?: string
      current_company?: string
      achievements?: string
      photo_url?: string
      graduation_year?: number
      degree?: string
      bio?: string
      available_for_mentoring: boolean
    }
  }
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile.full_name)
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || "")
  const [currentJob, setCurrentJob] = useState(profile.alumni_profile?.current_job || "")
  const [currentCompany, setCurrentCompany] = useState(profile.alumni_profile?.current_company || "")
  const [graduationYear, setGraduationYear] = useState(profile.alumni_profile?.graduation_year?.toString() || "")
  const [degree, setDegree] = useState(profile.alumni_profile?.degree || "")
  const [bio, setBio] = useState(profile.alumni_profile?.bio || "")
  const [achievements, setAchievements] = useState(profile.alumni_profile?.achievements || "")
  const [availableForMentoring, setAvailableForMentoring] = useState(
    profile.alumni_profile?.available_for_mentoring || false,
  )
  const [skills, setSkills] = useState<string[]>(profile.alumni_profile?.skills || [])
  const [newSkill, setNewSkill] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Update basic profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          linkedin_url: linkedinUrl || null,
        })
        .eq("id", profile.id)

      if (profileError) throw profileError

      // Update or create alumni profile (only for alumni)
      if (profile.role === "alumni") {
        const alumniProfileData = {
          user_id: profile.id,
          skills,
          current_job: currentJob || null,
          current_company: currentCompany || null,
          achievements: achievements || null,
          graduation_year: graduationYear ? Number.parseInt(graduationYear) : null,
          degree: degree || null,
          bio: bio || null,
          available_for_mentoring: availableForMentoring,
        }

        const { error: alumniError } = await supabase
          .from("alumni_profiles")
          .upsert(alumniProfileData, { onConflict: "user_id" })

        if (alumniError) throw alumniError
      }

      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Basic Information</CardTitle>
          </div>
          <CardDescription>Your personal details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.alumni_profile?.photo_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">{fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="linkedinUrl">LinkedIn Profile (Optional)</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Information (Alumni only) */}
      {profile.role === "alumni" && (
        <>
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <CardTitle>Professional Information</CardTitle>
              </div>
              <CardDescription>Your current job and career details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="currentJob">Current Position</Label>
                  <Input
                    id="currentJob"
                    placeholder="Software Engineer"
                    value={currentJob}
                    onChange={(e) => setCurrentJob(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currentCompany">Company</Label>
                  <Input
                    id="currentCompany"
                    placeholder="Google"
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about your professional journey..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-background/50 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <CardTitle>Education</CardTitle>
              </div>
              <CardDescription>Your academic background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="degree">Degree</Label>
                  <Input
                    id="degree"
                    placeholder="Bachelor of Science in Computer Science"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="graduationYear">Graduation Year</Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    placeholder="2020"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle>Skills & Achievements</CardTitle>
              </div>
              <CardDescription>Your expertise and notable accomplishments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Skills</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    className="bg-background/50"
                  />
                  <Button type="button" onClick={addSkill} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="flex items-center space-x-1">
                      <span>{skill}</span>
                      <button type="button" onClick={() => removeSkill(skill)} className="ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="achievements">Achievements & Awards</Label>
                <Textarea
                  id="achievements"
                  placeholder="Notable achievements, awards, publications..."
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  className="bg-background/50 min-h-[100px]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="availableForMentoring"
                  checked={availableForMentoring}
                  onCheckedChange={setAvailableForMentoring}
                />
                <Label htmlFor="availableForMentoring">Available for mentoring students</Label>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex space-x-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Profile"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

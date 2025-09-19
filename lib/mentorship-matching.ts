import { createClient } from "@/lib/supabase/server"
import type { Profile, AlumniProfile } from "@/lib/types"

export interface MentorshipMatch {
  mentor: Profile & { alumni_profile?: AlumniProfile }
  score: number
  reasons: string[]
}

export interface MentorshipPreferences {
  skills?: string[]
  industries?: string[]
  experience_level?: 'entry' | 'mid' | 'senior' | 'executive'
  location?: string
  graduation_year_range?: [number, number]
}

export class MentorshipMatcher {
  private supabase = createClient()
  private embeddingsApi = process.env.NEXT_PUBLIC_HF_EMBEDDINGS_API

  /**
   * Find the best mentor matches for a mentee based on their preferences and profile
   */
  async findMatches(
    menteeId: string,
    preferences: MentorshipPreferences = {},
    limit: number = 10
  ): Promise<MentorshipMatch[]> {
    // Get mentee profile
    const { data: mentee } = await this.supabase
      .from("profiles")
      .select("*, alumni_profile:alumni_profiles(*)")
      .eq("id", menteeId)
      .single()

    if (!mentee) {
      throw new Error("Mentee not found")
    }

    // Get all available mentors (alumni who are available for mentoring)
    const { data: mentors } = await this.supabase
      .from("profiles")
      .select(`
        *,
        alumni_profile:alumni_profiles(*),
        university:universities(*)
      `)
      .eq("role", "alumni")
      .eq("alumni_profiles.available_for_mentoring", true)
      .neq("id", menteeId) // Exclude self
      .eq("university_id", mentee.university_id) // Same university only

    if (!mentors || mentors.length === 0) {
      return []
    }

    // Calculate match scores for each mentor
    const matches: MentorshipMatch[] = []

    for (const mentor of mentors) {
      const score = await this.calculateMatchScore(mentee, mentor, preferences)
      if (score.score > 0.3) { // Only include matches with >30% compatibility
        matches.push({
          mentor: mentor as Profile & { alumni_profile?: AlumniProfile },
          score: score.score,
          reasons: score.reasons
        })
      }
    }

    // Sort by score (highest first) and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  /**
   * Calculate compatibility score between mentee and mentor
   */
  private async calculateMatchScore(
    mentee: any,
    mentor: any,
    preferences: MentorshipPreferences
  ): Promise<{ score: number; reasons: string[] }> {
    let totalScore = 0
    let maxScore = 0
    const reasons: string[] = []

    // 1. Skills matching (40% weight) with optional embeddings bonus
    const skillsScore = this.calculateSkillsMatch(
      mentee.alumni_profile?.skills || [],
      mentor.alumni_profile?.skills || [],
      preferences.skills || []
    )
    totalScore += skillsScore.score * 0.4
    maxScore += 0.4
    if (skillsScore.score > 0.5) {
      reasons.push(`Shared skills: ${skillsScore.matchingSkills.join(", ")}`)
    }

    // Optional: semantic bonus using embeddings if configured
    try {
      if (this.embeddingsApi && skillsScore.matchingSkills.length === 0) {
        const combined = `${(mentee.alumni_profile?.bio || "").slice(0, 400)}\n${(mentor.alumni_profile?.bio || "").slice(0, 400)}`
        const sim = await this.semanticSimilarity(combined)
        if (sim > 0.6) {
          totalScore += 0.1
          maxScore += 0.1
          reasons.push("Semantic profile similarity")
        }
      }
    } catch {}

    // 2. Industry matching (25% weight)
    const industryScore = this.calculateIndustryMatch(
      mentee.alumni_profile?.current_company,
      mentor.alumni_profile?.current_company,
      preferences.industries || []
    )
    totalScore += industryScore * 0.25
    maxScore += 0.25
    if (industryScore > 0.5) {
      reasons.push("Similar industry experience")
    }

    // 3. Experience level matching (20% weight)
    const experienceScore = this.calculateExperienceMatch(
      mentee.alumni_profile?.graduation_year,
      mentor.alumni_profile?.graduation_year,
      preferences.experience_level
    )
    totalScore += experienceScore * 0.2
    maxScore += 0.2
    if (experienceScore > 0.5) {
      reasons.push("Appropriate experience level")
    }

    // 4. Location matching (10% weight)
    const locationScore = this.calculateLocationMatch(
      mentee.alumni_profile?.current_company,
      mentor.alumni_profile?.current_company,
      preferences.location
    )
    totalScore += locationScore * 0.1
    maxScore += 0.1
    if (locationScore > 0.5) {
      reasons.push("Same or nearby location")
    }

    // 5. Graduation year proximity (5% weight)
    const yearScore = this.calculateYearProximity(
      mentee.alumni_profile?.graduation_year,
      mentor.alumni_profile?.graduation_year,
      preferences.graduation_year_range
    )
    totalScore += yearScore * 0.05
    maxScore += 0.05
    if (yearScore > 0.5) {
      reasons.push("Similar graduation timeline")
    }

    const finalScore = maxScore > 0 ? totalScore / maxScore : 0

    return {
      score: Math.min(finalScore, 1), // Cap at 1.0
      reasons
    }
  }

  private async semanticSimilarity(textPair: string): Promise<number> {
    try {
      const res = await fetch(this.embeddingsApi as string, { method: "POST", body: textPair })
      if (!res.ok) return 0
      const data = await res.json()
      return typeof data.similarity === "number" ? data.similarity : 0
    } catch {
      return 0
    }
  }

  private calculateSkillsMatch(
    menteeSkills: string[],
    mentorSkills: string[],
    preferredSkills: string[]
  ): { score: number; matchingSkills: string[] } {
    if (menteeSkills.length === 0 || mentorSkills.length === 0) {
      return { score: 0, matchingSkills: [] }
    }

    const matchingSkills = menteeSkills.filter(skill =>
      mentorSkills.some(mentorSkill =>
        mentorSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(mentorSkill.toLowerCase())
      )
    )

    // Bonus for preferred skills
    const preferredMatches = matchingSkills.filter(skill =>
      preferredSkills.some(pref =>
        skill.toLowerCase().includes(pref.toLowerCase())
      )
    )

    const baseScore = matchingSkills.length / Math.max(menteeSkills.length, mentorSkills.length)
    const bonusScore = preferredMatches.length * 0.2

    return {
      score: Math.min(baseScore + bonusScore, 1),
      matchingSkills
    }
  }

  private calculateIndustryMatch(
    menteeCompany: string | undefined,
    mentorCompany: string | undefined,
    preferredIndustries: string[]
  ): number {
    if (!menteeCompany || !mentorCompany) return 0

    // Simple industry matching based on company names
    // In a real implementation, you'd use a more sophisticated industry classification
    const industries = [
      'technology', 'software', 'tech', 'IT',
      'finance', 'banking', 'investment',
      'healthcare', 'medical', 'pharma',
      'education', 'edtech',
      'consulting', 'advisory',
      'manufacturing', 'automotive',
      'retail', 'ecommerce', 'commerce'
    ]

    const menteeIndustry = industries.find(ind =>
      menteeCompany.toLowerCase().includes(ind)
    )
    const mentorIndustry = industries.find(ind =>
      mentorCompany.toLowerCase().includes(ind)
    )

    if (menteeIndustry && mentorIndustry) {
      if (menteeIndustry === mentorIndustry) return 1.0
      if (preferredIndustries.includes(menteeIndustry)) return 0.8
      return 0.5
    }

    return 0.3 // Default score for unknown industries
  }

  private calculateExperienceMatch(
    menteeGraduationYear: number | undefined,
    mentorGraduationYear: number | undefined,
    preferredLevel: string | undefined
  ): number {
    if (!menteeGraduationYear || !mentorGraduationYear) return 0.5

    const currentYear = new Date().getFullYear()
    const menteeExperience = currentYear - menteeGraduationYear
    const mentorExperience = currentYear - mentorGraduationYear

    const experienceDiff = Math.abs(mentorExperience - menteeExperience)

    // Ideal: mentor has 3-8 years more experience
    if (experienceDiff >= 3 && experienceDiff <= 8) return 1.0
    if (experienceDiff >= 1 && experienceDiff <= 12) return 0.8
    if (experienceDiff >= 0 && experienceDiff <= 15) return 0.6

    return 0.3
  }

  private calculateLocationMatch(
    menteeCompany: string | undefined,
    mentorCompany: string | undefined,
    preferredLocation: string | undefined
  ): number {
    // Simple location matching - in a real app, you'd use geolocation APIs
    if (!menteeCompany || !mentorCompany) return 0.5

    const majorCities = [
      'mumbai', 'delhi', 'bangalore', 'chennai', 'hyderabad', 'pune',
      'kolkata', 'ahmedabad', 'jaipur', 'surat', 'lucknow', 'kanpur'
    ]

    const menteeCity = majorCities.find(city =>
      menteeCompany.toLowerCase().includes(city)
    )
    const mentorCity = majorCities.find(city =>
      mentorCompany.toLowerCase().includes(city)
    )

    if (menteeCity && mentorCity) {
      if (menteeCity === mentorCity) return 1.0
      return 0.6 // Same country, different city
    }

    return 0.5 // Unknown locations
  }

  private calculateYearProximity(
    menteeYear: number | undefined,
    mentorYear: number | undefined,
    preferredRange: [number, number] | undefined
  ): number {
    if (!menteeYear || !mentorYear) return 0.5

    const yearDiff = Math.abs(mentorYear - menteeYear)

    if (preferredRange) {
      const [min, max] = preferredRange
      if (yearDiff >= min && yearDiff <= max) return 1.0
    }

    // Ideal: 2-5 years difference
    if (yearDiff >= 2 && yearDiff <= 5) return 1.0
    if (yearDiff >= 1 && yearDiff <= 8) return 0.8
    if (yearDiff >= 0 && yearDiff <= 10) return 0.6

    return 0.3
  }

  /**
   * Get mentorship recommendations for a user
   */
  async getRecommendations(userId: string): Promise<MentorshipMatch[]> {
    const preferences: MentorshipPreferences = {
      skills: [],
      industries: [],
      experience_level: 'mid'
    }

    return this.findMatches(userId, preferences, 5)
  }
}

export const mentorshipMatcher = new MentorshipMatcher()


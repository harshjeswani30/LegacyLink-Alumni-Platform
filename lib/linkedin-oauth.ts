import { createClient } from "@/lib/supabase/client"

export interface LinkedInProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  profilePicture?: string
  headline?: string
  industry?: string
  location?: string
  summary?: string
  positions?: LinkedInPosition[]
  educations?: LinkedInEducation[]
}

export interface LinkedInPosition {
  title: string
  companyName: string
  location?: string
  startDate?: string
  endDate?: string
  isCurrent: boolean
  description?: string
}

export interface LinkedInEducation {
  schoolName: string
  degreeName?: string
  fieldOfStudy?: string
  startDate?: string
  endDate?: string
}

export class LinkedInOAuthService {
  private clientId: string
  private redirectUri: string
  private scope: string

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || ""
    // Use environment variable for consistent redirect URI, fallback for SSR
    const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000'
    this.redirectUri = `${baseUrl}/auth/linkedin/callback`
    this.scope = "r_liteprofile r_emailaddress"
  }

  /**
   * Check if LinkedIn OAuth is properly configured
   */
  isConfigured(): boolean {
    return !!this.clientId && this.clientId.trim() !== ""
  }

  /**
   * Generate LinkedIn OAuth URL
   */
  getAuthUrl(): string {
    if (!this.isConfigured()) {
      throw new Error("LinkedIn OAuth is not configured. Please set NEXT_PUBLIC_LINKEDIN_CLIENT_ID in your environment variables.")
    }

    const state = Math.random().toString(36).substring(7)
    localStorage.setItem('linkedin_oauth_state', state)
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: this.scope
    })

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  }

  /**
   * Handle LinkedIn OAuth callback
   */
  async handleCallback(code: string, state: string): Promise<LinkedInProfile> {
    // Verify state parameter
    const storedState = localStorage.getItem('linkedin_oauth_state')
    if (state !== storedState) {
      throw new Error('Invalid state parameter')
    }

    // Exchange code for access token
    const accessToken = await this.exchangeCodeForToken(code)
    
    // Get user profile from LinkedIn
    const profile = await this.getLinkedInProfile(accessToken)
    
    // Clean up
    localStorage.removeItem('linkedin_oauth_state')
    
    return profile
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch('/api/auth/linkedin/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, redirect_uri: this.redirectUri })
    })

    if (!response.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const data = await response.json()
    return data.access_token
  }

  /**
   * Get LinkedIn profile data
   */
  private async getLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
    // Get basic profile
    const profileResponse = await fetch('/api/auth/linkedin/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken })
    })

    if (!profileResponse.ok) {
      throw new Error('Failed to get LinkedIn profile')
    }

    const profileData = await profileResponse.json()
    return profileData
  }

  /**
   * Sync LinkedIn profile with user account
   */
  async syncProfile(linkedinProfile: LinkedInProfile): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Update user profile with LinkedIn data
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        linkedin_url: `https://linkedin.com/in/${linkedinProfile.id}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileError) {
      throw new Error('Failed to update profile with LinkedIn data')
    }

    // Update alumni profile with LinkedIn data
    const alumniProfileData: any = {
      current_job: linkedinProfile.headline,
      current_company: linkedinProfile.positions?.[0]?.companyName,
      bio: linkedinProfile.summary,
      photo_url: linkedinProfile.profilePicture,
      updated_at: new Date().toISOString()
    }

    // Extract skills from headline and summary
    const skills = this.extractSkills(linkedinProfile.headline, linkedinProfile.summary)
    if (skills.length > 0) {
      alumniProfileData.skills = skills
    }

    const { error: alumniError } = await supabase
      .from('alumni_profiles')
      .upsert({
        user_id: user.id,
        ...alumniProfileData
      }, { onConflict: 'user_id' })

    if (alumniError) {
      console.error('Failed to update alumni profile:', alumniError)
      // Don't throw error as this is not critical
    }
  }

  /**
   * Extract skills from LinkedIn profile text
   */
  private extractSkills(headline?: string, summary?: string): string[] {
    const text = `${headline || ''} ${summary || ''}`.toLowerCase()
    const commonSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'typescript',
      'machine learning', 'ai', 'data science', 'analytics', 'sql',
      'project management', 'leadership', 'marketing', 'sales',
      'design', 'ui/ux', 'product management', 'business development',
      'finance', 'consulting', 'engineering', 'software development',
      'mobile development', 'web development', 'cloud computing',
      'devops', 'cybersecurity', 'blockchain', 'agile', 'scrum'
    ]

    return commonSkills.filter(skill => text.includes(skill))
  }

  /**
   * Verify LinkedIn profile matches university domain
   */
  async verifyUniversityMatch(linkedinProfile: LinkedInProfile, universityDomain: string): Promise<boolean> {
    // Check if any education matches the university
    const universityMatch = linkedinProfile.educations?.some(edu =>
      edu.schoolName.toLowerCase().includes(universityDomain.split('.')[0]) ||
      universityDomain.includes(edu.schoolName.toLowerCase().replace(/\s+/g, ''))
    )

    return !!universityMatch
  }
}

export const linkedinOAuth = new LinkedInOAuthService()


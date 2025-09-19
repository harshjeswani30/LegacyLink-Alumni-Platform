export interface University {
  id: string
  name: string
  domain: string
  logo_url?: string
  approved: boolean
  created_at: string
  updated_at: string
}

export interface UniversityWithStats extends University {
  stats: {
    alumni: number
    events: number
    students: number
  }
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: "super_admin" | "university_admin" | "alumni" | "student"
  university_id?: string
  linkedin_url?: string
  verified: boolean
  created_at: string
  updated_at: string
  university?: University
}

export interface AlumniProfile {
  user_id: string
  skills?: string[]
  current_job?: string
  current_company?: string
  achievements?: string
  photo_url?: string
  graduation_year?: number
  degree?: string
  bio?: string
  available_for_mentoring: boolean
  created_at: string
  updated_at: string
  profile?: Profile
}

export interface Event {
  id: string
  university_id: string
  title: string
  description?: string
  event_date: string
  location?: string
  max_attendees?: number
  created_by: string
  created_at: string
  updated_at: string
  university?: University
  creator?: Profile
}

export interface EventRegistration {
  id: string
  event_id: string
  user_id: string
  registered_at: string
  event?: Event
  user?: Profile
}

export interface EventWithDetails extends Event {
  registrationCount: number
  isRegistered: boolean
}

export interface Mentorship {
  id: string
  mentor_id: string
  mentee_id: string
  status: "pending" | "active" | "completed" | "cancelled"
  message?: string
  created_at: string
  updated_at: string
  mentor?: Profile
  mentee?: Profile
}

export interface Donation {
  id: string
  donor_id: string
  university_id: string
  amount: number
  payment_status: "pending" | "completed" | "failed" | "refunded"
  payment_id?: string
  receipt_url?: string
  created_at: string
  updated_at: string
  donor?: Profile
  university?: University
}

export interface Badge {
  id: string
  user_id: string
  title: string
  description?: string
  points: number
  badge_type: "mentorship" | "donation" | "event" | "profile" | "community"
  earned_at: string
}

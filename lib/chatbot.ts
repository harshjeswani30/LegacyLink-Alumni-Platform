import { createClient } from "@/lib/supabase/client"

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: any
}

export interface ChatbotResponse {
  message: string
  suggestions?: string[]
  actions?: ChatbotAction[]
}

export interface ChatbotAction {
  type: 'navigate' | 'search' | 'connect' | 'info'
  label: string
  data: any
}

export class AlumniChatbot {
  private supabase = createClient()
  private context: any = {}

  constructor() {
    this.initializeContext()
  }

  private async initializeContext() {
    // Initialize chatbot context with platform information
    this.context = {
      platform: 'LegacyLink Alumni Platform',
      features: [
        'mentorship matching',
        'event management',
        'alumni directory',
        'donations',
        'career guidance',
        'networking'
      ],
      commonQuestions: [
        'How do I find a mentor?',
        'How can I connect with alumni?',
        'How do I register for events?',
        'How can I make a donation?',
        'How do I update my profile?'
      ]
    }
  }

  /**
   * Process user message and generate response
   */
  async processMessage(message: string, userId?: string): Promise<ChatbotResponse> {
    const lowerMessage = message.toLowerCase()
    
    // Get user context if available
    if (userId) {
      await this.loadUserContext(userId)
    }

    // Intent classification (optionally call Dialogflow if configured)
    const dialogflowProject = process.env.NEXT_PUBLIC_DIALOGFLOW_PROJECT_ID
    let intent = this.classifyIntent(lowerMessage)
    try {
      if (dialogflowProject) {
        // Placeholder: In production, route to a secure server endpoint to query Dialogflow
        // and map intents back to internal labels.
        // Keeping fallback to local classifier if remote unavailable.
      }
    } catch (e) {
      // Fallback silently
    }
    
    // Generate response based on intent
    switch (intent) {
      case 'mentorship':
        return this.handleMentorshipQuery(lowerMessage)
      case 'events':
        return this.handleEventsQuery(lowerMessage)
      case 'alumni':
        return this.handleAlumniQuery(lowerMessage)
      case 'donations':
        return this.handleDonationsQuery(lowerMessage)
      case 'profile':
        return this.handleProfileQuery(lowerMessage)
      case 'greeting':
        return this.handleGreeting()
      case 'help':
        return this.handleHelp()
      case 'career':
        return this.handleCareerQuery(lowerMessage)
      default:
        return this.handleGeneralQuery(lowerMessage)
    }
  }

  private classifyIntent(message: string): string {
    const mentorshipKeywords = ['mentor', 'mentorship', 'guidance', 'advice', 'career help']
    const eventsKeywords = ['event', 'meeting', 'reunion', 'workshop', 'seminar']
    const alumniKeywords = ['alumni', 'graduate', 'network', 'connect', 'directory']
    const donationsKeywords = ['donate', 'donation', 'contribute', 'fund', 'money']
    const profileKeywords = ['profile', 'update', 'edit', 'information', 'bio']
    const careerKeywords = ['job', 'career', 'interview', 'resume', 'employment']
    const greetingKeywords = ['hello', 'hi', 'hey', 'good morning', 'good afternoon']
    const helpKeywords = ['help', 'support', 'assistance', 'how to', 'what is']

    if (mentorshipKeywords.some(keyword => message.includes(keyword))) return 'mentorship'
    if (eventsKeywords.some(keyword => message.includes(keyword))) return 'events'
    if (alumniKeywords.some(keyword => message.includes(keyword))) return 'alumni'
    if (donationsKeywords.some(keyword => message.includes(keyword))) return 'donations'
    if (profileKeywords.some(keyword => message.includes(keyword))) return 'profile'
    if (careerKeywords.some(keyword => message.includes(keyword))) return 'career'
    if (greetingKeywords.some(keyword => message.includes(keyword))) return 'greeting'
    if (helpKeywords.some(keyword => message.includes(keyword))) return 'help'

    return 'general'
  }

  private async loadUserContext(userId: string) {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('*, university:universities(*), alumni_profile:alumni_profiles(*)')
        .eq('id', userId)
        .single()

      if (profile) {
        this.context.user = {
          name: profile.full_name,
          role: profile.role,
          university: profile.university?.name,
          skills: profile.alumni_profile?.skills || [],
          currentJob: profile.alumni_profile?.current_job,
          currentCompany: profile.alumni_profile?.current_company
        }
      }
    } catch (error) {
      console.error('Error loading user context:', error)
    }
  }

  private handleMentorshipQuery(message: string): ChatbotResponse {
    const responses = [
      "I can help you find the perfect mentor! Our AI-powered matching system analyzes your skills, career goals, and interests to connect you with alumni who can guide your journey.",
      "Looking for mentorship? I'll help you discover alumni mentors who match your career aspirations and can provide valuable guidance.",
      "Mentorship is a great way to advance your career! Let me show you how to find and connect with experienced alumni mentors."
    ]

    return {
      message: responses[Math.floor(Math.random() * responses.length)],
      suggestions: [
        "Find mentors in my field",
        "How does mentorship matching work?",
        "View my mentorship requests"
      ],
      actions: [
        {
          type: 'navigate',
          label: 'Find Mentors',
          data: { path: '/dashboard/mentorship/discover' }
        },
        {
          type: 'navigate',
          label: 'My Mentorships',
          data: { path: '/dashboard/mentorship' }
        }
      ]
    }
  }

  private handleEventsQuery(message: string): ChatbotResponse {
    return {
      message: "I can help you discover and register for alumni events! From reunions to professional workshops, there's always something happening in your network.",
      suggestions: [
        "Show upcoming events",
        "How do I create an event?",
        "My event registrations"
      ],
      actions: [
        {
          type: 'navigate',
          label: 'Browse Events',
          data: { path: '/dashboard/events' }
        },
        {
          type: 'navigate',
          label: 'Create Event',
          data: { path: '/dashboard/events/create' }
        }
      ]
    }
  }

  private handleAlumniQuery(message: string): ChatbotResponse {
    return {
      message: "Connect with your alumni network! I can help you find alumni by industry, location, skills, or graduation year.",
      suggestions: [
        "Find alumni in my industry",
        "Search by location",
        "Alumni with specific skills"
      ],
      actions: [
        {
          type: 'navigate',
          label: 'Alumni Directory',
          data: { path: '/dashboard/alumni' }
        }
      ]
    }
  }

  private handleDonationsQuery(message: string): ChatbotResponse {
    return {
      message: "Support your alma mater! I can help you make secure donations to your university and track your giving history.",
      suggestions: [
        "Make a donation",
        "View my donation history",
        "Set up recurring donations"
      ],
      actions: [
        {
          type: 'navigate',
          label: 'Make Donation',
          data: { path: '/dashboard/donations' }
        }
      ]
    }
  }

  private handleProfileQuery(message: string): ChatbotResponse {
    return {
      message: "I can help you manage your profile! Update your information, add skills, connect your LinkedIn, and make your profile more discoverable.",
      suggestions: [
        "Update my profile",
        "Add skills",
        "Connect LinkedIn"
      ],
      actions: [
        {
          type: 'navigate',
          label: 'Edit Profile',
          data: { path: '/dashboard/profile' }
        }
      ]
    }
  }

  private handleCareerQuery(message: string): ChatbotResponse {
    return {
      message: "Career guidance is one of our core features! I can help you find mentors, explore career paths, and connect with alumni in your target industry.",
      suggestions: [
        "Find career mentors",
        "Explore career paths",
        "Industry insights"
      ],
      actions: [
        {
          type: 'navigate',
          label: 'Career Guidance',
          data: { path: '/dashboard/mentorship/discover' }
        }
      ]
    }
  }

  private handleGreeting(): ChatbotResponse {
    const greetings = [
      "Hello! I'm your LegacyLink assistant. How can I help you today?",
      "Hi there! I'm here to help you make the most of your alumni network. What would you like to know?",
      "Welcome! I can help you find mentors, discover events, connect with alumni, and more. What can I do for you?"
    ]

    return {
      message: greetings[Math.floor(Math.random() * greetings.length)],
      suggestions: [
        "Find a mentor",
        "Browse events",
        "Connect with alumni",
        "Make a donation"
      ]
    }
  }

  private handleHelp(): ChatbotResponse {
    return {
      message: "I'm here to help you navigate LegacyLink! I can assist with mentorship matching, event management, alumni connections, donations, and profile management.",
      suggestions: [
        "How to find mentors",
        "How to register for events",
        "How to connect with alumni",
        "How to make donations"
      ]
    }
  }

  private handleGeneralQuery(message: string): ChatbotResponse {
    return {
      message: "I understand you're looking for help. Let me guide you to the right resources. What specific area would you like assistance with?",
      suggestions: [
        "Find a mentor",
        "Browse events",
        "Connect with alumni",
        "Make a donation",
        "Update my profile"
      ]
    }
  }

  /**
   * Get quick suggestions based on user context
   */
  getQuickSuggestions(): string[] {
    if (this.context.user) {
      const { role, skills } = this.context.user
      
      if (role === 'student') {
        return [
          "Find a mentor in my field",
          "Browse upcoming events",
          "Connect with alumni",
          "Get career guidance"
        ]
      } else if (role === 'alumni') {
        return [
          "Become a mentor",
          "Create an event",
          "Make a donation",
          "Update my profile"
        ]
      }
    }

    return [
      "Find a mentor",
      "Browse events",
      "Connect with alumni",
      "Make a donation"
    ]
  }
}

export const alumniChatbot = new AlumniChatbot()


import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json()

    if (!access_token) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    // Get basic profile information
    const profileResponse = await fetch('https://api.linkedin.com/v2/people/~', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    })

    if (!profileResponse.ok) {
      return NextResponse.json({ error: 'Failed to get LinkedIn profile' }, { status: 400 })
    }

    const profileData = await profileResponse.json()

    // Get email address
    const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    })

    let email = ''
    if (emailResponse.ok) {
      const emailData = await emailResponse.json()
      email = emailData.elements?.[0]?.['handle~']?.emailAddress || ''
    }

    // Get profile picture
    const pictureResponse = await fetch('https://api.linkedin.com/v2/people/~:(profilePicture(displayImage~:playableStreams))', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    })

    let profilePicture = ''
    if (pictureResponse.ok) {
      const pictureData = await pictureResponse.json()
      const displayImage = pictureData.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier
      if (displayImage) {
        profilePicture = displayImage
      }
    }

    // Transform LinkedIn data to our format
    const linkedinProfile = {
      id: profileData.id,
      firstName: profileData.firstName?.localized?.en_US || '',
      lastName: profileData.lastName?.localized?.en_US || '',
      email: email,
      profilePicture: profilePicture,
      headline: profileData.headline || '',
      industry: profileData.industry || '',
      location: profileData.location?.name || '',
      summary: profileData.summary || '',
      positions: [], // Would need additional API calls for detailed positions
      educations: [] // Would need additional API calls for education
    }

    return NextResponse.json(linkedinProfile)

  } catch (error) {
    console.error('LinkedIn profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


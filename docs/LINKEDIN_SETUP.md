# LinkedIn Integration Setup Guide

This document explains how to set up LinkedIn OAuth integration for the LegacyLink Alumni Platform.

## Prerequisites

1. LinkedIn Developer Account
2. LinkedIn App created in LinkedIn Developer Portal
3. Access to environment variables

## Step 1: Create LinkedIn App

1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Sign in with your LinkedIn account
3. Click "Create App"
4. Fill in the application details:
   - App name: "LegacyLink Alumni Platform"
   - LinkedIn Page: Your organization's LinkedIn page (or create one)
   - Privacy policy URL: Your privacy policy URL
   - App logo: Upload your app logo

## Step 2: Configure OAuth Settings

1. In your LinkedIn app dashboard, go to "Auth" tab
2. Add these redirect URLs:
   - `http://localhost:3001/auth/linkedin/callback` (for development)
   - `https://yourdomain.com/auth/linkedin/callback` (for production)
3. Request scopes:
   - `r_liteprofile` (to read basic profile info)
   - `r_emailaddress` (to read email address)

## Step 3: Get Client Credentials

1. In the "Auth" tab, copy the "Client ID"
2. Copy the "Client Secret" (you'll need this for the backend API)

## Step 4: Update Environment Variables

Add these variables to your `.env.local` file:

```bash
# LinkedIn OAuth Configuration
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here
```

## Step 5: Backend API Configuration

You'll also need to create the backend API endpoints to handle the OAuth flow:

1. `app/api/auth/linkedin/token/route.ts` - Exchange code for access token
2. `app/api/auth/linkedin/profile/route.ts` - Get user profile from LinkedIn

## Example Environment Variables

```bash
# Copy these to your .env.local file and fill in your actual values
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=77xxxxxxxxxxxxx
LINKEDIN_CLIENT_SECRET=xxxxxxxxxxxxxxxx
```

## Security Notes

- Never expose the Client Secret in client-side code
- Use HTTPS in production
- Validate all OAuth responses on the server side
- Store access tokens securely

## Troubleshooting

### "You need to pass the client_id parameter" Error
- This means `NEXT_PUBLIC_LINKEDIN_CLIENT_ID` is not set in your environment variables
- Check your `.env.local` file and restart your development server

### "Invalid redirect_uri" Error
- Make sure the redirect URL in LinkedIn app matches exactly with your app URL
- Check for trailing slashes and protocol (http vs https)

### "Insufficient permissions" Error
- Make sure you've requested the correct scopes in your LinkedIn app
- Verify the scopes in the OAuth URL match what's configured in LinkedIn

## Current Status

❌ LinkedIn integration is currently **NOT CONFIGURED**
- Missing `NEXT_PUBLIC_LINKEDIN_CLIENT_ID` environment variable
- The integration is disabled until proper configuration is added

To enable LinkedIn integration, follow the steps above and restart your development server.
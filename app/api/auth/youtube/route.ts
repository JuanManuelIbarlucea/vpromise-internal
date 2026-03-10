import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await requireAuth()
    if (!session.talentId) {
      return NextResponse.json({ error: 'Not a talent' }, { status: 403 })
    }

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${process.env.VERCEL_URL}/api/auth/youtube/callback`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      access_type: 'offline',
      prompt: 'consent',
      state: session.talentId,
    })

    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  } catch {
    return NextResponse.redirect(`${process.env.VERCEL_URL}/account?error=auth`)
  }
}

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await requireAuth()
    if (!session.talentId) {
      return NextResponse.json({ error: 'Not a talent' }, { status: 403 })
    }

    const params = new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      redirect_uri: `${process.env.VERCEL_URL}/api/auth/twitch/callback`,
      response_type: 'code',
      scope: '',
      state: session.talentId,
    })

    return NextResponse.redirect(`https://id.twitch.tv/oauth2/authorize?${params}`)
  } catch {
    return NextResponse.redirect(`${process.env.VERCEL_URL}/account?error=auth`)
  }
}

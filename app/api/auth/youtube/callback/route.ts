import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const code = request.nextUrl.searchParams.get('code')
  const talentId = request.nextUrl.searchParams.get('state')

  if (!code || !talentId) {
    return NextResponse.redirect(`${appUrl}/account?error=missing_params`)
  }

  const session = await getSession()
  if (!session || session.talentId !== talentId) {
    return NextResponse.redirect(`${appUrl}/account?error=unauthorized`)
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appUrl}/api/auth/youtube/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${appUrl}/account?error=token_exchange`)
    }

    const tokens = await tokenRes.json()

    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    )

    let youtubeChannelId: string | null = null
    if (channelRes.ok) {
      const channelData = await channelRes.json()
      youtubeChannelId = channelData.items?.[0]?.id || null
    }

    await prisma.talent.update({
      where: { id: talentId },
      data: {
        youtube: youtubeChannelId,
        googleRefreshToken: tokens.refresh_token || undefined,
        googleAccessToken: tokens.access_token,
        googleTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    })

    return NextResponse.redirect(`${appUrl}/account?connected=youtube`)
  } catch (error) {
    console.error('YouTube OAuth callback error:', error)
    return NextResponse.redirect(`${appUrl}/account?error=youtube_failed`)
  }
}

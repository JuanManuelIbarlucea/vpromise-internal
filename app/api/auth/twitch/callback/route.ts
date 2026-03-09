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
    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${appUrl}/api/auth/twitch/callback`,
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${appUrl}/account?error=token_exchange`)
    }

    const tokens = await tokenRes.json()

    const userRes = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(`${appUrl}/account?error=twitch_user`)
    }

    const userData = await userRes.json()
    const twitchLogin = userData.data?.[0]?.login

    if (!twitchLogin) {
      return NextResponse.redirect(`${appUrl}/account?error=twitch_user`)
    }

    await prisma.talent.update({
      where: { id: talentId },
      data: { twitch: twitchLogin },
    })

    return NextResponse.redirect(`${appUrl}/account?connected=twitch`)
  } catch (error) {
    console.error('Twitch OAuth callback error:', error)
    return NextResponse.redirect(`${appUrl}/account?error=twitch_failed`)
  }
}

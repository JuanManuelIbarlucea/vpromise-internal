import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        username: true,
        email: true,
        paypalEmail: true,
        types: true,
        permission: true,
        talent: {
          select: {
            id: true,
            name: true,
            youtube: true,
            twitch: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      paypalEmail: user.paypalEmail,
      types: user.types,
      permission: user.permission,
      name: user.talent?.name || user.manager?.name || null,
      talentId: user.talent?.id || null,
      managerId: user.manager?.id || null,
      youtube: user.talent?.youtube || null,
      twitch: user.talent?.twitch || null,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { name, email, paypalEmail } = body

    await prisma.user.update({
      where: { id: session.id },
      data: {
        ...(email !== undefined && { email: email || null }),
        ...(paypalEmail !== undefined && { paypalEmail: paypalEmail || null }),
      },
    })

    if (name !== undefined && session.talentId) {
      await prisma.talent.update({
        where: { id: session.talentId },
        data: { name },
      })
    }

    if (name !== undefined && session.managerId) {
      await prisma.manager.update({
        where: { id: session.managerId },
        data: { name },
      })
    }

    if (session.talentId && body.disconnectYoutube) {
      await prisma.talent.update({
        where: { id: session.talentId },
        data: {
          youtube: null,
          googleRefreshToken: null,
          googleAccessToken: null,
          googleTokenExpiresAt: null,
        },
      })
    }

    if (session.talentId && body.disconnectTwitch) {
      await prisma.talent.update({
        where: { id: session.talentId },
        data: { twitch: null },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

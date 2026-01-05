import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params

    const talent = await prisma.talent.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, email: true } },
        manager: { select: { id: true, name: true } },
      },
    })

    if (!talent) {
      return NextResponse.json({ error: 'Talent not found' }, { status: 404 })
    }

    return NextResponse.json(talent)
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const { name, managerId, twitch, youtube, tiktok, instagram, twitter, contractDate, annualBudget } = body

    const talent = await prisma.talent.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(managerId !== undefined && { managerId: managerId || null }),
        ...(contractDate !== undefined && { contractDate: new Date(contractDate) }),
        ...(annualBudget !== undefined && { annualBudget }),
        ...(twitch !== undefined && { twitch: twitch || null }),
        ...(youtube !== undefined && { youtube: youtube || null }),
        ...(tiktok !== undefined && { tiktok: tiktok || null }),
        ...(instagram !== undefined && { instagram: instagram || null }),
        ...(twitter !== undefined && { twitter: twitter || null }),
      },
      include: {
        manager: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(talent)
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params

    await prisma.talent.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


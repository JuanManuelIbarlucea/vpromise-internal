import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        permission: true,
        types: true,
        salary: true,
        mustChangePassword: true,
        createdAt: true,
        manager: { select: { id: true, name: true } },
        talent: { select: { id: true, name: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const { username, email, salary, types, permission } = body

    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: { username, NOT: { id } },
      })
      if (existingUser) {
        return NextResponse.json({ error: 'Username already in use' }, { status: 400 })
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(username !== undefined && { username }),
        ...(email !== undefined && { email: email || null }),
        ...(body.paypalEmail !== undefined && { paypalEmail: body.paypalEmail || null }),
        ...(salary !== undefined && { salary }),
        ...(types !== undefined && { types: Array.isArray(types) ? types : [types] }),
        ...(permission !== undefined && { permission }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        permission: true,
        types: true,
        salary: true,
        manager: { select: { id: true, name: true } },
        talent: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    let talentStatus: 'FROZEN' | 'GRADUATED' = 'FROZEN'
    try {
      const body = await request.json()
      if (body.talentStatus === 'GRADUATED') talentStatus = 'GRADUATED'
    } catch {
      // no body is fine, default to FROZEN
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        include: { talent: true, manager: true },
      })

      if (!user) throw new Error('User not found')
      if (user.frozen) throw new Error('User is already frozen')

      if (user.talent) {
        await tx.talent.update({
          where: { id: user.talent.id },
          data: { status: talentStatus },
        })
      }

      if (user.manager) {
        await tx.talent.updateMany({
          where: { managerId: user.manager.id },
          data: { managerId: null },
        })
      }

      await tx.user.update({
        where: { id },
        data: { frozen: true },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (error instanceof Error && error.message === 'User is already frozen') {
      return NextResponse.json({ error: 'User is already frozen' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const newPassword = uuidv4()
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
    })

    return NextResponse.json({ temporaryPassword: newPassword })
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


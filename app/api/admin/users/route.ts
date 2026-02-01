import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    await requireAdmin()

    const users = await prisma.user.findMany({
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
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

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { username, email, types, salary, name } = body

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return NextResponse.json({ error: 'Username already in use' }, { status: 400 })
    }

    const generatedPassword = uuidv4()
    const hashedPassword = await bcrypt.hash(generatedPassword, 12)

    const userTypes = Array.isArray(types) ? types : [types]
    const permission = userTypes.includes('MANAGER') ? 'MANAGER' : 'USER'
    
    const user = await prisma.user.create({
      data: {
        username,
        email: email || null,
        password: hashedPassword,
        types: userTypes,
        permission,
        salary: salary || 0,
        mustChangePassword: true,
      },
    })

    if (userTypes.includes('MANAGER')) {
      await prisma.manager.create({
        data: {
          name,
          userId: user.id,
        },
      })
    }
    if (userTypes.includes('TALENT')) {
      await prisma.talent.create({
        data: {
          name,
          userId: user.id,
        },
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        types: user.types,
        permission: user.permission,
      },
      temporaryPassword: generatedPassword,
    })
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


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

function generateUsername(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].toLowerCase()
  }
  const firstInitial = parts[0].charAt(0).toLowerCase()
  const lastName = parts[parts.length - 1].toLowerCase()
  return `${firstInitial}${lastName}`
}

export async function GET() {
  try {
    await requireAdmin()

    const managers = await prisma.manager.findMany({
      include: {
        user: { select: { id: true, username: true, email: true } },
        talents: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(managers)
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
    const { name, email, salary } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    let username = generateUsername(name)
    
    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      const suffix = Math.floor(Math.random() * 1000)
      username = `${username}${suffix}`
    }

    const generatedPassword = uuidv4()
    const hashedPassword = await bcrypt.hash(generatedPassword, 12)

    const user = await prisma.user.create({
      data: {
        username,
        email: email || null,
        password: hashedPassword,
        type: 'MANAGER',
        permission: 'MANAGER',
        salary: salary ?? 0,
        mustChangePassword: true,
      },
    })

    const manager = await prisma.manager.create({
      data: {
        name,
        userId: user.id,
      },
      include: {
        talents: { select: { id: true, name: true } },
        user: { select: { id: true, username: true } },
      },
    })

    return NextResponse.json({ manager, temporaryPassword: generatedPassword })
  } catch (error) {
    console.error('Create manager error:', error)
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


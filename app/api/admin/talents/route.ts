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

    const talents = await prisma.talent.findMany({
      include: {
        user: { select: { id: true, username: true, email: true } },
        manager: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(talents)
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
    const { name, managerId, twitch, youtube, tiktok, instagram, twitter, email, salary, contractDate, annualBudget } = body

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
        type: 'TALENT',
        permission: 'USER',
        salary: salary ?? 200,
        mustChangePassword: true,
      },
    })

    const talent = await prisma.talent.create({
      data: {
        name,
        userId: user.id,
        managerId: managerId && managerId.length > 0 ? managerId : null,
        contractDate: contractDate ? new Date(contractDate) : new Date('2025-05-01'),
        annualBudget: annualBudget ?? 1000,
        twitch: twitch || null,
        youtube: youtube || null,
        tiktok: tiktok || null,
        instagram: instagram || null,
        twitter: twitter || null,
      },
      include: {
        manager: { select: { id: true, name: true } },
        user: { select: { id: true, username: true } },
      },
    })

    await prisma.expense.create({
      data: {
        description: `Monthly Salary - ${name}`,
        amount: salary ?? 200,
        category: 'Salary',
        isRecurring: true,
        isSalary: true,
        userId: user.id,
        talentId: talent.id,
        date: contractDate ? new Date(contractDate) : new Date('2025-05-01'),
      },
    })

    return NextResponse.json({ talent, temporaryPassword: generatedPassword })
  } catch (error) {
    console.error('Create talent error:', error)
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


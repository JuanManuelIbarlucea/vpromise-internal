import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    let whereClause: Record<string, unknown> = {}

    if (session.permission === 'ADMIN') {
      if (userId) {
        whereClause.userId = userId
      }
    } else {
      whereClause.userId = session.id
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, username: true, types: true } },
        talent: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Fetch expenses error:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { description, amount, date, isRecurring, isSalary, status, talentId } = body

    if (!description || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let resolvedUserId = session.id
    let resolvedTalentId: string | null = talentId || null

    if (talentId) {
      const talent = await prisma.talent.findUnique({
        where: { id: talentId },
        include: { user: true },
      })
      if (talent?.user) {
        resolvedUserId = talent.user.id
      }
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        isRecurring: isRecurring ?? false,
        isSalary: isSalary ?? false,
        status: status ?? 'PENDING',
        userId: resolvedUserId,
        talentId: resolvedTalentId,
      },
      include: {
        user: { select: { id: true, username: true, types: true } },
        talent: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Create expense error:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

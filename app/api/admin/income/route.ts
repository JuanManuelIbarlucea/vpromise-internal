import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()

    const incomes = await prisma.income.findMany({
      include: { talent: { select: { id: true, name: true } } },
      orderBy: { accountingMonth: 'desc' },
    })

    return NextResponse.json(incomes)
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
    const { talentId, accountingMonth, platform, currency, referenceValue, actualValue, actualValueUSD, description } = body

    if (!talentId || !accountingMonth || !platform || referenceValue === undefined || actualValue === undefined || actualValueUSD === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const income = await prisma.income.create({
      data: {
        talentId,
        accountingMonth: new Date(accountingMonth),
        platform,
        currency: currency || 'USD',
        referenceValue,
        actualValue,
        actualValueUSD,
        description: description || '',
      },
      include: { talent: { select: { id: true, name: true } } },
    })

    return NextResponse.json(income)
  } catch (error) {
    console.error('Create income error:', error)
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


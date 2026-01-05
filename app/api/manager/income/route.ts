import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.permission !== 'MANAGER' && session.permission !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { talentId, accountingMonth, platform, currency, referenceValue, actualValue, actualValueUSD, description } = body

    if (!talentId || !accountingMonth || !platform || referenceValue === undefined || actualValue === undefined || actualValueUSD === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (session.permission === 'MANAGER') {
      const talent = await prisma.talent.findUnique({
        where: { id: talentId },
        select: { managerId: true },
      })
      if (!talent || talent.managerId !== session.managerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
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
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


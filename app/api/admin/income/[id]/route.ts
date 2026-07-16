import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { recalculateSalaryExpensesForTalent } from '@/lib/recalculate-salary-expenses-for-talent'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await request.json()
    const { accountingMonth, platform, currency, referenceValue, actualValue, actualValueUSD, description, talentId } = body

    const existing = await prisma.income.findUnique({
      where: { id },
      select: { talentId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    const income = await prisma.income.update({
      where: { id },
      data: {
        ...(accountingMonth && { accountingMonth: new Date(accountingMonth) }),
        ...(platform && { platform }),
        ...(currency && { currency }),
        ...(referenceValue !== undefined && { referenceValue }),
        ...(actualValue !== undefined && { actualValue }),
        ...(actualValueUSD !== undefined && { actualValueUSD }),
        ...(description !== undefined && { description }),
        ...(talentId && { talentId }),
      },
      include: { talent: { select: { id: true, name: true } } },
    })

    const talentIds = new Set<string>([existing.talentId])
    if (talentId && talentId !== existing.talentId) {
      talentIds.add(talentId)
    }
    for (const tid of talentIds) {
      await recalculateSalaryExpensesForTalent(prisma, tid)
    }

    return NextResponse.json(income)
  } catch (error) {
    console.error('Update income error:', error)
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

    const existing = await prisma.income.findUnique({
      where: { id },
      select: { talentId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    await prisma.income.delete({ where: { id } })

    await recalculateSalaryExpensesForTalent(prisma, existing.talentId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete income error:', error)
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


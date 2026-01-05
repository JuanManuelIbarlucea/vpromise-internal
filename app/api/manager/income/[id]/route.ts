import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.permission !== 'MANAGER' && session.permission !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const existingIncome = await prisma.income.findUnique({
      where: { id },
      include: { talent: { select: { managerId: true } } },
    })

    if (!existingIncome) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    if (session.permission === 'MANAGER' && existingIncome.talent.managerId !== session.managerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { accountingMonth, platform, currency, referenceValue, actualValue, actualValueUSD, description } = body

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
      },
      include: { talent: { select: { id: true, name: true } } },
    })

    return NextResponse.json(income)
  } catch (error) {
    console.error('Update income error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.permission !== 'MANAGER' && session.permission !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const existingIncome = await prisma.income.findUnique({
      where: { id },
      include: { talent: { select: { managerId: true } } },
    })

    if (!existingIncome) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    if (session.permission === 'MANAGER' && existingIncome.talent.managerId !== session.managerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.income.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete income error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


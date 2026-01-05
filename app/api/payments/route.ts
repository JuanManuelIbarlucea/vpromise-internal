import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const limit = searchParams.get('limit')
    
    const payments = await prisma.payment.findMany({
      where: type ? { type: type as 'SALARY' | 'EXPENSE' } : undefined,
      include: {
        user: { select: { id: true, username: true, type: true } },
        expense: { select: { id: true, description: true, category: true } },
      },
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    })
    
    return NextResponse.json(payments)
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { type, userId, amount, description, date } = body
    
    if (!type || !userId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    if (type !== 'SALARY' && type !== 'EXPENSE') {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const payment = await prisma.payment.create({
      data: {
        type,
        userId,
        amount: parseFloat(amount),
        description: description || `${type === 'SALARY' ? 'Salary' : 'Expense'} payment`,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        user: { select: { id: true, username: true, type: true } },
      },
    })
    
    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Create payment error:', error)
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}


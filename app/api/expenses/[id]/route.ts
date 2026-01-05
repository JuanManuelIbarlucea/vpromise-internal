import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const expense = await prisma.expense.findUnique({
      where: { id },
    })
    
    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(expense)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const { description, amount, category, date, userId } = body
    
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 400 })
      }
    }
    
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(category !== undefined && { category }),
        ...(date && { date: new Date(date) }),
        ...(userId && { userId }),
      },
      include: {
        user: { select: { id: true, username: true } },
        talent: { select: { id: true, name: true } },
      },
    })
    
    return NextResponse.json(expense)
  } catch (error) {
    console.error('Update expense error:', error)
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.expense.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (status !== 'PAID' && status !== 'PENDING') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true } },
        talent: { select: { name: true } },
        payment: true,
      },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    if (status === 'PAID' && expense.status !== 'PAID') {
      // Use the expense's userId directly (now required on all expenses)
      const paymentDescription = expense.talent
        ? `${expense.description} (${expense.talent.name})`
        : expense.description

      const [updatedExpense] = await prisma.$transaction([
        prisma.expense.update({
          where: { id },
          data: { status: 'PAID' },
        }),
        prisma.payment.create({
          data: {
            amount: expense.amount,
            type: 'EXPENSE',
            description: paymentDescription,
            date: new Date(),
            userId: expense.userId,
            expenseId: expense.id,
          },
        }),
      ])

      return NextResponse.json(updatedExpense)
    } else if (status === 'PENDING' && expense.status === 'PAID') {
      if (expense.payment) {
        await prisma.payment.delete({ where: { id: expense.payment.id } })
      }
      
      const updatedExpense = await prisma.expense.update({
        where: { id },
        data: { status: 'PENDING' },
      })

      return NextResponse.json(updatedExpense)
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Update expense status error:', error)
    return NextResponse.json({ error: 'Failed to update expense status' }, { status: 500 })
  }
}


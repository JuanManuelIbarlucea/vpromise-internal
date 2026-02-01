import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.types?.includes('TALENT')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        username: true,
        email: true,
        salary: true,
        types: true,
        permission: true,
        createdAt: true,
        manager: { select: { id: true, name: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const payments = await prisma.payment.findMany({
      where: { userId: session.id },
      orderBy: { date: 'desc' },
    })

    const currentMonthPayments = payments.filter(p => {
      const paymentDate = new Date(p.date)
      return paymentDate >= currentMonthStart && paymentDate <= currentMonthEnd
    })

    const currentMonthSalaryPaid = currentMonthPayments
      .filter(p => p.type === 'SALARY')
      .reduce((sum, p) => sum + p.amount, 0)

    const currentMonthExpensesPaid = currentMonthPayments
      .filter(p => p.type === 'EXPENSE')
      .reduce((sum, p) => sum + p.amount, 0)

    const extraordinaryExpenses = await prisma.expense.findMany({
      where: {
        userId: session.id,
        isSalary: true,
        isRecurring: false,
        date: { gte: currentMonthStart, lte: currentMonthEnd },
      },
      orderBy: { date: 'desc' },
    })

    const totalExtraordinaryExpenses = extraordinaryExpenses.reduce((sum, e) => sum + e.amount, 0)

    const expectedMonthlyTotal = user.salary + totalExtraordinaryExpenses

    const paymentsByMonth = payments.reduce((acc, p) => {
      const month = new Date(p.date).toISOString().slice(0, 7)
      if (!acc[month]) {
        acc[month] = { salary: 0, expenses: 0, payments: [] }
      }
      if (p.type === 'SALARY') {
        acc[month].salary += p.amount
      } else {
        acc[month].expenses += p.amount
      }
      acc[month].payments.push({
        id: p.id,
        type: p.type,
        amount: p.amount,
        description: p.description,
        date: p.date,
      })
      return acc
    }, {} as Record<string, { salary: number; expenses: number; payments: { id: string; type: string; amount: number; description: string; date: Date }[] }>)

    const monthlyHistory = Object.entries(paymentsByMonth)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month))

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        salary: user.salary,
        types: user.types,
        permission: user.permission,
        createdAt: user.createdAt,
        managerName: user.manager?.name || null,
      },
      currentMonth: {
        month: currentMonthStart.toISOString().slice(0, 7),
        baseSalary: user.salary,
        extraordinaryExpenses: totalExtraordinaryExpenses,
        expectedTotal: expectedMonthlyTotal,
        salaryPaid: currentMonthSalaryPaid,
        expensesPaid: currentMonthExpensesPaid,
        totalPaid: currentMonthSalaryPaid + currentMonthExpensesPaid,
        remaining: expectedMonthlyTotal - currentMonthSalaryPaid,
        expenses: extraordinaryExpenses.map(e => ({
          id: e.id,
          description: e.description,
          amount: e.amount,
          status: e.status,
          date: e.date,
        })),
      },
      paymentHistory: monthlyHistory.slice(0, 12),
      allPayments: payments.slice(0, 50).map(p => ({
        id: p.id,
        type: p.type,
        amount: p.amount,
        description: p.description,
        date: p.date,
      })),
    })
  } catch (error) {
    console.error('Personal data error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.types?.includes('TALENT')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { description, amount } = body

    if (!description || !amount) {
      return NextResponse.json({ error: 'Description and amount are required' }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        amount: parseFloat(amount),
        category: 'Extraordinary',
        isSalary: true,
        isRecurring: false,
        status: 'PENDING',
        userId: session.id,
        date: new Date(),
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Create extraordinary expense error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { recalculateSalaryExpensesForTalent } from '@/lib/recalculate-salary-expenses-for-talent'

export const PERFORMANCE_BONUS_AMOUNT = 80

// Toggle the "Good performance bonus" (+$80) on a talent's salary Expense for the
// current payroll month. The bonus is absorbed by carried agency debt like the base.
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { userId, enabled } = await request.json()
    if (!userId || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'userId and enabled are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, talent: { select: { id: true } } },
    })

    if (!user?.talent) {
      return NextResponse.json({ error: 'Performance bonus is talent-only' }, { status: 400 })
    }

    const now = new Date()
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59))

    const salaryExpense = await prisma.expense.findFirst({
      where: {
        userId: user.id,
        isSalary: true,
        date: { gte: monthStart, lte: monthEnd },
      },
      select: { id: true },
    })

    if (!salaryExpense) {
      return NextResponse.json(
        { error: 'No salary record for the current month yet' },
        { status: 400 }
      )
    }

    await prisma.expense.update({
      where: { id: salaryExpense.id },
      data: { bonus: enabled ? PERFORMANCE_BONUS_AMOUNT : 0 },
    })

    // Recompute the amount/status/payment for this month's salary row now that the
    // bonus changed (debt offset is re-applied to the new base + bonus target).
    await recalculateSalaryExpensesForTalent(prisma, user.talent.id)

    return NextResponse.json({ success: true, bonus: enabled ? PERFORMANCE_BONUS_AMOUNT : 0 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Toggle performance bonus error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

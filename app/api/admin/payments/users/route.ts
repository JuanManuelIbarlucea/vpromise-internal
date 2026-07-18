import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { calculateUserPayroll, applyPaypalFee } from '@/lib/salary'

export async function GET() {
  try {
    await requireAdmin()

    const now = new Date()
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59))

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { types: { has: 'TALENT' } },
          { types: { has: 'STAFF' } },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        paypalEmail: true,
        salary: true,
        types: true,
        manager: { select: { id: true, name: true } },
        talent: { select: { id: true, name: true } },
        expenses: {
          where: { isSalary: true, date: { gte: monthStart, lte: monthEnd } },
          select: { bonus: true },
          take: 1,
        },
        payments: {
          where: { type: 'SALARY' },
          orderBy: { date: 'desc' },
          take: 1,
          select: {
            id: true,
            amount: true,
            date: true,
            paypalEmail: true,
          },
        },
      },
      orderBy: [
        { types: 'asc' },
        { username: 'asc' },
      ],
    })

    const usersWithAmounts = await Promise.all(
      users.map(async (user) => {
        // "Debt" shown is the balance AFTER this month's salary + bonus offset.
        // The payout is derived from the same computation so the two stay consistent.
        if (user.talent) {
          const bonus = user.expenses[0]?.bonus ?? 0
          const payroll = await calculateUserPayroll(user.id, user.salary, bonus)
          return { ...user, debt: payroll.debtAfter, bonus, amountToPay: payroll.paypalAmount }
        }
        return { ...user, debt: 0, bonus: 0, amountToPay: applyPaypalFee(user.salary) }
      })
    )

    return NextResponse.json(usersWithAmounts)
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

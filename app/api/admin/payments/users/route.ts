import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { calculateRunningDebt, calculatePaypalAmount } from '@/lib/salary'

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
        const debt = user.types.includes('TALENT')
          ? await calculateRunningDebt(user.id, user.salary)
          : 0
        const bonus = user.talent ? user.expenses[0]?.bonus ?? 0 : 0
        // Bonus is paid on top of base but absorbed by carried debt like the base.
        const amountToPay = calculatePaypalAmount(user.salary + bonus, debt)
        return { ...user, debt, bonus, amountToPay }
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

import type { PrismaClient } from '@prisma/client'
import { calculateAgencyShare } from '@/lib/agency-share'

export type CreateMonthlySalariesResult = {
  created: number
  skippedDebt: number
  month: string
}

export async function createMonthlySalaries(
  prisma: PrismaClient,
  now: Date = new Date()
): Promise<CreateMonthlySalariesResult> {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59))

  const users = await prisma.user.findMany({
    where: { salary: { gt: 0 }, frozen: false },
    include: {
      talent: {
        include: {
          incomes: { orderBy: { accountingMonth: 'asc' } },
        },
      },
    },
  })

  let created = 0
  let skippedDebt = 0

  for (const user of users) {
    const existing = await prisma.expense.findFirst({
      where: {
        userId: user.id,
        isSalary: true,
        date: { gte: monthStart, lte: monthEnd },
      },
    })

    if (existing) continue

    const name = user.talent?.name || user.username

    let salaryAmount = user.salary
    let coveredByDebt = false

    if (user.talent && user.talent.incomes.length > 0) {
      let runningDebt = 0
      const incomeByMonth: Record<string, number> = {}

      for (const income of user.talent.incomes) {
        const month = new Date(income.accountingMonth).toISOString().slice(0, 7)
        incomeByMonth[month] = (incomeByMonth[month] || 0) + income.actualValueUSD
      }

      const months = Object.keys(incomeByMonth).sort()
      const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
      if (months.length > 0) {
        let [y, m] = months[0].split('-').map(Number)
        while (`${y}-${String(m).padStart(2, '0')}` < currentMonth) {
          const key = `${y}-${String(m).padStart(2, '0')}`
          if (!incomeByMonth[key]) incomeByMonth[key] = 0
          m++
          if (m > 12) {
            m = 1
            y++
          }
        }
      }
      delete incomeByMonth[currentMonth]

      const allMonths = Object.keys(incomeByMonth).sort()
      for (const month of allMonths) {
        const monthTotal = incomeByMonth[month]
        const agencyShare = calculateAgencyShare(monthTotal)

        if (runningDebt >= user.salary) {
          runningDebt -= user.salary
        } else {
          runningDebt = 0
        }

        runningDebt += agencyShare
      }

      if (runningDebt >= user.salary) {
        coveredByDebt = true
        salaryAmount = 0
      } else if (runningDebt > 0) {
        salaryAmount = user.salary - runningDebt
      }
    }

    if (coveredByDebt) {
      await prisma.expense.create({
        data: {
          description: `Monthly Salary - ${name} (Covered by debt)`,
          amount: 0,
          category: 'Salary',
          isRecurring: true,
          isSalary: true,
          status: 'PAID',
          date: monthStart,
          userId: user.id,
          talentId: user.talent?.id || null,
        },
      })
      skippedDebt++
    } else {
      await prisma.expense.create({
        data: {
          description: `Monthly Salary - ${name}${salaryAmount < user.salary ? ' (Partially covered by debt)' : ''}`,
          amount: salaryAmount,
          category: 'Salary',
          isRecurring: true,
          isSalary: true,
          status: 'PENDING',
          date: monthStart,
          userId: user.id,
          talentId: user.talent?.id || null,
        },
      })
    }

    created++
  }

  return {
    created,
    skippedDebt,
    month: monthStart.toISOString().slice(0, 7),
  }
}

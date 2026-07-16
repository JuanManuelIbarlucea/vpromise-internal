import type { PrismaClient } from '@prisma/client'
import {
  buildMonthlySalaryDescription,
  computePayrollSalaryFromIncomes,
} from '@/lib/payroll-salary-from-debt'
import { syncTalentAgencyDebtBalance } from '@/lib/sync-talent-agency-debt-balance'

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
    if (user.talent?.id) {
      await syncTalentAgencyDebtBalance(prisma, user.talent.id, now)
    }

    const existing = await prisma.expense.findFirst({
      where: {
        userId: user.id,
        isSalary: true,
        date: { gte: monthStart, lte: monthEnd },
      },
    })

    if (existing) continue

    const name = user.talent?.name || user.username

    const payrollMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
    const incomes =
      user.talent?.incomes.map((i) => ({
        accountingMonth: i.accountingMonth,
        actualValueUSD: i.actualValueUSD,
      })) ?? []

    const { salaryAmount, coveredByDebt } = computePayrollSalaryFromIncomes(
      user.salary,
      incomes,
      payrollMonthKey
    )

    if (coveredByDebt) {
      await prisma.expense.create({
        data: {
          description: buildMonthlySalaryDescription(name, salaryAmount, user.salary, coveredByDebt),
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
          description: buildMonthlySalaryDescription(name, salaryAmount, user.salary, coveredByDebt),
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

import type { PrismaClient } from '@prisma/client'
import {
  bonusByMonthFromExpenses,
  computePayrollSalaryFromIncomes,
} from '@/lib/payroll-salary-from-debt'

export async function syncTalentAgencyDebtBalance(
  prisma: PrismaClient,
  talentId: string,
  now: Date = new Date()
): Promise<void> {
  const talent = await prisma.talent.findUnique({
    where: { id: talentId },
    select: {
      id: true,
      userId: true,
      incomes: { orderBy: { accountingMonth: 'asc' } },
    },
  })

  if (!talent?.userId) {
    return
  }

  const user = await prisma.user.findUnique({
    where: { id: talent.userId },
    select: { salary: true, frozen: true },
  })

  if (!user || user.salary <= 0 || user.frozen) {
    await prisma.talent.update({
      where: { id: talentId },
      data: { agencyDebtBalance: 0 },
    })
    return
  }

  const payrollMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const incomes = talent.incomes.map((i) => ({
    accountingMonth: i.accountingMonth,
    actualValueUSD: i.actualValueUSD,
  }))

  // Per-month performance bonuses are offset by debt like the base, so include
  // every month's bonus when persisting the after-payroll balance.
  const salaryExpenses = await prisma.expense.findMany({
    where: { userId: talent.userId, isSalary: true },
    select: { date: true, bonus: true },
  })
  const bonusByMonth = bonusByMonthFromExpenses(salaryExpenses)

  const { runningDebtAfterPayroll } = computePayrollSalaryFromIncomes(
    user.salary,
    incomes,
    payrollMonthKey,
    bonusByMonth
  )

  await prisma.talent.update({
    where: { id: talentId },
    data: { agencyDebtBalance: runningDebtAfterPayroll },
  })
}

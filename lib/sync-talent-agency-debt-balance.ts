import type { PrismaClient } from '@prisma/client'
import { computePayrollSalaryFromIncomes } from '@/lib/payroll-salary-from-debt'

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

  // Current payroll month's performance bonus is offset by debt like the base,
  // so it must be included when persisting the after-payroll balance.
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59))
  const currentSalaryExpense = await prisma.expense.findFirst({
    where: { userId: talent.userId, isSalary: true, date: { gte: monthStart, lte: monthEnd } },
    select: { bonus: true },
  })
  const bonus = currentSalaryExpense?.bonus ?? 0

  const { runningDebtAfterPayroll } = computePayrollSalaryFromIncomes(
    user.salary,
    incomes,
    payrollMonthKey,
    bonus
  )

  await prisma.talent.update({
    where: { id: talentId },
    data: { agencyDebtBalance: runningDebtAfterPayroll },
  })
}

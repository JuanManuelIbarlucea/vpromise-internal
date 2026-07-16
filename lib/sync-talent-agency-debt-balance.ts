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

  const { runningDebtAfterPayroll } = computePayrollSalaryFromIncomes(
    user.salary,
    incomes,
    payrollMonthKey
  )

  await prisma.talent.update({
    where: { id: talentId },
    data: { agencyDebtBalance: runningDebtAfterPayroll },
  })
}

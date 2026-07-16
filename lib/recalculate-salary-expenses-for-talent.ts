import type { PrismaClient } from '@prisma/client'
import {
  buildMonthlySalaryDescription,
  computePayrollSalaryFromIncomes,
} from '@/lib/payroll-salary-from-debt'
import { syncTalentAgencyDebtBalance } from '@/lib/sync-talent-agency-debt-balance'

export async function recalculateSalaryExpensesForTalent(
  prisma: PrismaClient,
  talentId: string
): Promise<{ updated: number }> {
  const talent = await prisma.talent.findUnique({
    where: { id: talentId },
    select: {
      id: true,
      name: true,
      userId: true,
      incomes: { orderBy: { accountingMonth: 'asc' } },
    },
  })

  if (!talent?.userId) {
    return { updated: 0 }
  }

  const user = await prisma.user.findUnique({
    where: { id: talent.userId },
    select: { id: true, salary: true, frozen: true, username: true },
  })

  if (!user || user.salary <= 0 || user.frozen) {
    await syncTalentAgencyDebtBalance(prisma, talentId)
    return { updated: 0 }
  }

  const incomes = talent.incomes.map((i) => ({
    accountingMonth: i.accountingMonth,
    actualValueUSD: i.actualValueUSD,
  }))

  const displayName = talent.name || user.username

  const salaryExpenses = await prisma.expense.findMany({
    where: {
      userId: user.id,
      isSalary: true,
      isRecurring: true,
    },
    include: { payment: true },
    orderBy: { date: 'asc' },
  })

  let updated = 0

  for (const expense of salaryExpenses) {
    const payrollMonthKey = new Date(expense.date).toISOString().slice(0, 7)
    const { salaryAmount, coveredByDebt } = computePayrollSalaryFromIncomes(
      user.salary,
      incomes,
      payrollMonthKey,
      expense.bonus
    )

    const description = buildMonthlySalaryDescription(
      displayName,
      salaryAmount,
      user.salary,
      coveredByDebt,
      expense.bonus
    )

    if (coveredByDebt) {
      await prisma.$transaction(async (tx) => {
        if (expense.payment) {
          await tx.payment.delete({ where: { id: expense.payment.id } })
        }
        await tx.expense.update({
          where: { id: expense.id },
          data: {
            amount: 0,
            description,
            status: 'PAID',
          },
        })
      })
      updated++
      continue
    }

    if (expense.payment) {
      await prisma.$transaction([
        prisma.expense.update({
          where: { id: expense.id },
          data: {
            amount: salaryAmount,
            description,
            status: 'PAID',
          },
        }),
        prisma.payment.update({
          where: { id: expense.payment.id },
          data: { amount: salaryAmount },
        }),
      ])
    } else {
      await prisma.expense.update({
        where: { id: expense.id },
        data: {
          amount: salaryAmount,
          description,
          status: 'PENDING',
        },
      })
    }
    updated++
  }

  await syncTalentAgencyDebtBalance(prisma, talentId)

  return { updated }
}

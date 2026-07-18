import { prisma } from '@/lib/prisma'
import { computePayrollSalaryFromIncomes } from '@/lib/payroll-salary-from-debt'

const PAYPAL_FEE_RATE = 0.054
const PAYPAL_FIXED_FEE = 0.30

/** Gross a net salary up to cover PayPal fees. Returns 0 when nothing is owed. */
export function applyPaypalFee(netSalary: number): number {
  if (netSalary <= 0) return 0
  return Number((netSalary * (1 + PAYPAL_FEE_RATE) + PAYPAL_FIXED_FEE).toFixed(2))
}

export type UserPayroll = {
  /** Debt carried into the current month, before this month's salary offset. */
  debtBefore: number
  /** Debt after this month's salary + bonus offset — the canonical "current debt". */
  debtAfter: number
  /** Net salary owed for the current month (already offset by carried debt). */
  salaryAmount: number
  /** PayPal payout for salaryAmount, grossed up for fees (0 if nothing to pay). */
  paypalAmount: number
}

/**
 * Current payroll picture for a user. Talents net their salary + performance
 * bonus against carried agency debt; non-talents (or talents without income)
 * are simply paid their flat salary.
 */
export async function calculateUserPayroll(
  userId: string,
  salary: number,
  bonus: number = 0
): Promise<UserPayroll> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      talent: { include: { incomes: { orderBy: { accountingMonth: 'asc' } } } },
    },
  })

  if (!user?.talent || !user.talent.incomes.length) {
    const target = Math.max(0, salary) + Math.max(0, bonus)
    return { debtBefore: 0, debtAfter: 0, salaryAmount: target, paypalAmount: applyPaypalFee(target) }
  }

  const now = new Date()
  const payrollMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const incomes = user.talent.incomes.map((i) => ({
    accountingMonth: i.accountingMonth,
    actualValueUSD: i.actualValueUSD,
  }))

  const { salaryAmount, runningDebtBeforePayroll, runningDebtAfterPayroll } =
    computePayrollSalaryFromIncomes(salary, incomes, payrollMonthKey, bonus)

  return {
    debtBefore: runningDebtBeforePayroll,
    debtAfter: runningDebtAfterPayroll,
    salaryAmount,
    paypalAmount: applyPaypalFee(salaryAmount),
  }
}

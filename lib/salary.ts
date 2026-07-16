import { prisma } from '@/lib/prisma'
import { computePayrollSalaryFromIncomes } from '@/lib/payroll-salary-from-debt'

const PAYPAL_FEE_RATE = 0.054
const PAYPAL_FIXED_FEE = 0.30

export async function calculateRunningDebt(userId: string, salary: number): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      talent: {
        include: { incomes: { orderBy: { accountingMonth: 'asc' } } },
      },
    },
  })

  if (!user?.talent || !user.talent.incomes.length) return 0

  const now = new Date()
  const payrollMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const incomes = user.talent.incomes.map((i) => ({
    accountingMonth: i.accountingMonth,
    actualValueUSD: i.actualValueUSD,
  }))

  const { runningDebtBeforePayroll } = computePayrollSalaryFromIncomes(
    salary,
    incomes,
    payrollMonthKey
  )

  return runningDebtBeforePayroll
}

export function calculatePaypalAmount(salary: number, debt: number): number {
  const netSalary = Math.max(0, salary - debt)
  if (netSalary <= 0) return 0
  return Number((netSalary * (1 + PAYPAL_FEE_RATE) + PAYPAL_FIXED_FEE).toFixed(2))
}

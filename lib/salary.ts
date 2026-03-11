import { prisma } from '@/lib/prisma'
import { calculateAgencyShare } from '@/lib/agency-share'

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
      if (m > 12) { m = 1; y++ }
    }
  }
  delete incomeByMonth[currentMonth]

  let runningDebt = 0
  for (const month of Object.keys(incomeByMonth).sort()) {
    if (runningDebt >= salary) {
      runningDebt -= salary
    } else {
      runningDebt = 0
    }
    runningDebt += calculateAgencyShare(incomeByMonth[month])
  }

  return runningDebt
}

export function calculatePaypalAmount(salary: number, debt: number): number {
  const netSalary = Math.max(0, salary - debt)
  if (netSalary <= 0) return 0
  return Number((netSalary * (1 + PAYPAL_FEE_RATE) + PAYPAL_FIXED_FEE).toFixed(2))
}

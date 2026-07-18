import { calculateAgencyShare } from '@/lib/agency-share'

export type IncomeForDebt = {
  accountingMonth: Date
  actualValueUSD: number
}

export type PayrollSalaryComputation = {
  salaryAmount: number
  coveredByDebt: boolean
  /** Debt owed before applying this payroll month’s paycheck (used for PayPal / gross netting). */
  runningDebtBeforePayroll: number
  /** Debt remaining after salary absorbs debt for this payroll cycle (agency share from payroll month excluded until next cycle). */
  runningDebtAfterPayroll: number
}

/** Build a { "YYYY-MM": bonusTotal } map from a talent's salary expense rows. */
export function bonusByMonthFromExpenses(
  expenses: { date: Date; bonus: number; isSalary?: boolean }[]
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const e of expenses) {
    if (e.isSalary === false) continue
    const month = new Date(e.date).toISOString().slice(0, 7)
    map[month] = (map[month] || 0) + e.bonus
  }
  return map
}

export function computePayrollSalaryFromIncomes(
  baseSalary: number,
  incomes: IncomeForDebt[],
  payrollMonthKey: string,
  // "Good performance bonus" granted per month, keyed by "YYYY-MM". Each month's
  // bonus is paid on top of base salary but absorbed by carried agency debt just
  // like the base, so every month's debt offset is base + that month's bonus.
  bonusByMonth: Record<string, number> = {}
): PayrollSalaryComputation {
  const base = Math.max(0, baseSalary)
  const monthOffset = (monthKey: string) => base + Math.max(0, bonusByMonth[monthKey] ?? 0)
  const target = monthOffset(payrollMonthKey)

  const empty = (): PayrollSalaryComputation => ({
    salaryAmount: target,
    coveredByDebt: false,
    runningDebtBeforePayroll: 0,
    runningDebtAfterPayroll: 0,
  })

  let salaryAmount = target
  let coveredByDebt = false

  if (target <= 0 || incomes.length === 0) {
    return empty()
  }

  const incomeByMonth: Record<string, number> = {}

  for (const income of incomes) {
    const month = new Date(income.accountingMonth).toISOString().slice(0, 7)
    incomeByMonth[month] = (incomeByMonth[month] || 0) + income.actualValueUSD
  }

  const months = Object.keys(incomeByMonth).sort()
  if (months.length > 0) {
    let [y, m] = months[0].split('-').map(Number)
    while (`${y}-${String(m).padStart(2, '0')}` < payrollMonthKey) {
      const key = `${y}-${String(m).padStart(2, '0')}`
      if (!incomeByMonth[key]) incomeByMonth[key] = 0
      m++
      if (m > 12) {
        m = 1
        y++
      }
    }
  }

  delete incomeByMonth[payrollMonthKey]

  let runningDebt = 0
  for (const month of Object.keys(incomeByMonth).sort()) {
    const monthTotal = incomeByMonth[month]
    const offset = monthOffset(month)

    if (runningDebt >= offset) {
      runningDebt -= offset
    } else {
      runningDebt = 0
    }

    runningDebt += calculateAgencyShare(monthTotal)
  }

  // The base + bonus target for the payroll month is offset by carried debt.
  const runningDebtBeforePayroll = runningDebt
  const runningDebtAfterPayroll =
    runningDebtBeforePayroll >= target
      ? runningDebtBeforePayroll - target
      : 0

  if (runningDebtBeforePayroll >= target) {
    coveredByDebt = true
    salaryAmount = 0
  } else if (runningDebtBeforePayroll > 0) {
    salaryAmount = target - runningDebtBeforePayroll
  } else {
    salaryAmount = target
  }

  return {
    salaryAmount,
    coveredByDebt,
    runningDebtBeforePayroll,
    runningDebtAfterPayroll,
  }
}

export function buildMonthlySalaryDescription(
  displayName: string,
  salaryAmount: number,
  baseSalary: number,
  coveredByDebt: boolean,
  bonus: number = 0
): string {
  const bonusNote = bonus > 0 ? ` [+ $${bonus} performance bonus]` : ''
  if (coveredByDebt) {
    return `Monthly Salary - ${displayName} (Covered by debt)${bonusNote}`
  }
  const target = Math.max(0, baseSalary) + Math.max(0, bonus)
  const partial = salaryAmount > 0 && salaryAmount < target
  return `Monthly Salary - ${displayName}${partial ? ' (Partially covered by debt)' : ''}${bonusNote}`
}

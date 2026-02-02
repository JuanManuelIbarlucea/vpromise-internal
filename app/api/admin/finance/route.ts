import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()

    const [users, talents, managers, expenses, payments, incomes] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, username: true, salary: true, types: true },
      }),
      prisma.talent.findMany({
        select: { id: true, name: true, user: { select: { salary: true } } },
      }),
      prisma.manager.findMany({
        select: { id: true, name: true, user: { select: { salary: true } } },
      }),
      prisma.expense.findMany({
        include: { 
          talent: { select: { name: true } },
          user: { select: { username: true, types: true } },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.payment.findMany({
        include: { user: { select: { username: true, types: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.income.findMany({
        include: { talent: { select: { name: true } } },
        orderBy: { accountingMonth: 'desc' },
      }),
    ])

    const totalSalaries = users.reduce((sum: number, u: { salary: number | null }) => sum + (u.salary || 0), 0)

    const monthlyData = buildMonthlyData(expenses, payments, incomes, totalSalaries)
    const annualData = buildAnnualData(expenses, payments, incomes, totalSalaries)
    const allTimeData = buildAllTimeData(expenses, payments, incomes, users, talents, managers)

    return NextResponse.json({ monthlyData, annualData, allTimeData })
  } catch (error) {
    console.error('Finance API error:', error)
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

type Expense = {
  id: string
  amount: number
  description: string
  category: string
  isRecurring: boolean
  status: string
  date: Date
  talent: { name: string } | null
  user: { username: string; types: string[] } | null
}

type Payment = {
  id: string
  amount: number
  type: string
  description: string
  date: Date
  user: { username: string; types: string[] }
}

type Income = {
  id: string
  accountingMonth: Date
  platform: string
  currency: string
  referenceValue: number
  actualValue: number
  actualValueUSD: number
  description: string
  talent: { name: string }
}

type User = { id: string; username: string; salary: number | null; types: string[] }
type Talent = { id: string; name: string; user: { salary: number | null } | null }
type Manager = { id: string; name: string; user: { salary: number | null } | null }

function calculateAgencyShare(monthlyTotal: number): number {
  const rate = monthlyTotal > 1000 ? 0.20 : 0.45
  return monthlyTotal * rate
}

function buildMonthlyData(expenses: Expense[], payments: Payment[], incomes: Income[], monthlySalaries: number) {
  const months: Record<string, {
    expenses: number
    recurring: number
    oneOff: number
    payments: number
    salaryPayments: number
    expensePayments: number
    expenseCount: number
    paymentCount: number
    income: number
    incomeCount: number
    byCategory: Record<string, number>
    byUser: Record<string, number>
    incomeByPlatform: Record<string, number>
    incomeByTalent: Record<string, number>
  }> = {}

  const initMonth = () => ({ 
    expenses: 0, recurring: 0, oneOff: 0, payments: 0, salaryPayments: 0, expensePayments: 0, 
    expenseCount: 0, paymentCount: 0, income: 0, incomeCount: 0,
    byCategory: {}, byUser: {}, incomeByPlatform: {}, incomeByTalent: {} 
  })

  expenses.forEach((e) => {
    const month = new Date(e.date).toISOString().slice(0, 7)
    if (!months[month]) months[month] = initMonth()
    months[month].expenses += e.amount
    months[month].expenseCount++
    if (e.isRecurring) months[month].recurring += e.amount
    else months[month].oneOff += e.amount
    months[month].byCategory[e.category] = (months[month].byCategory[e.category] || 0) + e.amount
    const user = e.user?.username || 'Unknown'
    months[month].byUser[user] = (months[month].byUser[user] || 0) + e.amount
  })

  payments.forEach((p) => {
    const month = new Date(p.date).toISOString().slice(0, 7)
    if (!months[month]) months[month] = initMonth()
    months[month].payments += p.amount
    months[month].paymentCount++
    if (p.type === 'SALARY') months[month].salaryPayments += p.amount
    else months[month].expensePayments += p.amount
  })

  incomes.forEach((i) => {
    const month = new Date(i.accountingMonth).toISOString().slice(0, 7)
    if (!months[month]) months[month] = initMonth()
    months[month].income += i.actualValueUSD
    months[month].incomeCount++
    months[month].incomeByPlatform[i.platform] = (months[month].incomeByPlatform[i.platform] || 0) + i.actualValueUSD
    months[month].incomeByTalent[i.talent.name] = (months[month].incomeByTalent[i.talent.name] || 0) + i.actualValueUSD
  })

  const sortedMonths = Object.keys(months).sort().reverse()

  return sortedMonths.map((month) => {
    const m = months[month]
    const agencyShare = calculateAgencyShare(m.income)
    const agencyRate = m.income > 1000 ? 0.20 : 0.45
    return {
      month,
      totalSpent: m.payments,
      expenses: m.expenses,
      recurring: m.recurring,
      oneOff: m.oneOff,
      salaryPayments: m.salaryPayments,
      expensePayments: m.expensePayments,
      expenseCount: m.expenseCount,
      paymentCount: m.paymentCount,
      income: m.income,
      agencyShare,
      agencyRate,
      incomeCount: m.incomeCount,
      netFlow: agencyShare - m.payments,
      estimatedMonthlyCost: monthlySalaries + m.recurring,
      byCategory: Object.entries(m.byCategory).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
      byUser: Object.entries(m.byUser).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
      incomeByPlatform: Object.entries(m.incomeByPlatform).map(([platform, amount]) => ({ platform, amount })).sort((a, b) => b.amount - a.amount),
      incomeByTalent: Object.entries(m.incomeByTalent).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
    }
  })
}

function buildAnnualData(expenses: Expense[], payments: Payment[], incomes: Income[], monthlySalaries: number) {
  const years: Record<string, {
    expenses: number
    recurring: number
    oneOff: number
    payments: number
    salaryPayments: number
    expensePayments: number
    expenseCount: number
    paymentCount: number
    income: number
    incomeCount: number
    byCategory: Record<string, number>
    byUser: Record<string, number>
    incomeByPlatform: Record<string, number>
    incomeByTalent: Record<string, number>
    byMonth: Record<string, { expenses: number; payments: number; income: number }>
  }> = {}

  const initYear = () => ({
    expenses: 0, recurring: 0, oneOff: 0, payments: 0, salaryPayments: 0, expensePayments: 0,
    expenseCount: 0, paymentCount: 0, income: 0, incomeCount: 0,
    byCategory: {}, byUser: {}, incomeByPlatform: {}, incomeByTalent: {}, byMonth: {}
  })

  expenses.forEach((e) => {
    const year = new Date(e.date).getFullYear().toString()
    const month = new Date(e.date).toISOString().slice(0, 7)
    if (!years[year]) years[year] = initYear()
    years[year].expenses += e.amount
    years[year].expenseCount++
    if (e.isRecurring) years[year].recurring += e.amount
    else years[year].oneOff += e.amount
    years[year].byCategory[e.category] = (years[year].byCategory[e.category] || 0) + e.amount
    const user = e.user?.username || 'Unknown'
    years[year].byUser[user] = (years[year].byUser[user] || 0) + e.amount
    if (!years[year].byMonth[month]) years[year].byMonth[month] = { expenses: 0, payments: 0, income: 0 }
    years[year].byMonth[month].expenses += e.amount
  })

  payments.forEach((p) => {
    const year = new Date(p.date).getFullYear().toString()
    const month = new Date(p.date).toISOString().slice(0, 7)
    if (!years[year]) years[year] = initYear()
    years[year].payments += p.amount
    years[year].paymentCount++
    if (p.type === 'SALARY') years[year].salaryPayments += p.amount
    else years[year].expensePayments += p.amount
    if (!years[year].byMonth[month]) years[year].byMonth[month] = { expenses: 0, payments: 0, income: 0 }
    years[year].byMonth[month].payments += p.amount
  })

  incomes.forEach((i) => {
    const year = new Date(i.accountingMonth).getFullYear().toString()
    const month = new Date(i.accountingMonth).toISOString().slice(0, 7)
    if (!years[year]) years[year] = initYear()
    years[year].income += i.actualValueUSD
    years[year].incomeCount++
    years[year].incomeByPlatform[i.platform] = (years[year].incomeByPlatform[i.platform] || 0) + i.actualValueUSD
    years[year].incomeByTalent[i.talent.name] = (years[year].incomeByTalent[i.talent.name] || 0) + i.actualValueUSD
    if (!years[year].byMonth[month]) years[year].byMonth[month] = { expenses: 0, payments: 0, income: 0 }
    years[year].byMonth[month].income += i.actualValueUSD
  })

  const sortedYears = Object.keys(years).sort().reverse()

  return sortedYears.map((year) => {
    const y = years[year]
    const monthlyBreakdown = Object.entries(y.byMonth)
      .map(([month, data]) => {
        const agencyShare = calculateAgencyShare(data.income)
        return { month, ...data, agencyShare }
      })
      .sort((a, b) => a.month.localeCompare(b.month))
    const agencyShare = monthlyBreakdown.reduce((sum: number, m) => sum + m.agencyShare, 0)
    return {
      year,
      totalSpent: y.payments,
      expenses: y.expenses,
      recurring: y.recurring,
      oneOff: y.oneOff,
      salaryPayments: y.salaryPayments,
      expensePayments: y.expensePayments,
      expenseCount: y.expenseCount,
      paymentCount: y.paymentCount,
      income: y.income,
      agencyShare,
      incomeCount: y.incomeCount,
      netFlow: agencyShare - y.payments,
      estimatedAnnualCost: monthlySalaries * 12 + y.recurring,
      byCategory: Object.entries(y.byCategory).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
      byUser: Object.entries(y.byUser).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
      incomeByPlatform: Object.entries(y.incomeByPlatform).map(([platform, amount]) => ({ platform, amount })).sort((a, b) => b.amount - a.amount),
      incomeByTalent: Object.entries(y.incomeByTalent).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
      monthlyBreakdown,
    }
  })
}

function buildAllTimeData(expenses: Expense[], payments: Payment[], incomes: Income[], users: User[], talents: Talent[], managers: Manager[]) {
  const totalSalaries = users.reduce((sum: number, u) => sum + (u.salary || 0), 0)
  const totalExpenses = expenses.reduce((sum: number, e) => sum + e.amount, 0)
  const recurringExpenses = expenses.filter((e) => e.isRecurring)
  const oneOffExpenses = expenses.filter((e) => !e.isRecurring)
  const totalRecurring = recurringExpenses.reduce((sum: number, e) => sum + e.amount, 0)
  const totalOneOff = oneOffExpenses.reduce((sum: number, e) => sum + e.amount, 0)
  const totalPayments = payments.reduce((sum: number, p) => sum + p.amount, 0)
  const salaryPayments = payments.filter((p) => p.type === 'SALARY')
  const expensePayments = payments.filter((p) => p.type === 'EXPENSE')
  const totalSalaryPayments = salaryPayments.reduce((sum: number, p) => sum + p.amount, 0)
  const totalExpensePayments = expensePayments.reduce((sum: number, p) => sum + p.amount, 0)
  const pendingExpenses = expenses.filter((e) => e.status === 'PENDING')
  const paidExpenses = expenses.filter((e) => e.status === 'PAID')
  const totalPending = pendingExpenses.reduce((sum: number, e) => sum + e.amount, 0)
  const totalPaid = paidExpenses.reduce((sum: number, e) => sum + e.amount, 0)
  const totalIncome = incomes.reduce((sum: number, i) => sum + i.actualValueUSD, 0)

  const incomeByMonth = incomes.reduce((acc, i) => {
    const month = new Date(i.accountingMonth).toISOString().slice(0, 7)
    acc[month] = (acc[month] || 0) + i.actualValueUSD
    return acc
  }, {} as Record<string, number>)
  const totalAgencyShare = Object.values(incomeByMonth).reduce((sum: number, monthlyIncome) => sum + calculateAgencyShare(monthlyIncome), 0)

  const byCategory = Object.entries(
    expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)
  ).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount)

  const byUser = Object.entries(
    expenses.reduce((acc, e) => {
      const name = e.user?.username || 'Unknown'
      acc[name] = (acc[name] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)
  ).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount)

  const salaryByType = Object.entries(
    users.reduce((acc, u) => {
      u.types?.forEach((type) => {
        acc[type] = (acc[type] || 0) + (u.salary || 0)
      })
      return acc
    }, {} as Record<string, number>)
  ).map(([type, amount]) => ({ type, amount }))

  const talentSalaries = talents
    .map((t) => ({ name: t.name, salary: t.user?.salary || 0 }))
    .sort((a, b) => b.salary - a.salary)

  const incomeByPlatform = Object.entries(
    incomes.reduce((acc, i) => {
      acc[i.platform] = (acc[i.platform] || 0) + i.actualValueUSD
      return acc
    }, {} as Record<string, number>)
  ).map(([platform, amount]) => ({ platform, amount })).sort((a, b) => b.amount - a.amount)

  const incomeByTalent = Object.entries(
    incomes.reduce((acc, i) => {
      acc[i.talent.name] = (acc[i.talent.name] || 0) + i.actualValueUSD
      return acc
    }, {} as Record<string, number>)
  ).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount)

  const recentExpenses = expenses.slice(0, 10).map((e) => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
    category: e.category,
    isRecurring: e.isRecurring,
    date: e.date,
    user: e.user?.username || 'Unknown',
    talent: e.talent?.name || null,
  }))

  const recentPayments = payments.slice(0, 15).map((p) => ({
    id: p.id,
    amount: p.amount,
    type: p.type,
    description: p.description,
    date: p.date,
    user: p.user.username,
    userTypes: p.user.types,
  }))

  const recentIncomes = incomes.slice(0, 10).map((i) => ({
    id: i.id,
    amount: i.actualValueUSD,
    platform: i.platform,
    description: i.description,
    date: i.accountingMonth,
    talent: i.talent.name,
  }))

  const yearlyTrend = Object.entries(
    payments.reduce((acc, p) => {
      const year = new Date(p.date).getFullYear().toString()
      acc[year] = (acc[year] || 0) + p.amount
      return acc
    }, {} as Record<string, number>)
  ).map(([year, amount]) => ({ year, amount })).sort((a, b) => a.year.localeCompare(b.year))

  const yearlyIncomeTrend = Object.entries(
    incomes.reduce((acc, i) => {
      const year = new Date(i.accountingMonth).getFullYear().toString()
      acc[year] = (acc[year] || 0) + i.actualValueUSD
      return acc
    }, {} as Record<string, number>)
  ).map(([year, amount]) => ({ year, amount })).sort((a, b) => a.year.localeCompare(b.year))

  return {
    summary: {
      totalSpent: totalPayments,
      totalExpenses,
      totalRecurring,
      totalOneOff,
      totalSalaryPayments,
      totalExpensePayments,
      totalPending,
      totalPaid,
      totalIncome,
      totalAgencyShare,
      netFlow: totalAgencyShare - totalPayments,
      monthlyCost: totalSalaries + totalRecurring,
      userCount: users.length,
      talentCount: talents.length,
      managerCount: managers.length,
      expenseCount: expenses.length,
      paymentCount: payments.length,
      incomeCount: incomes.length,
      pendingCount: pendingExpenses.length,
      paidCount: paidExpenses.length,
    },
    byCategory,
    byUser,
    salaryByType,
    talentSalaries,
    incomeByPlatform,
    incomeByTalent,
    recentExpenses,
    recentPayments,
    recentIncomes,
    yearlyTrend,
    yearlyIncomeTrend,
  }
}

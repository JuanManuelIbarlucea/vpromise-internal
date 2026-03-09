import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { calculateAgencyShare, getAgencyRate } from '@/lib/agency-share'

function getBudgetPeriod(contractDate: Date): { start: Date; end: Date } {
  const now = new Date()
  const contractMonth = contractDate.getUTCMonth()
  const contractDay = contractDate.getUTCDate()
  
  let periodStart = new Date(Date.UTC(now.getUTCFullYear(), contractMonth, contractDay))
  
  if (periodStart > now) {
    periodStart = new Date(Date.UTC(now.getUTCFullYear() - 1, contractMonth, contractDay))
  }
  
  const periodEnd = new Date(periodStart)
  periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1)
  
  return { start: periodStart, end: periodEnd }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const talent = await prisma.talent.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, salary: true } },
        manager: {
          select: {
            id: true,
            name: true,
            user: { select: { id: true } },
          },
        },
        expenses: {
          orderBy: { date: 'desc' },
        },
        incomes: {
          orderBy: { accountingMonth: 'desc' },
        },
      },
    })

    if (!talent) {
      return NextResponse.json({ error: 'Talent not found' }, { status: 404 })
    }

    const isAdmin = session.permission === 'ADMIN'
    const isTalentOwner = talent.user?.id === session.id
    const isManager = talent.manager?.user?.id === session.id

    if (!isAdmin && !isTalentOwner && !isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { start: budgetPeriodStart, end: budgetPeriodEnd } = getBudgetPeriod(talent.contractDate)

    const periodExpenses = talent.expenses.filter((e) => {
      const expenseDate = new Date(e.date)
      return expenseDate >= budgetPeriodStart && expenseDate < budgetPeriodEnd
    })

    const budgetExpenses = periodExpenses.filter((e) => !e.isSalary)

    const totalSpent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0)
    const remainingBudget = talent.annualBudget - totalSpent
    const budgetUsedPercent = (totalSpent / talent.annualBudget) * 100

    const expensesByCategory = budgetExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)

    const expensesByCategoryArray = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    const monthlyExpenses = budgetExpenses.reduce((acc, e) => {
      const month = new Date(e.date).toISOString().slice(0, 7)
      acc[month] = (acc[month] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)

    const monthlyExpensesArray = Object.entries(monthlyExpenses)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const periodIncomes = talent.incomes.filter((i) => {
      const incomeDate = new Date(i.accountingMonth)
      return incomeDate >= budgetPeriodStart && incomeDate < budgetPeriodEnd
    })

    const totalIncome = periodIncomes.reduce((sum, i) => sum + i.actualValueUSD, 0)

    const incomeByPlatform = periodIncomes.reduce((acc, i) => {
      acc[i.platform] = (acc[i.platform] || 0) + i.actualValueUSD
      return acc
    }, {} as Record<string, number>)

    const incomeByPlatformArray = Object.entries(incomeByPlatform)
      .map(([platform, amount]) => ({ platform, amount }))
      .sort((a, b) => b.amount - a.amount)

    const monthlyIncome = periodIncomes.reduce((acc, i) => {
      const month = new Date(i.accountingMonth).toISOString().slice(0, 7)
      acc[month] = (acc[month] || 0) + i.actualValueUSD
      return acc
    }, {} as Record<string, number>)

    const monthlyIncomeArray = Object.entries(monthlyIncome)
      .map(([month, amount]) => ({ 
        month, 
        amount,
        agencyShare: calculateAgencyShare(amount),
        agencyRate: getAgencyRate(amount),
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const totalAgencyShare = monthlyIncomeArray.reduce((sum, m) => sum + m.agencyShare, 0)

    // Compute salary debt balance month-by-month
    const monthlySalary = talent.user?.salary || 0

    // Use ALL incomes (not just period) for debt calculation since debt carries across periods
    const allMonthlyIncome = talent.incomes.reduce((acc, i) => {
      const month = new Date(i.accountingMonth).toISOString().slice(0, 7)
      acc[month] = (acc[month] || 0) + i.actualValueUSD
      return acc
    }, {} as Record<string, number>)

    const allMonths = Object.keys(allMonthlyIncome).sort()
    
    // Fill in missing months between first income and now
    if (allMonths.length > 0) {
      const now = new Date()
      const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
      let [y, m] = allMonths[0].split('-').map(Number)
      while (`${y}-${String(m).padStart(2, '0')}` <= currentMonth) {
        const key = `${y}-${String(m).padStart(2, '0')}`
        if (!allMonthlyIncome[key]) allMonthlyIncome[key] = 0
        m++
        if (m > 12) { m = 1; y++ }
      }
    }

    const sortedMonths = Object.keys(allMonthlyIncome).sort()
    let runningDebt = 0
    const debtBalance = sortedMonths.map((month) => {
      const monthTotal = allMonthlyIncome[month]
      const agencyShareForMonth = calculateAgencyShare(monthTotal)
      const rate = getAgencyRate(monthTotal)

      let salaryPaid = 0
      let salaryCoveredByDebt = false
      if (runningDebt >= monthlySalary) {
        salaryPaid = 0
        runningDebt -= monthlySalary
        salaryCoveredByDebt = true
      } else {
        salaryPaid = monthlySalary - runningDebt
        runningDebt = 0
      }

      runningDebt += agencyShareForMonth

      return {
        month,
        income: monthTotal,
        agencyShare: agencyShareForMonth,
        agencyRate: rate,
        salary: monthlySalary,
        salaryPaid,
        salaryCoveredByDebt,
        debtAfter: runningDebt,
      }
    })

    return NextResponse.json({
      talent: {
        id: talent.id,
        name: talent.name,
        contractDate: talent.contractDate,
        annualBudget: talent.annualBudget,
        manager: talent.manager ? { id: talent.manager.id, name: talent.manager.name } : null,
        twitch: talent.twitch,
        youtube: talent.youtube,
        tiktok: talent.tiktok,
        instagram: talent.instagram,
        twitter: talent.twitter,
      },
      budget: {
        annual: talent.annualBudget,
        spent: totalSpent,
        remaining: remainingBudget,
        usedPercent: budgetUsedPercent,
        periodStart: budgetPeriodStart,
        periodEnd: budgetPeriodEnd,
      },
      expenses: periodExpenses.map((e) => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        category: e.category,
        isRecurring: e.isRecurring,
        isSalary: e.isSalary,
        status: e.status,
        date: e.date,
      })),
      expensesByCategory: expensesByCategoryArray,
      monthlyExpenses: monthlyExpensesArray,
      income: {
        total: totalIncome,
        agencyShare: totalAgencyShare,
        count: periodIncomes.length,
        netFlow: totalAgencyShare - totalSpent,
      },
      incomes: periodIncomes.map((i) => ({
        id: i.id,
        accountingMonth: i.accountingMonth,
        platform: i.platform,
        currency: i.currency,
        referenceValue: i.referenceValue,
        actualValue: i.actualValue,
        actualValueUSD: i.actualValueUSD,
        description: i.description,
      })),
      incomeByPlatform: incomeByPlatformArray,
      monthlyIncome: monthlyIncomeArray,
      salary: monthlySalary,
      debtBalance,
    })
  } catch (error) {
    console.error('Get talent error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

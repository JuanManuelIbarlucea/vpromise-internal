import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

function getBudgetPeriod(contractDate: Date): { start: Date; end: Date } {
  const now = new Date()
  const contractMonth = contractDate.getMonth()
  const contractDay = contractDate.getDate()
  
  let periodStart = new Date(now.getFullYear(), contractMonth, contractDay)
  
  if (periodStart > now) {
    periodStart = new Date(now.getFullYear() - 1, contractMonth, contractDay)
  }
  
  const periodEnd = new Date(periodStart)
  periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  
  return { start: periodStart, end: periodEnd }
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getYearStart(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1)
}

function calculateAgencyShare(monthlyTotal: number) {
  const rate = monthlyTotal > 1000 ? 0.20 : 0.45
  return monthlyTotal * rate
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.permission !== 'MANAGER' && session.permission !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const whereClause = session.permission === 'ADMIN' 
      ? {} 
      : { managerId: session.managerId }

    const talents = await prisma.talent.findMany({
      where: whereClause,
      include: {
        manager: { select: { id: true, name: true } },
        expenses: { orderBy: { date: 'desc' } },
        incomes: { orderBy: { accountingMonth: 'desc' } },
      },
      orderBy: { name: 'asc' },
    })

    const now = new Date()
    const currentMonthStart = getMonthStart(now)
    const currentYearStart = getYearStart(now)

    const talentsData = talents.map((talent) => {
      const { start: budgetPeriodStart, end: budgetPeriodEnd } = getBudgetPeriod(talent.contractDate)

      const allExpenses = talent.expenses.filter(e => !e.isSalary)
      const monthlyExpenses = allExpenses.filter(e => new Date(e.date) >= currentMonthStart)
      const annualExpenses = allExpenses.filter(e => new Date(e.date) >= currentYearStart)
      const budgetPeriodExpenses = allExpenses.filter(e => {
        const d = new Date(e.date)
        return d >= budgetPeriodStart && d < budgetPeriodEnd
      })

      const allIncomes = talent.incomes
      const monthlyIncomes = allIncomes.filter(i => new Date(i.accountingMonth) >= currentMonthStart)
      const annualIncomes = allIncomes.filter(i => new Date(i.accountingMonth) >= currentYearStart)
      // Budget period incomes calculation (currently unused but may be needed in future)
      // const budgetPeriodIncomes = allIncomes.filter(i => {
      //   const d = new Date(i.accountingMonth)
      //   return d >= budgetPeriodStart && d < budgetPeriodEnd
      // })

      const sumExpenses = (expenses: typeof allExpenses) => expenses.reduce((sum, e) => sum + e.amount, 0)
      const sumIncomeWithAgency = (incomes: typeof allIncomes) => {
        const byMonth: Record<string, number> = {}
        incomes.forEach(i => {
          const month = new Date(i.accountingMonth).toISOString().slice(0, 7)
          byMonth[month] = (byMonth[month] || 0) + i.actualValueUSD
        })
        const totalIncome = Object.values(byMonth).reduce((sum, v) => sum + v, 0)
        const totalAgencyShare = Object.values(byMonth).reduce((sum, v) => sum + calculateAgencyShare(v), 0)
        return { totalIncome, totalAgencyShare, count: incomes.length }
      }

      const budgetSpent = sumExpenses(budgetPeriodExpenses)

      const monthlyExpensesByCategory = monthlyExpenses.reduce((acc, e) => {
        acc[e.category || 'Uncategorized'] = (acc[e.category || 'Uncategorized'] || 0) + e.amount
        return acc
      }, {} as Record<string, number>)

      const monthlyExpensesTrend = monthlyExpenses.reduce((acc, e) => {
        const day = new Date(e.date).toISOString().slice(0, 10)
        acc[day] = (acc[day] || 0) + e.amount
        return acc
      }, {} as Record<string, number>)

      const annualExpensesByMonth = allExpenses.filter(e => new Date(e.date) >= currentYearStart).reduce((acc, e) => {
        const month = new Date(e.date).toISOString().slice(0, 7)
        acc[month] = (acc[month] || 0) + e.amount
        return acc
      }, {} as Record<string, number>)

      const allTimeExpensesByYear = allExpenses.reduce((acc, e) => {
        const year = new Date(e.date).getFullYear().toString()
        acc[year] = (acc[year] || 0) + e.amount
        return acc
      }, {} as Record<string, number>)

      const monthlyIncomeByPlatform = monthlyIncomes.reduce((acc, i) => {
        acc[i.platform] = (acc[i.platform] || 0) + i.actualValueUSD
        return acc
      }, {} as Record<string, number>)

      const annualIncomeByMonth = allIncomes.filter(i => new Date(i.accountingMonth) >= currentYearStart).reduce((acc, i) => {
        const month = new Date(i.accountingMonth).toISOString().slice(0, 7)
        acc[month] = (acc[month] || 0) + i.actualValueUSD
        return acc
      }, {} as Record<string, number>)

      const allTimeIncomeByYear = allIncomes.reduce((acc, i) => {
        const year = new Date(i.accountingMonth).getFullYear().toString()
        acc[year] = (acc[year] || 0) + i.actualValueUSD
        return acc
      }, {} as Record<string, number>)

      return {
        id: talent.id,
        name: talent.name,
        contractDate: talent.contractDate,
        annualBudget: talent.annualBudget,
        manager: talent.manager,
        socials: {
          twitch: talent.twitch,
          youtube: talent.youtube,
          tiktok: talent.tiktok,
          instagram: talent.instagram,
          twitter: talent.twitter,
        },
        budget: {
          annual: talent.annualBudget,
          spent: budgetSpent,
          remaining: talent.annualBudget - budgetSpent,
          usedPercent: (budgetSpent / talent.annualBudget) * 100,
          periodStart: budgetPeriodStart,
          periodEnd: budgetPeriodEnd,
        },
        expenses: {
          monthly: {
            total: sumExpenses(monthlyExpenses),
            count: monthlyExpenses.length,
            byCategory: Object.entries(monthlyExpensesByCategory).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
            trend: Object.entries(monthlyExpensesTrend).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date)),
          },
          annual: {
            total: sumExpenses(annualExpenses),
            count: annualExpenses.length,
            byMonth: Object.entries(annualExpensesByMonth).map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month)),
          },
          allTime: {
            total: sumExpenses(allExpenses),
            count: allExpenses.length,
            byYear: Object.entries(allTimeExpensesByYear).map(([year, amount]) => ({ year, amount })).sort((a, b) => a.year.localeCompare(b.year)),
          },
          recent: allExpenses.slice(0, 10).map(e => ({
            id: e.id,
            description: e.description,
            amount: e.amount,
            category: e.category,
            isRecurring: e.isRecurring,
            status: e.status,
            date: e.date,
          })),
        },
        income: {
          monthly: {
            ...sumIncomeWithAgency(monthlyIncomes),
            byPlatform: Object.entries(monthlyIncomeByPlatform).map(([platform, amount]) => ({ platform, amount })).sort((a, b) => b.amount - a.amount),
          },
          annual: {
            ...sumIncomeWithAgency(annualIncomes),
            byMonth: Object.entries(annualIncomeByMonth).map(([month, amount]) => ({ 
              month, 
              amount,
              agencyShare: calculateAgencyShare(amount),
            })).sort((a, b) => a.month.localeCompare(b.month)),
          },
          allTime: {
            ...sumIncomeWithAgency(allIncomes),
            byYear: Object.entries(allTimeIncomeByYear).map(([year, amount]) => ({ year, amount })).sort((a, b) => a.year.localeCompare(b.year)),
          },
          recent: allIncomes.slice(0, 10).map(i => ({
            id: i.id,
            platform: i.platform,
            description: i.description,
            amount: i.actualValueUSD,
            date: i.accountingMonth,
            accountingMonth: i.accountingMonth,
            currency: i.currency,
            referenceValue: i.referenceValue,
            actualValue: i.actualValue,
            actualValueUSD: i.actualValueUSD,
          })),
        },
      }
    })

    const summary = {
      totalTalents: talents.length,
      totalBudget: talentsData.reduce((sum, t) => sum + t.budget.annual, 0),
      totalSpent: talentsData.reduce((sum, t) => sum + t.budget.spent, 0),
      totalRemaining: talentsData.reduce((sum, t) => sum + t.budget.remaining, 0),
      monthlyExpenses: talentsData.reduce((sum, t) => sum + t.expenses.monthly.total, 0),
      annualExpenses: talentsData.reduce((sum, t) => sum + t.expenses.annual.total, 0),
      allTimeExpenses: talentsData.reduce((sum, t) => sum + t.expenses.allTime.total, 0),
      monthlyIncome: talentsData.reduce((sum, t) => sum + t.income.monthly.totalIncome, 0),
      annualIncome: talentsData.reduce((sum, t) => sum + t.income.annual.totalIncome, 0),
      allTimeIncome: talentsData.reduce((sum, t) => sum + t.income.allTime.totalIncome, 0),
      monthlyAgencyShare: talentsData.reduce((sum, t) => sum + t.income.monthly.totalAgencyShare, 0),
      annualAgencyShare: talentsData.reduce((sum, t) => sum + t.income.annual.totalAgencyShare, 0),
      allTimeAgencyShare: talentsData.reduce((sum, t) => sum + t.income.allTime.totalAgencyShare, 0),
    }

    return NextResponse.json({ talents: talentsData, summary })
  } catch (error) {
    console.error('Manager talents error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


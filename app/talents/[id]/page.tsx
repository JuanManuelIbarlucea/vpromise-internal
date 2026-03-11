'use client'

import { use, useState, useMemo } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import {
  Wallet,
  Receipt,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Banknote,
  ChevronDown,
  ChevronRight,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { ExpenseForm } from '@/components/expense-form'
import { IncomeFormDialog } from '@/components/income-form-dialog'

type TalentPageData = {
  talent: {
    id: string
    name: string
    contractDate: string
    annualBudget: number
    managers: { id: string; name: string }[]
    twitch?: string | null
    youtube?: string | null
    tiktok?: string | null
    instagram?: string | null
    twitter?: string | null
  }
  budget: {
    annual: number
    spent: number
    remaining: number
    usedPercent: number
    periodStart: string
    periodEnd: string
  }
  expenses: {
    id: string
    description: string
    amount: number
    category: string
    isRecurring: boolean
    isSalary: boolean
    status: string
    date: string
  }[]
  expensesByCategory: { category: string; amount: number }[]
  monthlyExpenses: { month: string; amount: number }[]
  income: {
    total: number
    agencyShare: number
    count: number
    netFlow: number
  }
  incomes: {
    id: string
    accountingMonth: string
    platform: string
    currency: string
    referenceValue: number
    actualValue: number
    actualValueUSD: number
    description: string
  }[]
  incomeByPlatform: { platform: string; amount: number }[]
  monthlyIncome: { month: string; amount: number; agencyShare: number; agencyRate: number }[]
  salary: number
  debtBalance: {
    month: string
    income: number
    agencyShare: number
    agencyRate: number
    salary: number
    salaryPaid: number
    salaryCoveredByDebt: boolean
    debtAfter: number
  }[]
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#14b8a6']

const PLATFORM_COLORS: Record<string, string> = {
  TWITCH: '#9146ff',
  YOUTUBE: '#ff0000',
  KOFI: '#ff5e5b',
  STREAMLOOTS: '#f97316',
  PAYPAL: '#003087',
  MERCHANDISE: '#10b981',
  ADJUSTMENT: '#eab308',
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '10px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  padding: '8px 12px',
  fontSize: '13px',
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatMonth(month: string) {
  const [year, m] = month.split('-')
  const date = new Date(parseInt(year), parseInt(m) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export default function TalentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { isAdmin } = useAuth()
  const { data, isLoading, error, mutate } = useSWR<TalentPageData>(`/api/talents/${id}`, fetcher)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading talent data...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-destructive">
          {error?.message === 'Failed to fetch' ? 'Access denied or talent not found' : 'Failed to load talent data'}
        </div>
      </div>
    )
  }

  return <TalentDetailView data={data} onMutate={() => mutate()} isAdmin={isAdmin} />
}

function TalentDetailView({ data, onMutate, isAdmin }: { data: TalentPageData; onMutate: () => void; isAdmin: boolean }) {
  const { talent, budget, expenses: allExpenses, incomes, salary, debtBalance } = data
  const expenses = allExpenses.filter(e => !e.isSalary)

  const budgetStatus = budget.usedPercent >= 100
    ? 'over'
    : budget.usedPercent >= 80
      ? 'warning'
      : 'good'

  const currentDebt = debtBalance.length > 0 ? debtBalance[debtBalance.length - 1].debtAfter : 0

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    for (const e of expenses) years.add(new Date(e.date).toISOString().slice(0, 4))
    for (const i of incomes) years.add(new Date(i.accountingMonth).toISOString().slice(0, 4))
    years.add(new Date().getFullYear().toString())
    return [...years].sort().reverse()
  }, [expenses, incomes])

  const [chartYear, setChartYear] = useState(() => new Date().getFullYear().toString())

  const incomeByMonth = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {}
    for (const entry of incomes) {
      const month = new Date(entry.accountingMonth).toISOString().slice(0, 7)
      if (!grouped[month]) grouped[month] = {}
      grouped[month][entry.platform] = (grouped[month][entry.platform] || 0) + entry.actualValueUSD
    }
    return Object.keys(grouped).sort().reverse().map(month => ({
      month,
      platforms: Object.entries(grouped[month])
        .map(([platform, amount]) => ({ platform, amount }))
        .filter(p => p.amount > 0)
        .sort((a, b) => b.amount - a.amount),
      total: Object.values(grouped[month]).reduce((s, v) => s + v, 0),
    }))
  }, [incomes])

  const [platformMonth, setPlatformMonth] = useState(() => incomeByMonth[0]?.month ?? '')
  const platformData = incomeByMonth.find(m => m.month === platformMonth)

  const expensesByMonth = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {}
    for (const e of expenses) {
      const month = new Date(e.date).toISOString().slice(0, 7)
      if (!grouped[month]) grouped[month] = {}
      const cat = e.category || 'Uncategorized'
      grouped[month][cat] = (grouped[month][cat] || 0) + e.amount
    }
    return Object.keys(grouped).sort().reverse().map(month => ({
      month,
      categories: Object.entries(grouped[month])
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      total: Object.values(grouped[month]).reduce((s, v) => s + v, 0),
    }))
  }, [expenses])

  const [expenseMonth, setExpenseMonth] = useState(() => expensesByMonth[0]?.month ?? '')
  const expenseCatData = expensesByMonth.find(m => m.month === expenseMonth)

  const annualChartData = useMemo(() => {
    const expByMonth: Record<string, number> = {}
    for (const e of expenses) {
      const m = new Date(e.date).toISOString().slice(0, 7)
      if (m.startsWith(chartYear)) expByMonth[m] = (expByMonth[m] || 0) + e.amount
    }
    const incByMonth: Record<string, number> = {}
    for (const i of incomes) {
      const m = new Date(i.accountingMonth).toISOString().slice(0, 7)
      if (m.startsWith(chartYear)) incByMonth[m] = (incByMonth[m] || 0) + i.actualValueUSD
    }

    const allMonthKeys = [...new Set([...Object.keys(expByMonth), ...Object.keys(incByMonth)])]
    const lastMonthWithData = allMonthKeys.sort().pop() ?? ''

    return Array.from({ length: 12 }, (_, i) => {
      const month = `${chartYear}-${String(i + 1).padStart(2, '0')}`
      const hasData = month <= lastMonthWithData
      const income = incByMonth[month] || 0
      const exp = expByMonth[month] || 0
      return {
        label: MONTH_LABELS[i],
        expenses: hasData ? exp : null,
        income: hasData ? income : null,
        agencyShare: hasData ? (income >= 1000 ? income * 0.25 : income * 0.45) : null,
      }
    })
  }, [chartYear, expenses, incomes])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{talent.name}</h1>
          <p className="text-muted-foreground">
            {talent.managers?.length > 0 ? `Managed by ${talent.managers.map((m: { name: string }) => m.name).join(', ')}` : 'No manager assigned'}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="size-4" />
            Contract: {formatDate(talent.contractDate)} • Budget: {formatDate(budget.periodStart)} – {formatDate(budget.periodEnd)}
          </div>
        </div>
        <div className="flex gap-2">
          <IncomeFormDialog talentId={talent.id} talentName={talent.name} onSuccess={onMutate} />
          <ExpenseForm onSuccess={onMutate} talentId={talent.id} talentName={talent.name} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Annual Budget</CardTitle>
            <Wallet className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(budget.annual)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            <Receipt className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(budget.spent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            {budgetStatus === 'over' || budgetStatus === 'warning' ? (
              <AlertTriangle className={`size-4 ${budgetStatus === 'over' ? 'text-red-500' : 'text-amber-500'}`} />
            ) : (
              <CheckCircle className="size-4 text-emerald-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              budgetStatus === 'over' ? 'text-red-600 dark:text-red-400'
                : budgetStatus === 'warning' ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {formatCurrency(budget.remaining)}
            </div>
            <p className="text-xs text-muted-foreground">{budget.usedPercent.toFixed(0)}% used</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Debt</CardTitle>
            <TrendingUp className={`size-4 ${currentDebt > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentDebt > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {currentDebt > 0 ? '-' : ''}{formatCurrency(currentDebt)}
            </div>
            <p className="text-xs text-muted-foreground">{currentDebt > 0 ? 'Owed to VPromise' : 'No outstanding debt'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Income &amp; Expenses
            </CardTitle>
            <CardDescription>Monthly breakdown by year</CardDescription>
          </div>
          <select
            value={chartYear}
            onChange={(e) => setChartYear(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={annualChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="agencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84cc16" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#84cc16" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `$${v}`} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    name === 'income' ? 'Income' : name === 'agencyShare' ? 'Agency Share' : 'Expenses'
                  ]}
                  labelFormatter={(label) => `${label} ${chartYear}`}
                  contentStyle={chartTooltipStyle}
                />
                <Legend
                  formatter={(value) => value === 'income' ? 'Income' : value === 'agencyShare' ? 'Agency Share' : 'Expenses'}
                  iconType="circle"
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fill="url(#incomeGradient)" connectNulls={false} />
                <Area type="monotone" dataKey="agencyShare" stroke="#84cc16" strokeWidth={2} fill="url(#agencyGradient)" connectNulls={false} />
                <Area type="monotone" dataKey="expenses" stroke="#8b5cf6" strokeWidth={2} fill="url(#expenseGradient)" connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5" />
                Income by Platform
              </CardTitle>
              <CardDescription>
                {platformData ? `${formatMonth(platformData.month)} — ${formatCurrency(platformData.total)}` : 'No income data'}
              </CardDescription>
            </div>
            {incomeByMonth.length > 0 && (
              <select
                value={platformMonth}
                onChange={(e) => setPlatformMonth(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                {incomeByMonth.map(m => (
                  <option key={m.month} value={m.month}>{formatMonth(m.month)}</option>
                ))}
              </select>
            )}
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {platformData && platformData.platforms.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformData.platforms}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="amount"
                      nameKey="platform"
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {platformData.platforms.map((entry, i) => (
                        <Cell key={i} fill={PLATFORM_COLORS[entry.platform] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={chartTooltipStyle} />
                    <Legend verticalAlign="bottom" iconType="circle" formatter={(value) => <span className="text-xs">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No income data</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="size-5" />
                Expenses by Category
              </CardTitle>
              <CardDescription>
                {expenseCatData ? `${formatMonth(expenseCatData.month)} — ${formatCurrency(expenseCatData.total)}` : 'No expense data'}
              </CardDescription>
            </div>
            {expensesByMonth.length > 0 && (
              <select
                value={expenseMonth}
                onChange={(e) => setExpenseMonth(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                {expensesByMonth.map(m => (
                  <option key={m.month} value={m.month}>{formatMonth(m.month)}</option>
                ))}
              </select>
            )}
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {expenseCatData && expenseCatData.categories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCatData.categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="amount"
                      nameKey="category"
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {expenseCatData.categories.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={chartTooltipStyle} />
                    <Legend verticalAlign="bottom" iconType="circle" formatter={(value) => <span className="text-xs">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No expense data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeHistoryCard incomes={incomes} talentId={talent.id} talentName={talent.name} isAdmin={isAdmin} onMutate={onMutate} />
        <ExpenseHistoryCard expenses={expenses} />
      </div>

      {salary > 0 && debtBalance && debtBalance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="size-5" />
              Salary & Debt Balance
            </CardTitle>
            <CardDescription>
              Monthly salary: {formatCurrency(salary)} — Agency share accumulates as debt toward salary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Income</TableHead>
                  <TableHead className="text-right">Agency Share</TableHead>
                  <TableHead className="text-right">Salary</TableHead>
                  <TableHead className="text-right">VPromise Pays</TableHead>
                  <TableHead className="text-right">Running Debt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debtBalance.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium">{formatMonth(row.month)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(row.income)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-lime-600 dark:text-lime-400">
                      {formatCurrency(row.agencyShare)}
                      <span className="text-xs text-muted-foreground ml-1">({(row.agencyRate * 100).toFixed(0)}%)</span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(row.salary)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {row.salaryCoveredByDebt ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="size-3" />
                          Covered
                        </span>
                      ) : row.salaryPaid < row.salary ? (
                        <span className="text-amber-600 dark:text-amber-400">
                          {formatCurrency(row.salaryPaid)}
                        </span>
                      ) : (
                        <span>{formatCurrency(row.salaryPaid)}</span>
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${row.debtAfter > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                      {row.debtAfter > 0 ? formatCurrency(row.debtAfter) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {debtBalance.length > 0 && (
              <div className="mt-4 flex items-center gap-4 p-3 rounded-lg bg-muted/50 text-sm">
                <div>
                  <span className="text-muted-foreground">Current Debt: </span>
                  <span className={`font-bold ${currentDebt > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {currentDebt > 0 ? formatCurrency(currentDebt) : 'No debt'}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  {currentDebt >= salary
                    ? `Next month's salary is already covered`
                    : currentDebt > 0
                      ? `${formatCurrency(salary - currentDebt)} needed for next salary`
                      : 'Full salary payment needed next month'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

type IncomeEntry = TalentPageData['incomes'][number]

function IncomeHistoryCard({ incomes, talentId, talentName, isAdmin, onMutate }: {
  incomes: IncomeEntry[]
  talentId: string
  talentName: string
  isAdmin: boolean
  onMutate: () => void
}) {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(() => new Set([new Date().getFullYear().toString()]))
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => {
    const now = new Date()
    return new Set([`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`])
  })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (incomeId: string) => {
    if (!confirm('Are you sure you want to delete this income entry?')) return
    setDeletingId(incomeId)
    try {
      const response = await fetch(`/api/admin/income/${incomeId}`, { method: 'DELETE' })
      if (response.ok) onMutate()
    } catch (error) {
      console.error('Failed to delete income:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const grouped = useMemo(() => {
    const byYearMonth: Record<string, Record<string, IncomeEntry[]>> = {}
    for (const entry of incomes) {
      const d = new Date(entry.accountingMonth)
      const year = d.getUTCFullYear().toString()
      const month = `${year}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
      if (!byYearMonth[year]) byYearMonth[year] = {}
      if (!byYearMonth[year][month]) byYearMonth[year][month] = []
      byYearMonth[year][month].push(entry)
    }
    return Object.entries(byYearMonth)
      .map(([year, months]) => ({
        year,
        months: Object.entries(months)
          .map(([month, entries]) => ({
            month,
            entries: entries.sort((a, b) => new Date(b.accountingMonth).getTime() - new Date(a.accountingMonth).getTime()),
            total: entries.reduce((sum, e) => sum + e.actualValueUSD, 0),
          }))
          .sort((a, b) => b.month.localeCompare(a.month)),
        total: Object.values(months).flat().reduce((sum, e) => sum + e.actualValueUSD, 0),
      }))
      .sort((a, b) => b.year.localeCompare(a.year))
  }, [incomes])

  const toggleYear = (year: string) => {
    setExpandedYears(prev => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year); else next.add(year)
      return next
    })
  }
  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev)
      if (next.has(month)) next.delete(month); else next.add(month)
      return next
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Income History</CardTitle>
          <CardDescription>{incomes.length} total entries</CardDescription>
        </div>
        {isAdmin && (
          <IncomeFormDialog talentId={talentId} talentName={talentName} onSuccess={onMutate} />
        )}
      </CardHeader>
      <CardContent>
        {grouped.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No income recorded</p>
        ) : (
          <div className="space-y-2">
            {grouped.map((yearGroup) => (
              <div key={yearGroup.year} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleYear(yearGroup.year)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {expandedYears.has(yearGroup.year) ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    <span className="font-semibold text-lg">{yearGroup.year}</span>
                    <span className="text-sm text-muted-foreground">({yearGroup.months.reduce((s, m) => s + m.entries.length, 0)} entries)</span>
                  </div>
                  <span className="font-mono font-semibold text-green-600 dark:text-green-400">{formatCurrency(yearGroup.total)}</span>
                </button>

                {expandedYears.has(yearGroup.year) && (
                  <div className="border-t">
                    {yearGroup.months.map((monthGroup) => (
                      <div key={monthGroup.month}>
                        <button
                          onClick={() => toggleMonth(monthGroup.month)}
                          className="w-full flex items-center justify-between px-6 py-2 hover:bg-muted/30 transition-colors border-b"
                        >
                          <div className="flex items-center gap-2">
                            {expandedMonths.has(monthGroup.month) ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                            <span className="font-medium">{formatMonth(monthGroup.month)}</span>
                            <span className="text-xs text-muted-foreground">({monthGroup.entries.length} entries)</span>
                          </div>
                          <span className="font-mono text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(monthGroup.total)}</span>
                        </button>

                        {expandedMonths.has(monthGroup.month) && (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="pl-10">Month</TableHead>
                                <TableHead>Platform</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {monthGroup.entries.map((inc) => (
                                <TableRow key={inc.id}>
                                  <TableCell className="pl-10 text-muted-foreground">
                                    {formatMonth(new Date(inc.accountingMonth).toISOString().slice(0, 7))}
                                  </TableCell>
                                  <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                      inc.platform === 'YOUTUBE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                      inc.platform === 'TWITCH' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' :
                                      inc.platform === 'KOFI' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' :
                                      inc.platform === 'STREAMLOOTS' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                      inc.platform === 'ADJUSTMENT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}>
                                      {inc.platform}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{inc.description}</TableCell>
                                  <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                                    {formatCurrency(inc.actualValueUSD)}
                                  </TableCell>
                                  {isAdmin && (
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <IncomeFormDialog talentId={talentId} talentName={talentName} income={inc} onSuccess={onMutate} />
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDelete(inc.id)}
                                          disabled={deletingId === inc.id}
                                          className="text-destructive hover:text-destructive"
                                        >
                                          {deletingId === inc.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                        </Button>
                                      </div>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type ExpenseEntry = TalentPageData['expenses'][number]

function ExpenseHistoryCard({ expenses }: { expenses: ExpenseEntry[] }) {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(() => new Set([new Date().getFullYear().toString()]))
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => {
    const now = new Date()
    return new Set([`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`])
  })

  const grouped = useMemo(() => {
    const byYearMonth: Record<string, Record<string, ExpenseEntry[]>> = {}
    for (const entry of expenses) {
      const d = new Date(entry.date)
      const year = d.getUTCFullYear().toString()
      const month = `${year}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
      if (!byYearMonth[year]) byYearMonth[year] = {}
      if (!byYearMonth[year][month]) byYearMonth[year][month] = []
      byYearMonth[year][month].push(entry)
    }
    return Object.entries(byYearMonth)
      .map(([year, months]) => ({
        year,
        months: Object.entries(months)
          .map(([month, entries]) => ({
            month,
            entries: entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            total: entries.reduce((sum, e) => sum + e.amount, 0),
          }))
          .sort((a, b) => b.month.localeCompare(a.month)),
        total: Object.values(months).flat().reduce((sum, e) => sum + e.amount, 0),
      }))
      .sort((a, b) => b.year.localeCompare(a.year))
  }, [expenses])

  const toggleYear = (year: string) => {
    setExpandedYears(prev => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year); else next.add(year)
      return next
    })
  }
  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev)
      if (next.has(month)) next.delete(month); else next.add(month)
      return next
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense History</CardTitle>
        <CardDescription>{expenses.length} total entries</CardDescription>
      </CardHeader>
      <CardContent>
        {grouped.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No expenses recorded</p>
        ) : (
          <div className="space-y-2">
            {grouped.map((yearGroup) => (
              <div key={yearGroup.year} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleYear(yearGroup.year)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {expandedYears.has(yearGroup.year) ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    <span className="font-semibold text-lg">{yearGroup.year}</span>
                    <span className="text-sm text-muted-foreground">({yearGroup.months.reduce((s, m) => s + m.entries.length, 0)} entries)</span>
                  </div>
                  <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">{formatCurrency(yearGroup.total)}</span>
                </button>

                {expandedYears.has(yearGroup.year) && (
                  <div className="border-t">
                    {yearGroup.months.map((monthGroup) => (
                      <div key={monthGroup.month}>
                        <button
                          onClick={() => toggleMonth(monthGroup.month)}
                          className="w-full flex items-center justify-between px-6 py-2 hover:bg-muted/30 transition-colors border-b"
                        >
                          <div className="flex items-center gap-2">
                            {expandedMonths.has(monthGroup.month) ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                            <span className="font-medium">{formatMonth(monthGroup.month)}</span>
                            <span className="text-xs text-muted-foreground">({monthGroup.entries.length} entries)</span>
                          </div>
                          <span className="font-mono text-sm font-medium text-purple-600 dark:text-purple-400">{formatCurrency(monthGroup.total)}</span>
                        </button>

                        {expandedMonths.has(monthGroup.month) && (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="pl-10">Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {monthGroup.entries.map((expense) => (
                                <TableRow key={expense.id}>
                                  <TableCell className="pl-10 text-muted-foreground">{formatDate(expense.date)}</TableCell>
                                  <TableCell className="font-medium">{expense.description}</TableCell>
                                  <TableCell>
                                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                      {expense.category}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-purple-600 dark:text-purple-400">{formatCurrency(expense.amount)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
  ExternalLink,
  Wallet,
  Users,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/hooks/useAuth'

type SimpleTalent = {
  id: string
  name: string
  contractDate: string
  annualBudget: number
  manager?: { id: string; name: string } | null
}

type TalentData = {
  id: string
  name: string
  contractDate: string
  annualBudget: number
  manager: { id: string; name: string } | null
  currentDebt: number
  budget: {
    annual: number
    spent: number
    remaining: number
    usedPercent: number
    periodStart: string
    periodEnd: string
  }
  expenses: {
    monthly: { total: number; count: number; byCategory: { category: string; amount: number }[] }
    annual: { total: number; count: number; byMonth: { month: string; amount: number }[] }
    allTime: { total: number; count: number; byYear: { year: string; amount: number }[] }
    recent: { id: string; description: string; amount: number; category: string; isRecurring: boolean; status: string; date: string }[]
    all: { id: string; description: string; amount: number; category: string; isRecurring: boolean; status: string; date: string }[]
  }
  income: {
    monthly: { totalIncome: number; totalAgencyShare: number; count: number; byPlatform: { platform: string; amount: number }[] }
    annual: { totalIncome: number; totalAgencyShare: number; count: number; byMonth: { month: string; amount: number; agencyShare: number }[] }
    allTime: { totalIncome: number; totalAgencyShare: number; count: number; byYear: { year: string; amount: number }[] }
    all: { id: string; platform: string; description: string; amount: number; date: string; accountingMonth?: string; currency?: string; referenceValue?: number; actualValue?: number; actualValueUSD?: number }[]
  }
}

type IncomeFormData = {
  date: string
  platform: string
  currency: string
  referenceValue: string
  actualValue: string
  actualValueUSD: string
  description: string
}

const PLATFORMS = ['YOUTUBE', 'TWITCH', 'STREAMLOOTS', 'KOFI', 'MERCHANDISE', 'PAYPAL', 'ADJUSTMENT']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'BRL', 'ARS']

type ManagerTalentsData = {
  talents: TalentData[]
  summary: {
    totalTalents: number
    totalBudget: number
    totalSpent: number
    totalRemaining: number
    monthlyExpenses: number
    annualExpenses: number
    allTimeExpenses: number
    monthlyIncome: number
    annualIncome: number
    allTimeIncome: number
    monthlyAgencyShare: number
    annualAgencyShare: number
    allTimeAgencyShare: number
  }
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

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatMonth(month: string) {
  const [year, m] = month.split('-')
  const date = new Date(parseInt(year), parseInt(m) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export default function TalentsPage() {
  const { user } = useAuth()
  const isManager = user?.permission === 'MANAGER'
  
  const { data: simpleTalents, isLoading: simpleLoading } = useSWR<SimpleTalent[]>(
    !isManager ? '/api/talents' : null,
    fetcher
  )
  const { data: managerData, isLoading: managerLoading, mutate: mutateManagerData } = useSWR<ManagerTalentsData>(
    isManager ? '/api/manager/talents' : null,
    fetcher
  )

  if (isManager) {
    return <ManagerTalentsView data={managerData} isLoading={managerLoading} onMutate={mutateManagerData} />
  }

  return <SimpleTalentsView talents={simpleTalents} isLoading={simpleLoading} user={user} />
}

function SimpleTalentsView({ 
  talents, 
  isLoading, 
  user 
}: { 
  talents: SimpleTalent[] | undefined
  isLoading: boolean
  user: ReturnType<typeof useAuth>['user']
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Talents</h1>
        <p className="text-muted-foreground">View talent profiles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            All Talents
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${talents?.length ?? 0} talents`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Loading talents...</div>
            </div>
          ) : talents && talents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Contract Date</TableHead>
                  <TableHead>Annual Budget</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {talents.map((talent) => (
                  <TableRow key={talent.id}>
                    <TableCell className="font-medium">{talent.name}</TableCell>
                    <TableCell>
                      {talent.manager ? (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          {talent.manager.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(talent.contractDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </TableCell>
<TableCell>
                                      <span className="font-mono text-sm">{formatCurrency(talent.annualBudget)}</span>
                                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/talents/${talent.id}`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Wallet className="size-4" />
                          View Budget
                          <ExternalLink className="size-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="size-12 mb-4 opacity-50" />
              <p>No talents found</p>
              {user?.permission === 'USER' && user?.talentId && (
                <Link href={`/talents/${user.talentId}`} className="mt-4">
                  <Button variant="outline" className="gap-2">
                    <Wallet className="size-4" />
                    View My Budget
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ManagerTalentsView({ 
  data, 
  isLoading,
  onMutate,
}: { 
  data: ManagerTalentsData | undefined
  isLoading: boolean
  onMutate: () => void
}) {
  const [selectedTalent, setSelectedTalent] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading talent data...</div>
      </div>
    )
  }

  if (!data || data.talents.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Talents</h1>
          <p className="text-muted-foreground">Manage and track your talents</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="size-16 mb-4 opacity-50" />
          <p className="text-lg">No talents assigned to you</p>
        </div>
      </div>
    )
  }

  const activeTalent = selectedTalent 
    ? data.talents.find(t => t.id === selectedTalent) 
    : data.talents[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Talents</h1>
        <p className="text-muted-foreground">
          {data.summary.totalTalents} talent{data.summary.totalTalents !== 1 ? 's' : ''} under management
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {data.talents.map((talent) => (
          <Button
            key={talent.id}
            variant={activeTalent?.id === talent.id ? 'default' : 'outline'}
            onClick={() => setSelectedTalent(talent.id)}
            className="gap-2"
          >
            <Users className="size-4" />
            {talent.name}
          </Button>
        ))}
      </div>

      {activeTalent && <TalentDetailView talent={activeTalent} onMutate={onMutate} />}
    </div>
  )
}

function TalentDetailView({ talent, onMutate }: { talent: TalentData; onMutate: () => void }) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteIncome = async (incomeId: string) => {
    if (!confirm('Are you sure you want to delete this income entry?')) return
    setDeletingId(incomeId)
    try {
      const response = await fetch(`/api/manager/income/${incomeId}`, { method: 'DELETE' })
      if (response.ok) onMutate()
    } catch (error) {
      console.error('Failed to delete income:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const budgetStatus = talent.budget.usedPercent >= 100 
    ? 'over' 
    : talent.budget.usedPercent >= 80 
      ? 'warning' 
      : 'good'

  // Derive available years from all expenses and income
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    for (const e of talent.expenses.all) years.add(new Date(e.date).toISOString().slice(0, 4))
    for (const i of talent.income.all) years.add(new Date(i.date).toISOString().slice(0, 4))
    years.add(new Date().getFullYear().toString())
    return [...years].sort().reverse()
  }, [talent.expenses.all, talent.income.all])

  const [chartYear, setChartYear] = useState(() => new Date().getFullYear().toString())

  // All months that have income or expenses (for dropdowns)
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    for (const e of talent.expenses.all) months.add(new Date(e.date).toISOString().slice(0, 7))
    for (const i of talent.income.all) months.add(new Date(i.date).toISOString().slice(0, 7))
    return [...months].sort().reverse()
  }, [talent.expenses.all, talent.income.all])

  // Income by platform grouped by month
  const incomeByMonth = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {}
    for (const entry of talent.income.all) {
      const month = new Date(entry.date).toISOString().slice(0, 7)
      if (!grouped[month]) grouped[month] = {}
      grouped[month][entry.platform] = (grouped[month][entry.platform] || 0) + entry.amount
    }
    return Object.keys(grouped).sort().reverse().map(month => ({
      month,
      platforms: Object.entries(grouped[month])
        .map(([platform, amount]) => ({ platform, amount }))
        .filter(p => p.amount > 0)
        .sort((a, b) => b.amount - a.amount),
      total: Object.values(grouped[month]).reduce((s, v) => s + v, 0),
    }))
  }, [talent.income.all])

  const [platformMonth, setPlatformMonth] = useState(() => incomeByMonth[0]?.month ?? '')
  const platformData = incomeByMonth.find(m => m.month === platformMonth)

  // Expenses by category grouped by month
  const expensesByMonth = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {}
    for (const e of talent.expenses.all) {
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
  }, [talent.expenses.all])

  const [expenseMonth, setExpenseMonth] = useState(() => expensesByMonth[0]?.month ?? '')
  const expenseCatData = expensesByMonth.find(m => m.month === expenseMonth)

  // Build annual chart data for selected year from raw data
  const annualChartData = useMemo(() => {
    const expByMonth: Record<string, number> = {}
    for (const e of talent.expenses.all) {
      const m = new Date(e.date).toISOString().slice(0, 7)
      if (m.startsWith(chartYear)) expByMonth[m] = (expByMonth[m] || 0) + e.amount
    }
    const incByMonth: Record<string, number> = {}
    for (const i of talent.income.all) {
      const m = new Date(i.date).toISOString().slice(0, 7)
      if (m.startsWith(chartYear)) incByMonth[m] = (incByMonth[m] || 0) + i.amount
    }

    const allMonthKeys = [...new Set([...Object.keys(expByMonth), ...Object.keys(incByMonth)])]
    const lastMonthWithData = allMonthKeys.sort().pop() ?? ''

    return Array.from({ length: 12 }, (_, i) => {
      const month = `${chartYear}-${String(i + 1).padStart(2, '0')}`
      const hasData = month <= lastMonthWithData
      const income = incByMonth[month] || 0
      const expenses = expByMonth[month] || 0
      return {
        label: MONTH_LABELS[i],
        expenses: hasData ? expenses : null,
        income: hasData ? income : null,
        agencyShare: hasData ? (income >= 1000 ? income * 0.25 : income * 0.45) : null,
      }
    })
  }, [chartYear, talent.expenses.all, talent.income.all])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{talent.name}</h2>
          <p className="text-sm text-muted-foreground">
            Contract: {formatDate(talent.contractDate)} • Budget: {formatDate(talent.budget.periodStart)} – {formatDate(talent.budget.periodEnd)}
          </p>
        </div>
        <Link href={`/talents/${talent.id}`}>
          <Button variant="outline" className="gap-2">
            <ExternalLink className="size-4" />
            Full Details
          </Button>
        </Link>
      </div>

      {/* Budget summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Annual Budget</CardTitle>
            <Wallet className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(talent.budget.annual)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            <Receipt className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(talent.budget.spent)}</div>
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
              {formatCurrency(talent.budget.remaining)}
            </div>
            <p className="text-xs text-muted-foreground">{talent.budget.usedPercent.toFixed(0)}% used</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Debt</CardTitle>
            <TrendingUp className={`size-4 ${talent.currentDebt > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${talent.currentDebt > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {talent.currentDebt > 0 ? '-' : ''}{formatCurrency(talent.currentDebt)}
            </div>
            <p className="text-xs text-muted-foreground">{talent.currentDebt > 0 ? 'Owed to VPromise' : 'No outstanding debt'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Income & Expenses chart — year selector */}
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

      {/* Income by Platform (month selector) + Expenses by Category (this month) */}
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

      {/* Expense History + Income History */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ExpenseHistoryCard talent={talent} />
        <IncomeHistoryCard talent={talent} onMutate={onMutate} deletingId={deletingId} onDeleteIncome={handleDeleteIncome} />
      </div>
    </div>
  )
}

type ExpenseEntry = TalentData['expenses']['all'][number]

function groupExpensesByYearMonth(expenses: ExpenseEntry[]) {
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
}

function ExpenseHistoryCard({ talent }: { talent: TalentData }) {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(() => new Set([new Date().getFullYear().toString()]))
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => {
    const now = new Date()
    return new Set([`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`])
  })

  const grouped = groupExpensesByYearMonth(talent.expenses.all)

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
        <CardDescription>{talent.expenses.all.length} total entries</CardDescription>
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

type IncomeEntry = TalentData['income']['all'][number]

type GroupedByMonth = {
  month: string
  entries: IncomeEntry[]
  total: number
}

type GroupedByYear = {
  year: string
  months: GroupedByMonth[]
  total: number
}

function groupIncomeByYearMonth(incomes: IncomeEntry[]): GroupedByYear[] {
  const byYearMonth: Record<string, Record<string, IncomeEntry[]>> = {}
  
  for (const entry of incomes) {
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
}

function IncomeHistoryCard({ talent, onMutate, deletingId, onDeleteIncome }: {
  talent: TalentData
  onMutate: () => void
  deletingId: string | null
  onDeleteIncome: (id: string) => void
}) {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(() => {
    const currentYear = new Date().getFullYear().toString()
    return new Set([currentYear])
  })
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return new Set([currentMonth])
  })

  const grouped = groupIncomeByYearMonth(talent.income.all)

  const toggleYear = (year: string) => {
    setExpandedYears(prev => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev)
      if (next.has(month)) next.delete(month)
      else next.add(month)
      return next
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Income History</CardTitle>
          <CardDescription>{talent.income.all.length} total entries</CardDescription>
        </div>
        <IncomeFormDialog talentId={talent.id} talentName={talent.name} onSuccess={onMutate} />
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
                    <span className="text-sm text-muted-foreground">({yearGroup.months.reduce((sum, m) => sum + m.entries.length, 0)} entries)</span>
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
                                <TableHead className="pl-10">Date</TableHead>
                                <TableHead>Platform</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {monthGroup.entries.map((income) => (
                                <TableRow key={income.id}>
                                  <TableCell className="pl-10 text-muted-foreground">{formatDate(income.date)}</TableCell>
                                  <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                      income.platform === 'YOUTUBE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                      income.platform === 'TWITCH' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' :
                                      income.platform === 'KOFI' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' :
                                      income.platform === 'STREAMLOOTS' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                      income.platform === 'ADJUSTMENT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}>
                                      {income.platform}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{income.description}</TableCell>
                                  <TableCell className="text-right font-mono text-green-600 dark:text-green-400">{formatCurrency(income.amount)}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <IncomeFormDialog talentId={talent.id} talentName={talent.name} income={income} onSuccess={onMutate} />
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => onDeleteIncome(income.id)}
                                        disabled={deletingId === income.id}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        {deletingId === income.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                      </Button>
                                    </div>
                                  </TableCell>
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

function IncomeFormDialog({ 
  talentId, 
  talentName, 
  income, 
  onSuccess 
}: { 
  talentId: string
  talentName: string
  income?: TalentData['income']['all'][0]
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<IncomeFormData>({
    date: income?.accountingMonth ? new Date(income.accountingMonth).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    platform: income?.platform || 'YOUTUBE',
    currency: income?.currency || 'USD',
    referenceValue: income?.referenceValue?.toString() || '',
    actualValue: income?.actualValue?.toString() || '',
    actualValueUSD: income?.actualValueUSD?.toString() || '',
    description: income?.description || '',
  })

  const isEditing = !!income

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEditing ? `/api/manager/income/${income.id}` : '/api/manager/income'
      const method = isEditing ? 'PATCH' : 'POST'

      const body: Record<string, unknown> = {
        accountingMonth: formData.date,
        platform: formData.platform,
        currency: formData.currency,
        referenceValue: parseFloat(formData.referenceValue) || 0,
        actualValue: parseFloat(formData.actualValue) || 0,
        actualValueUSD: parseFloat(formData.actualValueUSD) || 0,
        description: formData.description,
      }
      if (!isEditing) body.talentId = talentId

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setOpen(false)
        if (!isEditing) {
          setFormData({
            date: new Date().toISOString().slice(0, 10),
            platform: 'YOUTUBE',
            currency: 'USD',
            referenceValue: '',
            actualValue: '',
            actualValueUSD: '',
            description: '',
          })
        }
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to save income:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCurrencyChange = (newCurrency: string) => {
    setFormData({ ...formData, currency: newCurrency })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="size-4" />
            Add Income
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Income' : `Add Income for ${talentName}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceValue">Reference Value</Label>
              <Input
                id="referenceValue"
                type="number"
                step="0.01"
                value={formData.referenceValue}
                onChange={(e) => setFormData({ ...formData, referenceValue: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actualValue">Actual Value ({formData.currency})</Label>
              <Input
                id="actualValue"
                type="number"
                step="0.01"
                value={formData.actualValue}
                onChange={(e) => setFormData({ ...formData, actualValue: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualValueUSD">Amount (USD)</Label>
              <Input
                id="actualValueUSD"
                type="number"
                step="0.01"
                value={formData.actualValueUSD}
                onChange={(e) => setFormData({ ...formData, actualValueUSD: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Monthly revenue"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <><Loader2 className="size-4 animate-spin mr-2" />{isEditing ? 'Saving...' : 'Adding...'}</> : (isEditing ? 'Save Changes' : 'Add Income')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}


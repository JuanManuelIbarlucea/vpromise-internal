'use client'

import { use } from 'react'
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
import {
  BarChart,
  Bar,
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
import { Wallet, Receipt, Calendar, TrendingUp, AlertTriangle, CheckCircle, Banknote, ArrowUpDown, Youtube } from 'lucide-react'
import { ExpenseForm } from '@/components/expense-form'

type TalentPageData = {
  talent: {
    id: string
    name: string
    contractDate: string
    annualBudget: number
    manager: { id: string; name: string } | null
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
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#f43f5e', '#14b8a6']

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
  })
}

function formatMonth(month: string) {
  const [year, m] = month.split('-')
  const date = new Date(parseInt(year), parseInt(m) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export default function TalentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
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

  const { talent, budget, expenses, expensesByCategory, monthlyExpenses, income, incomes, incomeByPlatform, monthlyIncome } = data

  const budgetStatus = budget.usedPercent >= 100 
    ? 'over' 
    : budget.usedPercent >= 80 
      ? 'warning' 
      : 'good'

  const budgetPieData = [
    { name: 'Spent', value: Math.min(budget.spent, budget.annual) },
    { name: 'Remaining', value: Math.max(budget.remaining, 0) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{talent.name}</h1>
          <p className="text-muted-foreground">
            {talent.manager ? `Managed by ${talent.manager.name}` : 'No manager assigned'}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="size-4" />
            Contract: {formatDate(talent.contractDate)}
          </div>
        </div>
        <ExpenseForm 
          onSuccess={() => mutate()} 
          talentId={talent.id} 
          talentName={talent.name} 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Annual Budget</CardTitle>
            <Wallet className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(budget.annual)}
            </div>
            <p className="text-xs text-muted-foreground">
              Period: {formatDate(budget.periodStart)} - {formatDate(budget.periodEnd)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Amount Spent</CardTitle>
            <Receipt className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(budget.spent)}
            </div>
            <p className="text-xs text-muted-foreground">{expenses.length} expenses this period</p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${
          budgetStatus === 'over'
            ? 'from-red-500/10 to-red-600/5 border-red-500/20'
            : budgetStatus === 'warning'
              ? 'from-amber-500/10 to-amber-600/5 border-amber-500/20'
              : 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20'
        }`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            {budgetStatus === 'over' ? (
              <AlertTriangle className="size-4 text-red-500" />
            ) : budgetStatus === 'warning' ? (
              <AlertTriangle className="size-4 text-amber-500" />
            ) : (
              <CheckCircle className="size-4 text-emerald-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              budgetStatus === 'over'
                ? 'text-red-600 dark:text-red-400'
                : budgetStatus === 'warning'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {formatCurrency(budget.remaining)}
            </div>
            <p className="text-xs text-muted-foreground">
              {budget.usedPercent.toFixed(1)}% of budget used
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
            <TrendingUp className="size-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {Math.min(budget.usedPercent, 100).toFixed(0)}%
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  budgetStatus === 'over'
                    ? 'bg-red-500'
                    : budgetStatus === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(budget.usedPercent, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Talent Income</CardTitle>
            <TrendingUp className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(income?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">{income?.count || 0} entries this period</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-lime-500/10 to-lime-600/5 border-lime-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agency Share</CardTitle>
            <Wallet className="size-4 text-lime-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">
              {formatCurrency(income?.agencyShare || 0)}
            </div>
            <p className="text-xs text-muted-foreground">45% (&lt;$1k/mo) or 20% (&gt;$1k/mo)</p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${(income?.netFlow || 0) >= 0 ? 'from-teal-500/10 to-teal-600/5 border-teal-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
            <ArrowUpDown className={`size-4 ${(income?.netFlow || 0) >= 0 ? 'text-teal-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(income?.netFlow || 0) >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(income?.netFlow || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Agency Share - Expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expense Count</CardTitle>
            <Receipt className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {expenses.length}
            </div>
            <p className="text-xs text-muted-foreground">This budget period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-5" />
              Budget Overview
            </CardTitle>
            <CardDescription>Spent vs Remaining</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={budgetPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    <Cell fill={budgetStatus === 'over' ? '#ef4444' : '#8b5cf6'} />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Spending Over Time
            </CardTitle>
            <CardDescription>Monthly expense trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {monthlyExpenses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyExpenses}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonth}
                      className="text-xs"
                      stroke="currentColor"
                    />
                    <YAxis
                      tickFormatter={(v) => `$${v}`}
                      className="text-xs"
                      stroke="currentColor"
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value as number), 'Spent']}
                      labelFormatter={formatMonth}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No expense data for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="size-5" />
            Expenses by Category
          </CardTitle>
          <CardDescription>Where the budget goes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesByCategory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="category" stroke="currentColor" className="text-xs" />
                  <YAxis tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value as number), 'Amount']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {expensesByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No expenses recorded this period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="size-5" />
              Income by Platform
            </CardTitle>
            <CardDescription>Revenue sources this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {(incomeByPlatform?.length || 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeByPlatform}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="platform"
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {incomeByPlatform?.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No income data for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Income Over Time
            </CardTitle>
            <CardDescription>Monthly income &amp; agency share</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {(monthlyIncome?.length || 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyIncome}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonth}
                      className="text-xs"
                      stroke="currentColor"
                    />
                    <YAxis
                      tickFormatter={(v) => `$${v}`}
                      className="text-xs"
                      stroke="currentColor"
                    />
                    <Tooltip
                      formatter={(value, name) => [formatCurrency(value as number), name === 'agencyShare' ? 'Agency Share' : 'Talent Income']}
                      labelFormatter={formatMonth}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend formatter={(value) => (value === 'agencyShare' ? 'Agency Share' : 'Talent Income')} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="agencyShare"
                      stroke="#84cc16"
                      fill="#84cc16"
                      fillOpacity={0.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No income data for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Income History
          </CardTitle>
          <CardDescription>All income in the current budget period</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomes?.map((inc) => (
                <TableRow key={inc.id}>
                  <TableCell className="text-muted-foreground">
                    {formatMonth(new Date(inc.accountingMonth).toISOString().slice(0, 7))}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                      inc.platform === 'YOUTUBE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      inc.platform === 'TWITCH' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' :
                      inc.platform === 'KOFI' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' :
                      inc.platform === 'STREAMLOOTS' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {inc.platform}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{inc.description}</TableCell>
                  <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                    {formatCurrency(inc.actualValueUSD)}
                  </TableCell>
                </TableRow>
              ))}
              {(!incomes || incomes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No income recorded for this budget period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
          <CardDescription>All expenses in the current budget period</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(expense.date)}
                  </TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>
                    {expense.isSalary ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        <Banknote className="size-3" />
                        Salary
                      </span>
                    ) : (
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        expense.isRecurring
                          ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {expense.isRecurring ? 'Recurring' : 'One-off'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {expense.status === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle className="size-3" />
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <AlertTriangle className="size-3" />
                        Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(expense.amount)}</TableCell>
                </TableRow>
              ))}
              {expenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No expenses recorded for this budget period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}


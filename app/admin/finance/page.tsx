'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts'
import { DollarSign, Users, Receipt, TrendingUp, Wallet, RefreshCw, Zap, CreditCard, Clock, CheckCircle, Calendar, CalendarDays, Infinity, TrendingDown, ArrowUpDown, Youtube, Twitch } from 'lucide-react'
import { Button } from '@/components/ui/button'

type MonthData = {
  month: string
  totalSpent: number
  expenses: number
  recurring: number
  oneOff: number
  salaryPayments: number
  expensePayments: number
  expenseCount: number
  paymentCount: number
  income: number
  agencyShare: number
  agencyRate: number
  incomeCount: number
  netFlow: number
  estimatedMonthlyCost: number
  byCategory: { category: string; amount: number }[]
  byUser: { name: string; amount: number }[]
  incomeByPlatform: { platform: string; amount: number }[]
  incomeByTalent: { name: string; amount: number }[]
}

type YearData = {
  year: string
  totalSpent: number
  expenses: number
  recurring: number
  oneOff: number
  salaryPayments: number
  expensePayments: number
  expenseCount: number
  paymentCount: number
  income: number
  agencyShare: number
  incomeCount: number
  netFlow: number
  estimatedAnnualCost: number
  byCategory: { category: string; amount: number }[]
  byUser: { name: string; amount: number }[]
  incomeByPlatform: { platform: string; amount: number }[]
  incomeByTalent: { name: string; amount: number }[]
  monthlyBreakdown: { month: string; expenses: number; payments: number; income: number; agencyShare: number }[]
}

type AllTimeData = {
  summary: {
    totalSpent: number
    totalExpenses: number
    totalRecurring: number
    totalOneOff: number
    totalSalaryPayments: number
    totalExpensePayments: number
    totalPending: number
    totalPaid: number
    totalIncome: number
    totalAgencyShare: number
    netFlow: number
    monthlyCost: number
    userCount: number
    talentCount: number
    managerCount: number
    expenseCount: number
    paymentCount: number
    incomeCount: number
    pendingCount: number
    paidCount: number
  }
  byCategory: { category: string; amount: number }[]
  byUser: { name: string; amount: number }[]
  salaryByType: { type: string; amount: number }[]
  talentSalaries: { name: string; salary: number }[]
  incomeByPlatform: { platform: string; amount: number }[]
  incomeByTalent: { name: string; amount: number }[]
  recentExpenses: {
    id: string
    description: string
    amount: number
    category: string
    isRecurring: boolean
    date: string
    user: string
    talent: string | null
  }[]
  recentPayments: {
    id: string
    amount: number
    type: string
    description: string
    date: string
    user: string
    userType: string
  }[]
  recentIncomes: {
    id: string
    amount: number
    platform: string
    description: string
    date: string
    talent: string
  }[]
  yearlyTrend: { year: string; amount: number }[]
  yearlyIncomeTrend: { year: string; amount: number }[]
}

type FinanceData = {
  monthlyData: MonthData[]
  annualData: YearData[]
  allTimeData: AllTimeData
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#14b8a6']

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatMonth(month: string) {
  const [year, m] = month.split('-')
  const date = new Date(parseInt(year), parseInt(m) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function formatMonthLong(month: string) {
  const [year, m] = month.split('-')
  const date = new Date(parseInt(year), parseInt(m) - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function AdminFinancePage() {
  const router = useRouter()
  const { isAdmin, isLoading: authLoading } = useAuth()
  const { data, isLoading } = useSWR<FinanceData>('/api/admin/finance', fetcher)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0)
  const [selectedYearIndex, setSelectedYearIndex] = useState(0)

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/personal')
  }, [authLoading, isAdmin, router])

  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading financial data...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-destructive">Failed to load financial data</div>
      </div>
    )
  }

  const { monthlyData, annualData, allTimeData } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
        <p className="text-muted-foreground">Company expenses, salaries, and financial metrics</p>
      </div>

      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="monthly" className="gap-2">
            <Calendar className="size-4" />
            Monthly
          </TabsTrigger>
          <TabsTrigger value="annually" className="gap-2">
            <CalendarDays className="size-4" />
            Annually
          </TabsTrigger>
          <TabsTrigger value="alltime" className="gap-2">
            <Infinity className="size-4" />
            All Time
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-6">
          <MonthlyView
            data={monthlyData}
            selectedIndex={selectedMonthIndex}
            onSelectIndex={setSelectedMonthIndex}
          />
        </TabsContent>

        <TabsContent value="annually" className="space-y-6">
          <AnnualView
            data={annualData}
            selectedIndex={selectedYearIndex}
            onSelectIndex={setSelectedYearIndex}
          />
        </TabsContent>

        <TabsContent value="alltime" className="space-y-6">
          <AllTimeView data={allTimeData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MonthlyView({ data, selectedIndex, onSelectIndex }: { data: MonthData[]; selectedIndex: number; onSelectIndex: (i: number) => void }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
        No monthly data available
      </div>
    )
  }

  const month = data[selectedIndex]

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {data.slice(0, 12).map((m, i) => (
          <Button
            key={m.month}
            variant={selectedIndex === i ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectIndex(i)}
          >
            {formatMonth(m.month)}
          </Button>
        ))}
      </div>

      <div className="text-lg font-semibold text-muted-foreground">{formatMonthLong(month.month)}</div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(month.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">{month.paymentCount} payments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Salaries Paid</CardTitle>
            <Wallet className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(month.salaryPayments)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expenses Paid</CardTitle>
            <Receipt className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(month.expensePayments)}
            </div>
            <p className="text-xs text-muted-foreground">{month.expenseCount} expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Est. Monthly Cost</CardTitle>
            <TrendingUp className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(month.estimatedMonthlyCost)}
            </div>
            <p className="text-xs text-muted-foreground">Salaries + Recurring</p>
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
              {formatCurrency(month.income || 0)}
            </div>
            <p className="text-xs text-muted-foreground">{month.incomeCount || 0} entries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-lime-500/10 to-lime-600/5 border-lime-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agency Share ({((month.agencyRate || 0.45) * 100).toFixed(0)}%)</CardTitle>
            <DollarSign className="size-4 text-lime-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">
              {formatCurrency(month.agencyShare || 0)}
            </div>
            <p className="text-xs text-muted-foreground">{(month.income || 0) > 1000 ? '20% (over $1k)' : '45% standard'}</p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${(month.netFlow || 0) >= 0 ? 'from-teal-500/10 to-teal-600/5 border-teal-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
            <ArrowUpDown className={`size-4 ${(month.netFlow || 0) >= 0 ? 'text-teal-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(month.netFlow || 0) >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(month.netFlow || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Agency Share - Spent</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recurring</CardTitle>
            <RefreshCw className="size-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {formatCurrency(month.recurring)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">One-off</CardTitle>
            <Zap className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(month.oneOff)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="size-5" />
              Expenses by Category
            </CardTitle>
            <CardDescription>Distribution for {formatMonthLong(month.month)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {month.byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={month.byCategory.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="category" stroke="currentColor" className="text-xs" />
                    <YAxis tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value) || 0), 'Amount']}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                    <Bar dataKey="amount" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No expense data</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Expenses by User
            </CardTitle>
            <CardDescription>Who spent what in {formatMonthLong(month.month)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {month.byUser.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={month.byUser.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                    <YAxis type="category" dataKey="name" width={100} className="text-xs" stroke="currentColor" />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value) || 0), 'Expenses']}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                    <Bar dataKey="amount" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No expense data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="size-5" />
              Income by Platform
            </CardTitle>
            <CardDescription>Revenue sources for {formatMonthLong(month.month)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {(month.incomeByPlatform?.length || 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={month.incomeByPlatform}
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
                      {month.incomeByPlatform?.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value) || 0)}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No income data</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Income by Talent
            </CardTitle>
            <CardDescription>Who earned what in {formatMonthLong(month.month)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {(month.incomeByTalent?.length || 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={month.incomeByTalent?.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                    <YAxis type="category" dataKey="name" width={100} className="text-xs" stroke="currentColor" />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value) || 0), 'Income']}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No income data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function AnnualView({ data, selectedIndex, onSelectIndex }: { data: YearData[]; selectedIndex: number; onSelectIndex: (i: number) => void }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
        No annual data available
      </div>
    )
  }

  const year = data[selectedIndex]

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {data.map((y, i) => (
          <Button
            key={y.year}
            variant={selectedIndex === i ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectIndex(i)}
          >
            {y.year}
          </Button>
        ))}
      </div>

      <div className="text-lg font-semibold text-muted-foreground">{year.year} Overview</div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(year.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">{year.paymentCount} payments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Salaries Paid</CardTitle>
            <Wallet className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(year.salaryPayments)}
            </div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expenses Paid</CardTitle>
            <Receipt className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(year.expensePayments)}
            </div>
            <p className="text-xs text-muted-foreground">{year.expenseCount} expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Est. Annual Cost</CardTitle>
            <TrendingUp className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(year.estimatedAnnualCost)}
            </div>
            <p className="text-xs text-muted-foreground">Projected</p>
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
              {formatCurrency(year.income || 0)}
            </div>
            <p className="text-xs text-muted-foreground">{year.incomeCount || 0} entries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-lime-500/10 to-lime-600/5 border-lime-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agency Share</CardTitle>
            <DollarSign className="size-4 text-lime-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">
              {formatCurrency(year.agencyShare || 0)}
            </div>
            <p className="text-xs text-muted-foreground">45% (&lt;$1k/mo) or 20% (&gt;$1k/mo)</p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${(year.netFlow || 0) >= 0 ? 'from-teal-500/10 to-teal-600/5 border-teal-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
            <ArrowUpDown className={`size-4 ${(year.netFlow || 0) >= 0 ? 'text-teal-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(year.netFlow || 0) >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(year.netFlow || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Agency Share - Spent</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recurring Expenses</CardTitle>
            <RefreshCw className="size-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {formatCurrency(year.recurring)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Monthly Breakdown
          </CardTitle>
          <CardDescription>Income vs spending throughout {year.year}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {year.monthlyBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={year.monthlyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} className="text-xs" stroke="currentColor" />
                  <YAxis tickFormatter={(v) => `$${v}`} className="text-xs" stroke="currentColor" />
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(Number(value) || 0), name === 'agencyShare' ? 'Agency Share' : name === 'income' ? 'Talent Income' : name === 'payments' ? 'Payments' : 'Expenses']}
                    labelFormatter={formatMonth}
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
                  />
                  <Legend formatter={(value) => (value === 'agencyShare' ? 'Agency Share' : value === 'income' ? 'Talent Income' : value === 'payments' ? 'Payments' : 'Expenses')} />
                  <Area type="monotone" dataKey="agencyShare" stroke="#84cc16" fill="#84cc16" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="payments" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No data</div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="size-5" />
              Expenses by Category
            </CardTitle>
            <CardDescription>Distribution for {year.year}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {year.byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={year.byCategory.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="category"
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {year.byCategory.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value) || 0)}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No expense data</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Expenses by User
            </CardTitle>
            <CardDescription>Top spenders in {year.year}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {year.byUser.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={year.byUser.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                    <YAxis type="category" dataKey="name" width={100} className="text-xs" stroke="currentColor" />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value) || 0), 'Expenses']}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                    <Bar dataKey="amount" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No expense data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="size-5" />
              Income by Platform
            </CardTitle>
            <CardDescription>Revenue sources for {year.year}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {(year.incomeByPlatform?.length || 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={year.incomeByPlatform}
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
                      {year.incomeByPlatform?.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value) || 0)}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No income data</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Income by Talent
            </CardTitle>
            <CardDescription>Top earners in {year.year}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {(year.incomeByTalent?.length || 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={year.incomeByTalent?.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                    <YAxis type="category" dataKey="name" width={100} className="text-xs" stroke="currentColor" />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value) || 0), 'Income']}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No income data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function AllTimeView({ data }: { data: AllTimeData }) {
  const { summary, byCategory, byUser, salaryByType, talentSalaries, incomeByPlatform, incomeByTalent, recentExpenses, recentPayments, recentIncomes, yearlyTrend, yearlyIncomeTrend } = data

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(summary.totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">{summary.pendingCount} awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary.totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">{summary.paidCount} completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recurring</CardTitle>
            <RefreshCw className="size-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {formatCurrency(summary.totalRecurring)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">One-off</CardTitle>
            <Zap className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(summary.totalOneOff)}
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
              {formatCurrency(summary.totalIncome || 0)}
            </div>
            <p className="text-xs text-muted-foreground">{summary.incomeCount || 0} entries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-lime-500/10 to-lime-600/5 border-lime-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agency Share</CardTitle>
            <DollarSign className="size-4 text-lime-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">
              {formatCurrency(summary.totalAgencyShare || 0)}
            </div>
            <p className="text-xs text-muted-foreground">45% (&lt;$1k/mo) or 20% (&gt;$1k/mo)</p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${(summary.netFlow || 0) >= 0 ? 'from-teal-500/10 to-teal-600/5 border-teal-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Flow (All Time)</CardTitle>
            <ArrowUpDown className={`size-4 ${(summary.netFlow || 0) >= 0 ? 'text-teal-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary.netFlow || 0) >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(summary.netFlow || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Agency Share - Total Spent</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(summary.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">{summary.paymentCount} payments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Est. Monthly Cost</CardTitle>
            <Wallet className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(summary.monthlyCost)}
            </div>
            <p className="text-xs text-muted-foreground">Salaries + Recurring</p>
          </CardContent>
        </Card>
      </div>

      {(yearlyTrend.length > 1 || yearlyIncomeTrend.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Yearly Trend
            </CardTitle>
            <CardDescription>Income vs spending by year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyTrend.map((t, i) => ({
                  year: t.year,
                  spent: t.amount,
                  income: yearlyIncomeTrend.find(it => it.year === t.year)?.amount || 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" stroke="currentColor" />
                  <YAxis tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(Number(value) || 0), name === 'income' ? 'Income' : 'Spent']}
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
                  />
                  <Legend formatter={(value) => (value === 'income' ? 'Income' : 'Spent')} />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="spent" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="size-5" />
              Cost Breakdown
            </CardTitle>
            <CardDescription>Where the money goes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Salary Payments', amount: summary.totalSalaryPayments },
                      { name: 'Expense Payments', amount: summary.totalExpensePayments },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value) || 0)}
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
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
              <Receipt className="size-5" />
              Expenses by Category
            </CardTitle>
            <CardDescription>All time distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="category" stroke="currentColor" className="text-xs" />
                    <YAxis tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value) || 0), 'Amount']}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                    <Bar dataKey="amount" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No expense data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Expenses by User
            </CardTitle>
            <CardDescription>Top spenders all time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {byUser.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byUser.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                    <YAxis type="category" dataKey="name" width={100} className="text-xs" stroke="currentColor" />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value) || 0), 'Expenses']}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                    <Bar dataKey="amount" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No expense data</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary by User Type</CardTitle>
            <CardDescription>Monthly salary distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {salaryByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salaryByType}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="type" stroke="currentColor" />
                    <YAxis tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value) || 0), 'Total Salary']}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No salary data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="size-5" />
              Income by Platform
            </CardTitle>
            <CardDescription>All time revenue sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {incomeByPlatform.length > 0 ? (
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
                      {incomeByPlatform.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value) || 0)}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No income data</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Income by Talent
            </CardTitle>
            <CardDescription>All time top earners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {incomeByTalent.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeByTalent.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                    <YAxis type="category" dataKey="name" width={100} className="text-xs" stroke="currentColor" />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value) || 0), 'Income']}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 50 }}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No income data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Talent Salaries</CardTitle>
          <CardDescription>Individual compensation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[300px] overflow-y-auto">
            {talentSalaries.slice(0, 12).map((talent, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div
                    className="size-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  >
                    {talent.name.charAt(0)}
                  </div>
                  <span className="font-medium truncate max-w-[100px]">{talent.name}</span>
                </div>
                <span className="font-mono text-sm">{formatCurrency(talent.salary)}</span>
              </div>
            ))}
            {talentSalaries.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-4">No talents found</div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium max-w-[150px] truncate">{expense.description}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>
                      {expense.isRecurring ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                          <RefreshCw className="size-3" />
                          Recurring
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <Zap className="size-3" />
                          One-off
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(expense.amount)}</TableCell>
                  </TableRow>
                ))}
                {recentExpenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No expenses found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest paid salaries and expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium max-w-[150px] truncate">{payment.description}</TableCell>
                    <TableCell>{payment.user}</TableCell>
                    <TableCell>
                      {payment.type === 'SALARY' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          <Wallet className="size-3" />
                          Salary
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <Receipt className="size-3" />
                          Expense
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(payment.amount)}</TableCell>
                  </TableRow>
                ))}
                {recentPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No payments yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Recent Income
          </CardTitle>
          <CardDescription>Latest talent earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Talent</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentIncomes.map((income) => (
                <TableRow key={income.id}>
                  <TableCell className="font-medium">{income.talent}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                      income.platform === 'YOUTUBE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      income.platform === 'TWITCH' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' :
                      income.platform === 'KOFI' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' :
                      income.platform === 'STREAMLOOTS' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {income.platform}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{income.description}</TableCell>
                  <TableCell className="text-right font-mono text-green-600 dark:text-green-400">{formatCurrency(income.amount)}</TableCell>
                </TableRow>
              ))}
              {recentIncomes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No income recorded yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-500/10 to-slate-600/5 border-slate-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Team Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-background/50">
              <div className="text-3xl font-bold">{summary.userCount}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <div className="text-3xl font-bold">{summary.talentCount}</div>
              <div className="text-sm text-muted-foreground">Talents</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <div className="text-3xl font-bold">{summary.managerCount}</div>
              <div className="text-sm text-muted-foreground">Managers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

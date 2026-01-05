'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
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
import {
  ExternalLink,
  Wallet,
  Users,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  CalendarDays,
  Infinity,
  DollarSign,
  ArrowUpDown,
} from 'lucide-react'
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
  }
  income: {
    monthly: { totalIncome: number; totalAgencyShare: number; count: number; byPlatform: { platform: string; amount: number }[] }
    annual: { totalIncome: number; totalAgencyShare: number; count: number; byMonth: { month: string; amount: number; agencyShare: number }[] }
    allTime: { totalIncome: number; totalAgencyShare: number; count: number; byYear: { year: string; amount: number }[] }
    recent: { id: string; platform: string; description: string; amount: number; date: string }[]
  }
}

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TalentsPage() {
  const { user } = useAuth()
  const isManager = user?.permission === 'MANAGER'
  
  const { data: simpleTalents, isLoading: simpleLoading } = useSWR<SimpleTalent[]>(
    !isManager ? '/api/talents' : null,
    fetcher
  )
  const { data: managerData, isLoading: managerLoading } = useSWR<ManagerTalentsData>(
    isManager ? '/api/manager/talents' : null,
    fetcher
  )

  if (isManager) {
    return <ManagerTalentsView data={managerData} isLoading={managerLoading} />
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
                      <span className="font-mono text-sm">${talent.annualBudget.toLocaleString()}</span>
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
  isLoading 
}: { 
  data: ManagerTalentsData | undefined
  isLoading: boolean
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Wallet className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(data.summary.totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground">Combined annual budget</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Receipt className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(data.summary.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((data.summary.totalSpent / data.summary.totalBudget) * 100).toFixed(0)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Remaining</CardTitle>
            <CheckCircle className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.summary.totalRemaining)}
            </div>
            <p className="text-xs text-muted-foreground">Available across all talents</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agency Share (YTD)</CardTitle>
            <TrendingUp className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(data.summary.annualAgencyShare)}
            </div>
            <p className="text-xs text-muted-foreground">From {formatCurrency(data.summary.annualIncome)} income</p>
          </CardContent>
        </Card>
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

      {activeTalent && <TalentDetailView talent={activeTalent} />}
    </div>
  )
}

function TalentDetailView({ talent }: { talent: TalentData }) {
  const budgetStatus = talent.budget.usedPercent >= 100 
    ? 'over' 
    : talent.budget.usedPercent >= 80 
      ? 'warning' 
      : 'good'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{talent.name}</h2>
          <p className="text-sm text-muted-foreground">
            Contract: {formatDate(talent.contractDate)} • Budget Period: {formatDate(talent.budget.periodStart)} - {formatDate(talent.budget.periodEnd)}
          </p>
        </div>
        <Link href={`/talents/${talent.id}`}>
          <Button variant="outline" className="gap-2">
            <ExternalLink className="size-4" />
            Full Details
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Annual Budget</CardTitle>
            <Wallet className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(talent.budget.annual)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            <Receipt className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(talent.budget.spent)}
            </div>
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
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            {budgetStatus === 'over' || budgetStatus === 'warning' ? (
              <AlertTriangle className={`size-4 ${budgetStatus === 'over' ? 'text-red-500' : 'text-amber-500'}`} />
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
              {formatCurrency(talent.budget.remaining)}
            </div>
            <p className="text-xs text-muted-foreground">{talent.budget.usedPercent.toFixed(0)}% used</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
            <TrendingUp className="size-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {Math.min(talent.budget.usedPercent, 100).toFixed(0)}%
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  budgetStatus === 'over' ? 'bg-red-500' : budgetStatus === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(talent.budget.usedPercent, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="monthly" className="gap-2">
            <Calendar className="size-4" />
            Monthly
          </TabsTrigger>
          <TabsTrigger value="annual" className="gap-2">
            <CalendarDays className="size-4" />
            Annual
          </TabsTrigger>
          <TabsTrigger value="alltime" className="gap-2">
            <Infinity className="size-4" />
            All Time
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-6">
          <MonthlyView talent={talent} />
        </TabsContent>

        <TabsContent value="annual" className="space-y-6">
          <AnnualView talent={talent} />
        </TabsContent>

        <TabsContent value="alltime" className="space-y-6">
          <AllTimeView talent={talent} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MonthlyView({ talent }: { talent: TalentData }) {
  const netFlow = talent.income.monthly.totalAgencyShare - talent.expenses.monthly.total

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <Receipt className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(talent.expenses.monthly.total)}
            </div>
            <p className="text-xs text-muted-foreground">{talent.expenses.monthly.count} expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(talent.income.monthly.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">{talent.income.monthly.count} entries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-lime-500/10 to-lime-600/5 border-lime-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agency Share</CardTitle>
            <DollarSign className="size-4 text-lime-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">
              {formatCurrency(talent.income.monthly.totalAgencyShare)}
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${netFlow >= 0 ? 'from-teal-500/10 to-teal-600/5 border-teal-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
            <ArrowUpDown className={`size-4 ${netFlow >= 0 ? 'text-teal-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(netFlow)}
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
            <CardDescription>This month's breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {talent.expenses.monthly.byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={talent.expenses.monthly.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="category" stroke="currentColor" className="text-xs" />
                    <YAxis tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), 'Amount']}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {talent.expenses.monthly.byCategory.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No expenses this month</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Income by Platform
            </CardTitle>
            <CardDescription>This month's revenue sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {talent.income.monthly.byPlatform.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={talent.income.monthly.byPlatform}
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
                      {talent.income.monthly.byPlatform.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No income this month</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>Latest transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {talent.expenses.recent.slice(0, 5).map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-muted-foreground">{formatDate(expense.date)}</TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>{expense.category || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      expense.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {expense.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(expense.amount)}</TableCell>
                </TableRow>
              ))}
              {talent.expenses.recent.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No expenses recorded</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

function AnnualView({ talent }: { talent: TalentData }) {
  const netFlow = talent.income.annual.totalAgencyShare - talent.expenses.annual.total

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Annual Expenses</CardTitle>
            <Receipt className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(talent.expenses.annual.total)}
            </div>
            <p className="text-xs text-muted-foreground">{talent.expenses.annual.count} expenses this year</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Annual Income</CardTitle>
            <TrendingUp className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(talent.income.annual.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">{talent.income.annual.count} entries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-lime-500/10 to-lime-600/5 border-lime-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agency Share (YTD)</CardTitle>
            <DollarSign className="size-4 text-lime-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">
              {formatCurrency(talent.income.annual.totalAgencyShare)}
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${netFlow >= 0 ? 'from-teal-500/10 to-teal-600/5 border-teal-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Flow (YTD)</CardTitle>
            <ArrowUpDown className={`size-4 ${netFlow >= 0 ? 'text-teal-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(netFlow)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="size-5" />
              Expenses Over Time
            </CardTitle>
            <CardDescription>Monthly spending this year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {talent.expenses.annual.byMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={talent.expenses.annual.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tickFormatter={formatMonth} stroke="currentColor" className="text-xs" />
                    <YAxis tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), 'Spent']}
                      labelFormatter={formatMonth}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  </AreaChart>
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
              <TrendingUp className="size-5" />
              Income Over Time
            </CardTitle>
            <CardDescription>Monthly revenue &amp; agency share</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {talent.income.annual.byMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={talent.income.annual.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tickFormatter={formatMonth} stroke="currentColor" className="text-xs" />
                    <YAxis tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                    <Tooltip
                      formatter={(value, name) => [formatCurrency(Number(value)), name === 'agencyShare' ? 'Agency Share' : 'Income']}
                      labelFormatter={formatMonth}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    />
                    <Legend formatter={(value) => (value === 'agencyShare' ? 'Agency Share' : 'Income')} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="agencyShare" stroke="#84cc16" fill="#84cc16" fillOpacity={0.5} />
                  </AreaChart>
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

function AllTimeView({ talent }: { talent: TalentData }) {
  const netFlow = talent.income.allTime.totalAgencyShare - talent.expenses.allTime.total

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(talent.expenses.allTime.total)}
            </div>
            <p className="text-xs text-muted-foreground">{talent.expenses.allTime.count} expenses all time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(talent.income.allTime.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">{talent.income.allTime.count} entries all time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-lime-500/10 to-lime-600/5 border-lime-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Agency Share</CardTitle>
            <DollarSign className="size-4 text-lime-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">
              {formatCurrency(talent.income.allTime.totalAgencyShare)}
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${netFlow >= 0 ? 'from-teal-500/10 to-teal-600/5 border-teal-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Flow (All Time)</CardTitle>
            <ArrowUpDown className={`size-4 ${netFlow >= 0 ? 'text-teal-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(netFlow)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="size-5" />
              Expenses by Year
            </CardTitle>
            <CardDescription>Historical spending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {talent.expenses.allTime.byYear.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={talent.expenses.allTime.byYear}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" stroke="currentColor" />
                    <YAxis tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), 'Expenses']}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
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
              <TrendingUp className="size-5" />
              Income by Year
            </CardTitle>
            <CardDescription>Historical earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {talent.income.allTime.byYear.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={talent.income.allTime.byYear}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" stroke="currentColor" />
                    <YAxis tickFormatter={(v) => `$${v}`} stroke="currentColor" />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), 'Income']}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No income data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Latest 10 transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {talent.expenses.recent.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-muted-foreground">{formatDate(expense.date)}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(expense.amount)}</TableCell>
                  </TableRow>
                ))}
                {talent.expenses.recent.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No expenses recorded</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Income</CardTitle>
            <CardDescription>Latest 10 entries</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {talent.income.recent.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell className="text-muted-foreground">{formatDate(income.date)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        income.platform === 'YOUTUBE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        income.platform === 'TWITCH' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {income.platform}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600 dark:text-green-400">{formatCurrency(income.amount)}</TableCell>
                  </TableRow>
                ))}
                {talent.income.recent.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No income recorded</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

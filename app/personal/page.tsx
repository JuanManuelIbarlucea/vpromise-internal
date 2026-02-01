'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  User,
  Mail,
  Wallet,
  Calendar,
  Briefcase,
  DollarSign,
  Plus,
  Loader2,
  CheckCircle,
  Clock,
  TrendingUp,
  Receipt,
  CreditCard,
} from 'lucide-react'

type PersonalData = {
  user: {
    id: string
    username: string
    email: string | null
    salary: number
    type: string
    permission: string
    createdAt: string
    managerName: string | null
  }
  currentMonth: {
    month: string
    baseSalary: number
    extraordinaryExpenses: number
    expectedTotal: number
    salaryPaid: number
    expensesPaid: number
    totalPaid: number
    remaining: number
    expenses: {
      id: string
      description: string
      amount: number
      status: string
      date: string
    }[]
  }
  paymentHistory: {
    month: string
    salary: number
    expenses: number
    payments: {
      id: string
      type: string
      amount: number
      description: string
      date: string
    }[]
  }[]
  allPayments: {
    id: string
    type: string
    amount: number
    description: string
    date: string
  }[]
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatMonth(month: string) {
  const [year, m] = month.split('-')
  const date = new Date(parseInt(year), parseInt(m) - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function PersonalPage() {
  const { data, isLoading, mutate } = useSWR<PersonalData>('/api/personal', fetcher)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ description: '', amount: '' })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading personal data...</div>
      </div>
    )
  }

  if (!data || !data.user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-destructive">Failed to load personal data</div>
      </div>
    )
  }

  const { user, currentMonth, paymentHistory, allPayments } = data

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add expense')
      }

      mutate()
      setDialogOpen(false)
      setFormData({ description: '', amount: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expense')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personal</h1>
          <p className="text-muted-foreground">Your profile and payment information</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Add Extraordinary Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Extraordinary Expense</DialogTitle>
              <DialogDescription>
                Add a necessary service expense that will be added to this month&apos;s salary payment.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Software subscription, Equipment purchase"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Expense'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <User className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">{user.username}</p>
              </div>
            </div>

            {user.email && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Briefcase className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{user.types?.join(', ').toLowerCase() || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Wallet className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Base Salary</p>
                <p className="font-medium font-mono">{formatCurrency(user.salary)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
            </div>

            {user.managerName && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Briefcase className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Manager Profile</p>
                  <p className="font-medium">{user.managerName}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="size-5" />
              {formatMonth(currentMonth.month)} Earnings
            </CardTitle>
            <CardDescription>Your expected earnings for this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Wallet className="size-4 text-blue-500" />
                  Base Salary
                </div>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {formatCurrency(currentMonth.baseSalary)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Receipt className="size-4 text-amber-500" />
                  Extra Expenses
                </div>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {formatCurrency(currentMonth.extraordinaryExpenses)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <TrendingUp className="size-4 text-green-500" />
                  Expected Total
                </div>
                <p className="text-xl font-bold text-green-600 dark:text-green-400 font-mono">
                  {formatCurrency(currentMonth.expectedTotal)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <CheckCircle className="size-4 text-emerald-500" />
                  Paid So Far
                </div>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(currentMonth.totalPaid)}
                </p>
              </div>
            </div>

            {currentMonth.remaining > 0 && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="size-5 text-muted-foreground" />
                    <span className="font-medium">Pending Payment</span>
                  </div>
                  <span className="text-lg font-bold font-mono">{formatCurrency(currentMonth.remaining)}</span>
                </div>
              </div>
            )}

            {currentMonth.expenses.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Extraordinary Expenses This Month</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentMonth.expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(expense.date)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            expense.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {expense.status === 'PAID' ? <CheckCircle className="size-3" /> : <Clock className="size-3" />}
                            {expense.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(expense.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Payment History
          </CardTitle>
          <CardDescription>Your payment history by month</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentHistory.length > 0 ? (
            <div className="space-y-4">
              {paymentHistory.map((month) => (
                <div key={month.month} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{formatMonth(month.month)}</h4>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Salary: <span className="font-mono text-foreground">{formatCurrency(month.salary)}</span>
                      </span>
                      {month.expenses > 0 && (
                        <span className="text-muted-foreground">
                          Expenses: <span className="font-mono text-foreground">{formatCurrency(month.expenses)}</span>
                        </span>
                      )}
                      <span className="font-medium">
                        Total: <span className="font-mono">{formatCurrency(month.salary + month.expenses)}</span>
                      </span>
                    </div>
                  </div>
                  {month.payments.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {month.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="text-muted-foreground">{formatDate(payment.date)}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                payment.type === 'SALARY'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              }`}>
                                {payment.type}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{payment.description}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(payment.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CreditCard className="size-12 mb-4 opacity-50" />
              <p>No payment history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


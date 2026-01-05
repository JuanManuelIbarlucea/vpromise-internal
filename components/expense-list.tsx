'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useExpenses, Expense } from '@/lib/hooks/useExpenses'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Clock, CheckCircle, Loader2, Banknote, RefreshCw, Zap, Pencil } from 'lucide-react'

const statusFilters = ['All', 'Pending', 'Paid']
type User = { id: string; username: string; type: string }
const fetcher = (url: string) => fetch(url).then((res) => res.json())

function EditExpenseDialog({ expense, onSuccess }: { expense: Expense; onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { data: users } = useSWR<User[]>(open ? '/api/admin/users' : null, fetcher)
  const [formData, setFormData] = useState({
    userId: expense.userId,
    category: expense.category || '',
  })

  useEffect(() => {
    if (open) {
      setFormData({
        userId: expense.userId,
        category: expense.category || '',
      })
    }
  }, [open, expense])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setOpen(false)
        onSuccess()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update expense')
      }
    } catch (error) {
      console.error('Failed to update expense:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <div className="text-sm text-muted-foreground">{expense.description}</div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="userId">User</Label>
            <Select value={formData.userId} onValueChange={(v) => setFormData({ ...formData, userId: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {users?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Equipment, Services, Software"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <><Loader2 className="size-4 animate-spin mr-2" />Saving...</> : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ExpenseList() {
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { expenses, isLoading, isError, mutate } = useExpenses()
  const { isAdmin } = useAuth()

  const filteredExpenses = expenses?.filter((expense) => {
    if (selectedStatus === 'All') return true
    if (selectedStatus === 'Pending') return expense.status === 'PENDING'
    if (selectedStatus === 'Paid') return expense.status === 'PAID'
    return true
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        mutate()
      }
    } catch (error) {
      console.error('Failed to delete expense:', error)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID'
    setUpdatingId(id)

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        mutate()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Failed to update expense status:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading expenses...</div>
  }

  if (isError) {
    return <div className="text-center py-8 text-red-500">Failed to load expenses</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredExpenses && filteredExpenses.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-muted-foreground">{formatDate(expense.date)}</TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>
                    <span className="text-sm">{expense.user?.username || '-'}</span>
                    {expense.talent && (
                      <span className="block text-xs text-muted-foreground">{expense.talent.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.category || '-'}
                  </TableCell>
                  <TableCell>
                    {expense.isSalary ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        <Banknote className="size-3" />
                        Salary
                      </span>
                    ) : expense.isRecurring ? (
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
                  <TableCell>
                    {expense.status === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle className="size-3" />
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                        <Clock className="size-3" />
                        Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EditExpenseDialog expense={expense} onSuccess={() => mutate()} />
                        <Button
                          variant={expense.status === 'PAID' ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => handleToggleStatus(expense.id, expense.status)}
                          disabled={updatingId === expense.id}
                        >
                          {updatingId === expense.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : expense.status === 'PAID' ? (
                            'Unpay'
                          ) : (
                            'Mark Paid'
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No expenses found. Add your first expense to get started.
        </div>
      )}
    </div>
  )
}

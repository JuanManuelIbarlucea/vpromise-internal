'use client'

import useSWR from 'swr'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Wallet, Receipt, Trash2, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

type Payment = {
  id: string
  amount: number
  type: 'SALARY' | 'EXPENSE'
  description: string
  date: string
  user: { id: string; username: string; type: string }
  expense?: { id: string; description: string; category: string } | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function PaymentList() {
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const url = typeFilter === 'All' ? '/api/payments' : `/api/payments?type=${typeFilter}`
  const { data: payments, isLoading, error, mutate } = useSWR<Payment[]>(url, fetcher)
  const { isAdmin } = useAuth()

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment? The associated expense will be marked as unpaid.')) return
    
    setDeletingId(id)
    try {
      const response = await fetch(`/api/payments/${id}`, { method: 'DELETE' })
      if (response.ok) {
        mutate()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete payment')
      }
    } catch (error) {
      console.error('Failed to delete payment:', error)
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading payments...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Failed to load payments</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payments</h2>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            <SelectItem value="SALARY">Salary</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {payments && payments.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(payment.date)}
                  </TableCell>
                  <TableCell className="font-medium max-w-[300px] truncate">
                    {payment.description}
                  </TableCell>
                  <TableCell>{payment.user.username}</TableCell>
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
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(payment.id)}
                        disabled={deletingId === payment.id}
                        className="text-destructive hover:text-destructive"
                      >
                        {deletingId === payment.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No payments found.
        </div>
      )}
    </div>
  )
}


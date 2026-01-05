'use client'

import { useExpenseStats } from '@/lib/hooks/useExpenses'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ExpenseStats() {
  const { stats, isLoading, isError } = useExpenseStats()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading stats...</div>
  }

  if (isError || !stats) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.total ?? 0)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Count</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.count}</div>
        </CardContent>
      </Card>
    </div>
  )
}


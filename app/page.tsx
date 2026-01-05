'use client'

import { ExpenseForm } from '@/components/expense-form'
import { ExpenseList } from '@/components/expense-list'
import { ExpenseStats } from '@/components/expense-stats'
import { useExpenses } from '@/lib/hooks/useExpenses'

export default function Home() {
  const { mutate } = useExpenses()

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of expenses and activity</p>
        </div>
        <ExpenseForm onSuccess={() => mutate()} />
      </div>

      <div className="space-y-8">
        <ExpenseStats />
        <ExpenseList />
      </div>
    </div>
  )
}

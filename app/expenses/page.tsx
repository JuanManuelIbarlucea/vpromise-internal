'use client'

import { ExpenseForm } from '@/components/expense-form'
import { ExpenseList } from '@/components/expense-list'
import { PaymentList } from '@/components/payment-list'
import { useExpenses } from '@/lib/hooks/useExpenses'
import { useAuth } from '@/lib/hooks/useAuth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Receipt, CreditCard } from 'lucide-react'

export default function ExpensesPage() {
  const { mutate } = useExpenses()
  const { isAdmin } = useAuth()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses & Payments</h1>
          <p className="text-muted-foreground">Track expenses and view payment history</p>
        </div>
        <ExpenseForm onSuccess={() => mutate()} />
      </div>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses" className="gap-2">
            <Receipt className="size-4" />
            Expenses
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="size-4" />
              Payments
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="expenses">
          <ExpenseList />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="payments">
            <PaymentList />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

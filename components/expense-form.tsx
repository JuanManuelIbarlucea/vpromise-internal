'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RefreshCw, Banknote, CheckCircle } from 'lucide-react'

interface ExpenseFormProps {
  onSuccess: () => void
  talentId?: string
  talentName?: string
}

export function ExpenseForm({ onSuccess, talentId, talentName }: ExpenseFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    isSalary: false,
    isPaid: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.isSalary ? 'Salary' : formData.description,
          amount: formData.amount,
          date: formData.date,
          isRecurring: formData.isRecurring,
          isSalary: formData.isSalary,
          status: formData.isPaid ? 'PAID' : 'PENDING',
          talentId,
        }),
      })

      if (response.ok) {
        setFormData({
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          isRecurring: false,
          isSalary: false,
          isPaid: false,
        })
        setOpen(false)
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create expense:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSalaryToggle = () => {
    const newIsSalary = !formData.isSalary
    setFormData({
      ...formData,
      isSalary: newIsSalary,
      description: newIsSalary ? 'Salary' : '',
      isRecurring: newIsSalary ? false : formData.isRecurring,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Expense</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {talentName ? `Add Expense for ${talentName}` : 'Add New Expense'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={formData.isSalary}
              onClick={handleSalaryToggle}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                formData.isSalary ? 'bg-purple-600' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  formData.isSalary ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <Label className="flex items-center gap-2 cursor-pointer" onClick={handleSalaryToggle}>
              <Banknote className={`size-4 ${formData.isSalary ? 'text-purple-600' : 'text-muted-foreground'}`} />
              <span>Salary payment</span>
            </Label>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.isSalary ? 'Salary' : formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={formData.isSalary}
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
          </div>
          {!formData.isSalary && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={formData.isRecurring}
                onClick={() => setFormData({ ...formData, isRecurring: !formData.isRecurring })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  formData.isRecurring ? 'bg-cyan-600' : 'bg-muted'
                }`}
              >
                <span
                  className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                    formData.isRecurring ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <Label className="flex items-center gap-2 cursor-pointer" onClick={() => setFormData({ ...formData, isRecurring: !formData.isRecurring })}>
                <RefreshCw className={`size-4 ${formData.isRecurring ? 'text-cyan-600' : 'text-muted-foreground'}`} />
                <span>Recurring monthly expense</span>
              </Label>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={formData.isPaid}
              onClick={() => setFormData({ ...formData, isPaid: !formData.isPaid })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                formData.isPaid ? 'bg-emerald-600' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  formData.isPaid ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <Label className="flex items-center gap-2 cursor-pointer" onClick={() => setFormData({ ...formData, isPaid: !formData.isPaid })}>
              <CheckCircle className={`size-4 ${formData.isPaid ? 'text-emerald-600' : 'text-muted-foreground'}`} />
              <span>Mark as paid</span>
            </Label>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adding...' : 'Add Expense'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

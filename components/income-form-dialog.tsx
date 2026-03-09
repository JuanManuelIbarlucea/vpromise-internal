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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Loader2 } from 'lucide-react'

const PLATFORMS = ['YOUTUBE', 'TWITCH', 'STREAMLOOTS', 'KOFI', 'MERCHANDISE', 'PAYPAL', 'ADJUSTMENT']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'BRL', 'ARS']

type IncomeFormData = {
  date: string
  platform: string
  currency: string
  referenceValue: string
  actualValue: string
  actualValueUSD: string
  description: string
}

export type IncomeEntry = {
  id: string
  platform: string
  currency?: string
  referenceValue?: number
  actualValue?: number
  actualValueUSD?: number
  amount?: number
  description: string
  date?: string
  accountingMonth?: string
}

export function IncomeFormDialog({
  talentId,
  talentName,
  income,
  onSuccess,
}: {
  talentId: string
  talentName: string
  income?: IncomeEntry
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const incomeDate = income?.accountingMonth || income?.date
  const incomeUSD = income?.actualValueUSD ?? income?.amount

  const [formData, setFormData] = useState<IncomeFormData>({
    date: incomeDate ? new Date(incomeDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    platform: income?.platform || 'YOUTUBE',
    currency: income?.currency || 'USD',
    referenceValue: income?.referenceValue?.toString() || '',
    actualValue: income?.actualValue?.toString() || '',
    actualValueUSD: incomeUSD?.toString() || '',
    description: income?.description || '',
  })

  const isEditing = !!income

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEditing ? `/api/manager/income/${income.id}` : '/api/manager/income'
      const method = isEditing ? 'PATCH' : 'POST'

      const body: Record<string, unknown> = {
        accountingMonth: formData.date,
        platform: formData.platform,
        currency: formData.currency,
        referenceValue: parseFloat(formData.referenceValue) || 0,
        actualValue: parseFloat(formData.actualValue) || 0,
        actualValueUSD: parseFloat(formData.actualValueUSD) || 0,
        description: formData.description,
      }
      if (!isEditing) body.talentId = talentId

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setOpen(false)
        if (!isEditing) {
          setFormData({
            date: new Date().toISOString().slice(0, 10),
            platform: 'YOUTUBE',
            currency: 'USD',
            referenceValue: '',
            actualValue: '',
            actualValueUSD: '',
            description: '',
          })
        }
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to save income:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCurrencyChange = (newCurrency: string) => {
    setFormData({ ...formData, currency: newCurrency })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="size-4" />
            Add Income
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Income' : `Add Income for ${talentName}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceValue">Reference Value</Label>
              <Input
                id="referenceValue"
                type="number"
                step="0.01"
                value={formData.referenceValue}
                onChange={(e) => setFormData({ ...formData, referenceValue: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actualValue">Actual Value ({formData.currency})</Label>
              <Input
                id="actualValue"
                type="number"
                step="0.01"
                value={formData.actualValue}
                onChange={(e) => setFormData({ ...formData, actualValue: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualValueUSD">Amount (USD)</Label>
              <Input
                id="actualValueUSD"
                type="number"
                step="0.01"
                value={formData.actualValueUSD}
                onChange={(e) => setFormData({ ...formData, actualValueUSD: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Monthly revenue"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <><Loader2 className="size-4 animate-spin mr-2" />{isEditing ? 'Saving...' : 'Adding...'}</> : (isEditing ? 'Save Changes' : 'Add Income')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

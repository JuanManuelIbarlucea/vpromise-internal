'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import useSWR from 'swr'
import { User, UserSelect } from '@/lib/types'
import { Loader2 } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PayPalPaymentFormProps {
  onSuccess: () => void
  trigger?: React.ReactNode
  selectedUser?: User
}

export function PayPalPaymentForm({
  onSuccess,
  trigger,
  selectedUser: externalUser,
}: PayPalPaymentFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')

  const { data: allUsers } = useSWR<User[]>(open && !externalUser ? '/api/admin/payments/users' : null, fetcher)

  const users =
    allUsers?.filter(
      (user) => user.types?.includes('TALENT') || user.types?.includes('STAFF')
    ) || []

  const selectedUser = externalUser || users.find((u) => u.id === selectedUserId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setLoading(true)

    try {
      const response = await fetch('/api/payments/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create payment')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Payment failed')
      }

      onSuccess()
      setOpen(false)
    } catch (error) {
      console.error('Failed to create payment:', error)
      alert(error instanceof Error ? error.message : 'Failed to create payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Pay with PayPal</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay with PayPal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!externalUser ? (
            <div>
              <Label htmlFor="userId">Recipient</Label>
              <select
                id="userId"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select a user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} {u.paypalEmail ? `(${u.paypalEmail})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <Label>Recipient</Label>
              <p>{externalUser.username}</p>
            </div>
          )}

          {selectedUser && (
            <>
              <div>
                <Label>PayPal Email</Label>
                <p>{selectedUser.paypalEmail || 'Not set'}</p>
              </div>
              <div>
                <Label>Amount (USD)</Label>
                <p className="text-lg font-semibold">
                  {'amountToPay' in selectedUser
                    ? `$${(selectedUser as unknown as { amountToPay: number }).amountToPay.toFixed(2)}`
                    : `$${selectedUser.salary.toFixed(2)}`}
                </p>
              </div>
            </>
          )}
          <Button type="submit" disabled={loading || !selectedUser} className="w-full">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Paying with PayPal...
              </>
            ) : (
              'Pay with PayPal'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

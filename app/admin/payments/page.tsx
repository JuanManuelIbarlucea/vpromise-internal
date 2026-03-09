'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { PayPalPaymentForm } from '@/components/paypal-payment-form'
import { Wallet, Search, AlertCircle, CheckCircle2, Mail } from 'lucide-react'
import { User } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const { isAdmin, isLoading: authLoading } = useAuth()
  const { data: users, isLoading, mutate } = useSWR<User[]>(
    isAdmin ? '/api/admin/users' : null,
    fetcher
  )
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/personal')
  }, [authLoading, isAdmin, router])

  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const filteredUsers = users?.filter((user) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.username.toLowerCase().includes(query) ||
      user.talent?.name.toLowerCase().includes(query) ||
      user.manager?.name.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.paypalEmail?.toLowerCase().includes(query)
    )
  }) || []

  const usersWithPayPal = filteredUsers.filter((u) => u.paypalEmail)
  const usersWithoutPayPal = filteredUsers.filter((u) => !u.paypalEmail)

  const handlePaymentSuccess = () => {
    mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salary Payments</h1>
          <p className="text-muted-foreground">Pay salaries to talents and staff via PayPal</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
        <Input
          type="text"
          placeholder="Search by name, username, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredUsers.length}</div>
            <p className="text-xs text-muted-foreground">Talents & Staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With PayPal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{usersWithPayPal.length}</div>
            <p className="text-xs text-muted-foreground">Ready to pay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Without PayPal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{usersWithoutPayPal.length}</div>
            <p className="text-xs text-muted-foreground">Need email setup</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Users & Salaries</CardTitle>
            <CardDescription>
              Click "Pay Salary" to pay via PayPal for users with PayPal emails configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>PayPal Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const hasPayPal = !!user.paypalEmail
                  const displayName = user.talent?.name || user.manager?.name || user.username

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{displayName}</div>
                          <div className="text-xs text-muted-foreground">{user.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.types?.join(', ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.salary}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasPayPal ? (
                          <PayPalPaymentForm
                            onSuccess={handlePaymentSuccess}
                            selectedUser={user}
                            trigger={
                              <Button size="sm" variant="default">
                                <Wallet className="size-4 mr-2" />
                                Pay Salary
                              </Button>
                            }
                          />
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            <AlertCircle className="size-4 mr-2" />
                            No PayPal
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

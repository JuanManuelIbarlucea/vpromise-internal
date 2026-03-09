'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserForm } from '@/components/user-form'
import { useAuth } from '@/lib/hooks/useAuth'
import { UserPlus, RefreshCw, Snowflake, Copy, Check, Pencil, Loader2, Eye, GraduationCap } from 'lucide-react'

import { User, UserType, ManagerSelect, TalentSelect } from '@/lib/types'

type UserWithRelations = Omit<User, 'createdAt' | 'updatedAt' | 'password' | 'payments' | 'manager' | 'talent'> & {
  createdAt: string
  permission: string
  types: UserType[]
  frozen: boolean
  manager: ManagerSelect | null
  talent: (TalentSelect & { status?: string }) | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminUsersPage() {
  const router = useRouter()
  const { data: users, mutate } = useSWR<UserWithRelations[]>('/api/admin/users', fetcher)
  const { user: currentUser, impersonate, isAdmin, isLoading: authLoading } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithRelations | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false)
  const [freezingUser, setFreezingUser] = useState<UserWithRelations | null>(null)
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    paypalEmail: '',
    salary: '',
    types: [] as string[],
    permission: '',
  })

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

  const handleUserCreated = (temporaryPassword: string) => {
    setTempPassword(temporaryPassword)
    mutate()
  }

  const handleResetPassword = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to reset password')
      const data = await res.json()
      setTempPassword(data.temporaryPassword)
      setDialogOpen(true)
      mutate()
    } catch {
      alert('Failed to reset password')
    }
  }

  const handleFreeze = async (userId: string, talentStatus?: 'FROZEN' | 'GRADUATED') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ talentStatus }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to freeze user')
      }
      mutate()
      setFreezeDialogOpen(false)
      setFreezingUser(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to freeze user')
    }
  }

  const copyToClipboard = async () => {
    if (tempPassword) {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openEditDialog = (user: UserWithRelations) => {
    setEditingUser(user)
    setEditFormData({
      username: user.username,
      email: user.email || '',
      paypalEmail: (user as any).paypalEmail || '',
      salary: user.salary?.toString() || '0',
      types: user.types || [],
      permission: user.permission,
    })
    setEditError('')
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setEditError('')
    setEditLoading(true)

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editFormData.username,
          email: editFormData.email || null,
          paypalEmail: editFormData.paypalEmail || null,
          salary: parseFloat(editFormData.salary) || 0,
          types: editFormData.types,
          permission: editFormData.permission,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update user')
      }

      mutate()
      setEditDialogOpen(false)
      setEditingUser(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Create and manage managers and talents</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setTempPassword(null)
        }}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="size-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {tempPassword ? 'User Created Successfully' : 'Create New User'}
              </DialogTitle>
              <DialogDescription>
                {tempPassword
                  ? 'Share this temporary password with the user. They will be required to change it on first login.'
                  : 'Add a new manager or talent to the system.'}
              </DialogDescription>
            </DialogHeader>

            {tempPassword ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-muted p-4">
                  <code className="flex-1 font-mono text-sm break-all">{tempPassword}</code>
                  <Button variant="outline" size="icon-sm" onClick={copyToClipboard}>
                    {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                  </Button>
                </div>
                <Button className="w-full" onClick={() => {
                  setDialogOpen(false)
                  setTempPassword(null)
                }}>
                  Done
                </Button>
              </div>
            ) : (
              <UserForm onSuccess={handleUserCreated} />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open)
        if (!open) {
          setEditingUser(null)
          setEditError('')
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {editingUser?.username}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {editError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editFormData.username}
                onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email (optional)</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-paypal-email">PayPal Email (optional)</Label>
              <Input
                id="edit-paypal-email"
                type="email"
                value={editFormData.paypalEmail}
                onChange={(e) => setEditFormData({ ...editFormData, paypalEmail: e.target.value })}
                placeholder="user@paypal.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-salary">Salary (USD)</Label>
              <Input
                id="edit-salary"
                type="number"
                value={editFormData.salary}
                onChange={(e) => setEditFormData({ ...editFormData, salary: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Types</Label>
                <div className="space-y-2">
                  {(['TALENT', 'MANAGER', 'STAFF', 'EDITOR'] as const).map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${type}`}
                        checked={editFormData.types.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditFormData({
                              ...editFormData,
                              types: [...editFormData.types, type],
                            })
                          } else {
                            setEditFormData({
                              ...editFormData,
                              types: editFormData.types.filter((t) => t !== type),
                            })
                          }
                        }}
                      />
                      <Label
                        htmlFor={`edit-${type}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {type === 'TALENT' ? 'Talent' : type === 'MANAGER' ? 'Manager' : type === 'STAFF' ? 'Staff' : 'Editor'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-permission">Permission</Label>
                <Select
                  value={editFormData.permission}
                  onValueChange={(value) => setEditFormData({ ...editFormData, permission: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={editLoading}>
              {editLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Update User'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={freezeDialogOpen} onOpenChange={(open) => {
        setFreezeDialogOpen(open)
        if (!open) setFreezingUser(null)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Freeze Account</DialogTitle>
            <DialogDescription>
              {freezingUser?.talent
                ? `Choose how to deactivate ${freezingUser.talent.name}'s account. Their data and expenses will be preserved.`
                : `Freeze ${freezingUser?.username}'s account. They will no longer be able to log in. All data and expenses will be preserved.`}
            </DialogDescription>
          </DialogHeader>

          {freezingUser?.talent ? (
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3"
                onClick={() => handleFreeze(freezingUser.id, 'FROZEN')}
              >
                <Snowflake className="size-5 text-blue-500 shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Freeze</p>
                  <p className="text-sm text-muted-foreground">Temporarily deactivate — can be reactivated later</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3"
                onClick={() => handleFreeze(freezingUser.id, 'GRADUATED')}
              >
                <GraduationCap className="size-5 text-emerald-500 shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Graduate</p>
                  <p className="text-sm text-muted-foreground">Mark as graduated — contract completed</p>
                </div>
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFreezeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => freezingUser && handleFreeze(freezingUser.id)}>
                Freeze Account
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {users?.length ?? 0} users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    {user.manager?.name || user.talent?.name || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email || '-'}
                  </TableCell>
                  <TableCell>
                    ${(user.salary ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.types?.map((type) => (
                        <span
                          key={type}
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            type === 'MANAGER'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                              : type === 'STAFF'
                              ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                              : type === 'EDITOR'
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      user.permission === 'ADMIN'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : user.permission === 'MANAGER'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {user.permission}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.frozen ? (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <Snowflake className="size-3" />
                        {user.talent?.status === 'GRADUATED' ? 'Graduated' : 'Frozen'}
                      </span>
                    ) : user.mustChangePassword ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <span className="size-1.5 rounded-full bg-amber-500" />
                        Pending password change
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <span className="size-1.5 rounded-full bg-green-500" />
                        Active
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => impersonate(user.id)}
                          title="View as this user"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                        >
                          <Eye className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditDialog(user)}
                        title="Edit user"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleResetPassword(user.id)}
                        title="Reset password"
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                      {user.permission !== 'ADMIN' && !user.frozen && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setFreezingUser(user)
                            setFreezeDialogOpen(true)
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          title="Freeze account"
                        >
                          <Snowflake className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!users || users.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

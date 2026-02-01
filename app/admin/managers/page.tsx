'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { useAuth } from '@/lib/hooks/useAuth'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserPlus, Trash2, Pencil, Loader2, Copy, Check } from 'lucide-react'
import { Manager, TalentSelect, UserSelect } from '@/lib/types'

type ManagerWithRelations = Omit<Manager, 'createdAt' | 'updatedAt'> & {
  talents?: TalentSelect[]
  user?: UserSelect | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminManagersPage() {
  const router = useRouter()
  const { isAdmin, isLoading: authLoading } = useAuth()
  const { data: managers, mutate } = useSWR<ManagerWithRelations[]>('/api/admin/managers', fetcher)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingManager, setEditingManager] = useState<Manager | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [createdUsername, setCreatedUsername] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    salary: '0',
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

  const resetForm = () => {
    setFormData({ name: '', email: '', salary: '0' })
    setEditingManager(null)
    setError('')
    setTempPassword(null)
    setCreatedUsername(null)
  }

  const copyToClipboard = async () => {
    if (tempPassword) {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openEditDialog = (manager: Manager) => {
    setEditingManager(manager)
    setFormData({
      name: manager.name,
      email: '',
      salary: '0',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = editingManager ? `/api/admin/managers/${editingManager.id}` : '/api/admin/managers'
      const method = editingManager ? 'PATCH' : 'POST'

      const payload = {
        name: formData.name,
        email: formData.email || null,
        salary: parseFloat(formData.salary) || 0,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save manager')
      }

      const data = await res.json()
      mutate()

      if (!editingManager && data.temporaryPassword) {
        setTempPassword(data.temporaryPassword)
        setCreatedUsername(data.manager?.user?.username || null)
      } else {
        setDialogOpen(false)
        resetForm()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save manager')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this manager? Their talents will be unassigned.')) return

    try {
      const res = await fetch(`/api/admin/managers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete manager')
      mutate()
    } catch {
      alert('Failed to delete manager')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Management</h1>
          <p className="text-muted-foreground">Add and manage managers</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="size-4" />
              Add Manager
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {tempPassword ? 'Manager Created Successfully' : editingManager ? 'Edit Manager' : 'Add New Manager'}
              </DialogTitle>
              <DialogDescription>
                {tempPassword
                  ? 'Share these credentials with the manager. They will be required to change the password on first login.'
                  : editingManager
                  ? 'Update manager information'
                  : 'Add a new manager with their user account'}
              </DialogDescription>
            </DialogHeader>

            {tempPassword ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <div className="rounded-lg bg-muted p-3">
                    <code className="font-mono text-sm">{createdUsername}</code>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Temporary Password</Label>
                  <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                    <code className="flex-1 font-mono text-sm break-all">{tempPassword}</code>
                    <Button variant="outline" size="icon-sm" onClick={copyToClipboard}>
                      {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                    </Button>
                  </div>
                </div>
                <Button className="w-full" onClick={() => {
                  setDialogOpen(false)
                  resetForm()
                }}>
                  Done
                </Button>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Smith"
                  required
                />
                {!editingManager && formData.name && (
                  <p className="text-xs text-muted-foreground">
                    Username will be: <code className="bg-muted px-1 rounded">{formData.name.trim().split(/\s+/).length > 1 ? formData.name.trim().split(/\s+/)[0].charAt(0).toLowerCase() + formData.name.trim().split(/\s+/).slice(-1)[0].toLowerCase() : formData.name.toLowerCase()}</code>
                  </p>
                )}
              </div>

              {!editingManager && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="manager@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary (USD)</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : editingManager ? (
                  'Update Manager'
                ) : (
                  'Add Manager'
                )}
              </Button>
            </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Managers</CardTitle>
          <CardDescription>{managers?.length ?? 0} managers in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Talents</TableHead>
                <TableHead>Linked User</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managers?.map((manager) => (
                <TableRow key={manager.id}>
                  <TableCell className="font-medium">{manager.name}</TableCell>
                  <TableCell>
                    {manager.talents && manager.talents.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {manager.talents.map((talent) => (
                          <span
                            key={talent.id}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          >
                            {talent.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No talents assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {manager.user ? (
                      <span className="text-sm">{manager.user.username}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(manager)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(manager.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!managers || managers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No managers found
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

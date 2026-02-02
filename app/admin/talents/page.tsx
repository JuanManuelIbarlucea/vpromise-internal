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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserPlus, Trash2, Pencil, Loader2, Copy, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Talent, ManagerSelect, UserSelect, Manager } from '@/lib/types'

type TalentWithRelations = Omit<Talent, 'createdAt' | 'updatedAt' | 'contractDate' | 'expenses' | 'manager' | 'user'> & {
  contractDate: string
  manager: ManagerSelect | null
  user: UserSelect | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminTalentsPage() {
  const router = useRouter()
  const { isAdmin, isLoading: authLoading } = useAuth()
  const { data: talents, mutate } = useSWR<TalentWithRelations[]>('/api/admin/talents', fetcher)
  const { data: managers } = useSWR<Manager[]>('/api/admin/managers', fetcher)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTalent, setEditingTalent] = useState<TalentWithRelations | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [createdUsername, setCreatedUsername] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    managerId: '',
    email: '',
    salary: '200',
    contractDate: '2025-05-01',
    annualBudget: '1000',
    twitch: '',
    youtube: '',
    tiktok: '',
    instagram: '',
    twitter: '',
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
    setFormData({ name: '', managerId: '', email: '', salary: '200', contractDate: '2025-05-01', annualBudget: '1000', twitch: '', youtube: '', tiktok: '', instagram: '', twitter: '' })
    setEditingTalent(null)
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

  const openEditDialog = (talent: TalentWithRelations) => {
    setEditingTalent(talent)
    setFormData({
      name: talent.name,
      managerId: talent.manager?.id || '',
      email: '',
      salary: '200',
      contractDate: typeof talent.contractDate === 'string' ? talent.contractDate.split('T')[0] : new Date(talent.contractDate).toISOString().split('T')[0],
      annualBudget: talent.annualBudget.toString(),
      twitch: talent.twitch || '',
      youtube: talent.youtube || '',
      tiktok: talent.tiktok || '',
      instagram: talent.instagram || '',
      twitter: talent.twitter || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = editingTalent ? `/api/admin/talents/${editingTalent.id}` : '/api/admin/talents'
      const method = editingTalent ? 'PATCH' : 'POST'

      const payload = {
        ...formData,
        managerId: formData.managerId || null,
        salary: parseFloat(formData.salary) || 200,
        contractDate: formData.contractDate,
        annualBudget: parseFloat(formData.annualBudget) || 1000,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save talent')
      }

      const data = await res.json()
      mutate()

      if (!editingTalent && data.temporaryPassword) {
        setTempPassword(data.temporaryPassword)
        setCreatedUsername(data.talent?.user?.username || null)
      } else {
        setDialogOpen(false)
        resetForm()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save talent')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this talent?')) return

    try {
      const res = await fetch(`/api/admin/talents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete talent')
      mutate()
    } catch {
      alert('Failed to delete talent')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Talent Management</h1>
          <p className="text-muted-foreground">Add and manage talents, assign managers</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="size-4" />
              Add Talent
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {tempPassword ? 'Talent Created Successfully' : editingTalent ? 'Edit Talent' : 'Add New Talent'}
              </DialogTitle>
              <DialogDescription>
                {tempPassword
                  ? 'Share these credentials with the talent. They will be required to change the password on first login.'
                  : editingTalent
                  ? 'Update talent information'
                  : 'Add a new talent with their user account'}
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
                  placeholder="e.g. Kotone Asahi"
                  required
                />
                {!editingTalent && formData.name && (
                  <p className="text-xs text-muted-foreground">
                    Username will be: <code className="bg-muted px-1 rounded">{formData.name.trim().split(/\s+/).length > 1 ? formData.name.trim().split(/\s+/)[0].charAt(0).toLowerCase() + formData.name.trim().split(/\s+/).slice(-1)[0].toLowerCase() : formData.name.toLowerCase()}</code>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractDate">Contract Date</Label>
                  <Input
                    id="contractDate"
                    type="date"
                    value={formData.contractDate}
                    onChange={(e) => setFormData({ ...formData, contractDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualBudget">Annual Budget (USD)</Label>
                  <Input
                    id="annualBudget"
                    type="number"
                    value={formData.annualBudget}
                    onChange={(e) => setFormData({ ...formData, annualBudget: e.target.value })}
                    placeholder="1000"
                  />
                </div>
              </div>

              {!editingTalent && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="talent@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary (USD)</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="200"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="manager">Manager</Label>
                <Select
                  value={formData.managerId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, managerId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No manager</SelectItem>
                    {managers?.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitch">Twitch</Label>
                  <Input
                    id="twitch"
                    value={formData.twitch}
                    onChange={(e) => setFormData({ ...formData, twitch: e.target.value })}
                    placeholder="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    value={formData.youtube}
                    onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                    placeholder="channel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok</Label>
                  <Input
                    id="tiktok"
                    value={formData.tiktok}
                    onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                    placeholder="@username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@username"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="twitter">Twitter/X</Label>
                  <Input
                    id="twitter"
                    value={formData.twitter}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    placeholder="@username"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : editingTalent ? (
                  'Update Talent'
                ) : (
                  'Add Talent'
                )}
              </Button>
            </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Talents</CardTitle>
          <CardDescription>{talents?.length ?? 0} talents in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Socials</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {talents?.map((talent) => (
                <TableRow key={talent.id}>
                  <TableCell className="font-medium">{talent.name}</TableCell>
                  <TableCell>
                    {talent.manager ? (
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {talent.manager.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(talent.contractDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      ${talent.annualBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {talent.twitch && <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded dark:bg-violet-900/30 dark:text-violet-400">Twitch</span>}
                      {talent.youtube && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded dark:bg-red-900/30 dark:text-red-400">YT</span>}
                      {talent.tiktok && <span className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded dark:bg-gray-800 dark:text-gray-400">TikTok</span>}
                      {talent.instagram && <span className="text-xs bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded dark:bg-pink-900/30 dark:text-pink-400">IG</span>}
                      {talent.twitter && <span className="text-xs bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded dark:bg-sky-900/30 dark:text-sky-400">X</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/talents/${talent.id}`}>
                        <Button variant="ghost" size="icon-sm" title="View talent page">
                          <ExternalLink className="size-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(talent)} title="Edit talent">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(talent.id)}
                        className="text-destructive hover:text-destructive"
                        title="Delete talent"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!talents || talents.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No talents found
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


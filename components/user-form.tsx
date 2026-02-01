'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { UserType } from '@/lib/types'
import { Checkbox } from '@/components/ui/checkbox'

type UserFormProps = {
  onSuccess: (temporaryPassword: string) => void
}


export function UserForm({ onSuccess }: UserFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    types: ['TALENT'] as UserType[],
    salary: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salary: parseFloat(formData.salary) || 0,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create user')
      }

      const data = await res.json()
      setFormData({ username: '', email: '', name: '', types: ['TALENT'], salary: '' })
      onSuccess(data.temporaryPassword)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="username"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (optional)</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="user@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Full name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Types</Label>
        <div className="space-y-2">
          {(['TALENT', 'MANAGER', 'STAFF', 'EDITOR'] as UserType[]).map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={type}
                checked={formData.types.includes(type)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData({
                      ...formData,
                      types: [...formData.types, type],
                    })
                  } else {
                    setFormData({
                      ...formData,
                      types: formData.types.filter((t) => t !== type),
                    })
                  }
                }}
              />
              <Label
                htmlFor={type}
                className="text-sm font-normal cursor-pointer"
              >
                {type === 'TALENT' ? 'Talent' : type === 'MANAGER' ? 'Manager' : type === 'STAFF' ? 'Staff' : 'Editor'}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="salary">Salary</Label>
        <Input
          id="salary"
          type="number"
          value={formData.salary}
          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
          placeholder="0.00"
          step="0.01"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creating...
          </>
        ) : (
          'Create User'
        )}
      </Button>
    </form>
  )
}

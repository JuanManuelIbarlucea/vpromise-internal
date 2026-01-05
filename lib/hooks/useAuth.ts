'use client'

import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

type User = {
  id: string
  username: string
  email?: string | null
  permission: 'ADMIN' | 'MANAGER' | 'USER'
  type: 'TALENT' | 'MANAGER' | 'SERVICE'
  mustChangePassword: boolean
  talentId?: string | null
  managerId?: string | null
  isImpersonating?: boolean
  originalAdmin?: { id: string; username: string } | null
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Not authenticated')
  return res.json()
}

export function useAuth() {
  const router = useRouter()
  const { data: user, error, mutate } = useSWR<User>('/api/auth/me', fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Login failed')
    }
    const data = await res.json()
    await mutate(data.user)
    return data.user
  }, [mutate])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    await mutate(undefined)
    router.push('/login')
  }, [mutate, router])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to change password')
    }
    await mutate()
  }, [mutate])

  const impersonate = useCallback(async (userId: string) => {
    const res = await fetch('/api/auth/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to impersonate')
    }
    await mutate()
    router.push('/')
  }, [mutate, router])

  const stopImpersonating = useCallback(async () => {
    const res = await fetch('/api/auth/stop-impersonate', { method: 'POST' })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to stop impersonating')
    }
    await mutate()
    router.push('/admin/users')
  }, [mutate, router])

  return {
    user,
    isLoading: !error && !user,
    isAuthenticated: !!user && !error,
    isAdmin: user?.permission === 'ADMIN' && !user?.isImpersonating,
    isImpersonating: user?.isImpersonating ?? false,
    originalAdmin: user?.originalAdmin ?? null,
    mustChangePassword: user?.mustChangePassword ?? false,
    login,
    logout,
    changePassword,
    impersonate,
    stopImpersonating,
    mutate,
  }
}


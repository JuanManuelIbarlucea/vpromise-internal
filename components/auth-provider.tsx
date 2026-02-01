'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Loader2 } from 'lucide-react'

const publicPaths = ['/login']
const passwordChangePath = '/change-password'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoading, isAuthenticated, mustChangePassword } = useAuth()

  useEffect(() => {
    if (isLoading) return

    const isPublicPath = publicPaths.includes(pathname)
    const isPasswordChangePage = pathname === passwordChangePath

    if (!isAuthenticated && !isPublicPath) {
      router.push('/login')
      return
    }

    if (isAuthenticated && isPublicPath) {
      router.push('/')
      return
    }

    if (isAuthenticated && mustChangePassword && !isPasswordChangePage) {
      router.push('/change-password')
      return
    }
  }, [isLoading, isAuthenticated, mustChangePassword, pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    return null
  }

  if (mustChangePassword && pathname !== passwordChangePath && !publicPaths.includes(pathname)) {
    return null
  }

  return <>{children}</>
}


'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Eye, X } from 'lucide-react'

const noSidebarPaths = ['/login', '/change-password']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated, mustChangePassword, isImpersonating, user, originalAdmin, stopImpersonating } = useAuth()

  const showSidebar = isAuthenticated && !mustChangePassword && !noSidebarPaths.includes(pathname)

  if (!showSidebar) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 transition-all duration-300 peer-[[data-collapsed=true]]:ml-16">
        {isImpersonating && (
          <div className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-amber-500 px-4 py-2 text-amber-950">
            <div className="flex items-center gap-2">
              <Eye className="size-4" />
              <span className="text-sm font-medium">
                Viewing as <strong>{user?.username}</strong>
                {originalAdmin && (
                  <span className="ml-1 opacity-75">
                    (logged in as {originalAdmin.username})
                  </span>
                )}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 bg-amber-600/20 text-amber-950 hover:bg-amber-600/40 hover:text-amber-950"
              onClick={stopImpersonating}
            >
              <X className="size-3.5" />
              Stop Impersonating
            </Button>
          </div>
        )}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}


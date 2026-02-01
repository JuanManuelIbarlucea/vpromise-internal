'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Receipt,
  Users,
  UserPlus,
  UserCog,
  Briefcase,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Wallet,
  User,
  Video,
} from 'lucide-react'
import { useState } from 'react'

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
}

const adminItems: NavItem[] = [
  { label: 'Finance', href: '/admin/finance', icon: <BarChart3 className="size-5" /> },
  { label: 'Manage Users', href: '/admin/users', icon: <UserPlus className="size-5" /> },
  { label: 'Manage Talents', href: '/admin/talents', icon: <UserCog className="size-5" /> },
  { label: 'Manage Managers', href: '/admin/managers', icon: <Briefcase className="size-5" /> },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, isAdmin, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  if (!user) return null

  const navItems: NavItem[] = []
  const isManager = user.permission === 'MANAGER'
  const isTalent = user.types?.includes('TALENT') || false

  if (isAdmin) {
    navItems.push(
      { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="size-5" /> },
      { label: 'Expenses', href: '/expenses', icon: <Receipt className="size-5" /> },
      { label: 'Videos', href: '/videos', icon: <Video className="size-5" /> }
    )
  } else {
    navItems.push(
      { label: 'Videos', href: '/videos', icon: <Video className="size-5" /> }
    )
  }

  if (isManager) {
    navItems.push({
      label: 'Talents',
      href: '/talents',
      icon: <Users className="size-5" />,
    })
  }

  if (!isTalent) {
    navItems.push({
      label: 'Personal',
      href: '/personal',
      icon: <User className="size-5" />,
    })
  }
  
  if (user.talentId) {
    navItems.push({
      label: 'My Budget',
      href: `/talents/${user.talentId}`,
      icon: <Wallet className="size-5" />,
    })
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
              VPromise
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className={cn('my-4 flex items-center gap-2', collapsed && 'justify-center')}>
                <div className="h-px flex-1 bg-sidebar-border" />
                {!collapsed && (
                  <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
                    <Shield className="size-3" />
                    Admin
                  </span>
                )}
                <div className="h-px flex-1 bg-sidebar-border" />
              </div>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="flex size-9 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
              {user.username.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user.username}
                </p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">
                  {user.permission.toLowerCase()}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={logout}
              className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}

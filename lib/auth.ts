import { cookies } from 'next/headers'
import { prisma } from './prisma'

export type SessionUser = {
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

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session')?.value
  if (!sessionId) return null

  const originalAdminId = cookieStore.get('original_admin')?.value

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        username: true,
        email: true,
        permission: true,
        type: true,
        mustChangePassword: true,
        talent: { select: { id: true } },
        manager: { select: { id: true } },
      },
    })
    if (!user) return null

    let originalAdmin: { id: string; username: string } | null = null
    if (originalAdminId) {
      const admin = await prisma.user.findUnique({
        where: { id: originalAdminId },
        select: { id: true, username: true },
      })
      originalAdmin = admin
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      permission: user.permission,
      type: user.type,
      mustChangePassword: originalAdminId ? false : user.mustChangePassword,
      talentId: user.talent?.id ?? null,
      managerId: user.manager?.id ?? null,
      isImpersonating: !!originalAdminId,
      originalAdmin,
    }
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth()
  if (session.permission !== 'ADMIN') {
    throw new Error('Forbidden')
  }
  return session
}


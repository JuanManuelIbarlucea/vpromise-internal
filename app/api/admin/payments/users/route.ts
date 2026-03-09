import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { types: { has: 'TALENT' } },
          { types: { has: 'STAFF' } },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        paypalEmail: true,
        salary: true,
        types: true,
        manager: { select: { id: true, name: true } },
        talent: { select: { id: true, name: true } },
        payments: {
          where: {
            type: 'SALARY',
          },
          orderBy: { date: 'desc' },
          take: 1,
          select: {
            id: true,
            amount: true,
            date: true,
            paypalEmail: true,
          },
        },
      },
      orderBy: [
        { types: 'asc' },
        { username: 'asc' },
      ],
    })

    return NextResponse.json(users)
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let whereClause = {}

    if (session.permission === 'ADMIN') {
      // Admins see all talents
    } else if (session.permission === 'MANAGER' && session.managerId) {
      whereClause = { managerId: session.managerId }
    } else if (session.talentId) {
      whereClause = { id: session.talentId }
    } else {
      return NextResponse.json([])
    }

    const talents = await prisma.talent.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        contractDate: true,
        annualBudget: true,
        manager: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(talents)
  } catch (error) {
    console.error('Get talents error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


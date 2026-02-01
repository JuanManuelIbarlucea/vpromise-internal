import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const videos = await prisma.video.findMany({
      include: {
        talent: { select: { id: true, name: true } },
        editor: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(videos)
  } catch (error) {
    console.error('Fetch videos error:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { titulo, tipo, talentId, editorId, estado } = body

    if (!titulo || !talentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (tipo && !['SHORT', 'LARGO'].includes(tipo)) {
      return NextResponse.json({ error: 'Invalid tipo' }, { status: 400 })
    }

    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
    })

    if (!talent) {
      return NextResponse.json({ error: 'Talent not found' }, { status: 400 })
    }

    if (editorId) {
      const editor = await prisma.user.findUnique({
        where: { id: editorId },
      })

      if (!editor) {
        return NextResponse.json({ error: 'Editor not found' }, { status: 400 })
      }
    }

    const video = await prisma.video.create({
      data: {
        titulo,
        tipo: tipo || 'LARGO',
        talentId,
        editorId: editorId || null,
        estado: estado || 'GUIONADO',
      },
      include: {
        talent: { select: { id: true, name: true } },
        editor: { select: { id: true, username: true } },
      },
    })

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    console.error('Create video error:', error)
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        talent: { select: { id: true, name: true } },
        editor: { select: { id: true, username: true } },
      },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json(video)
  } catch (error) {
    console.error('Fetch video error:', error)
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { titulo, tipo, talentId, editorId, estado } = body

    if (talentId) {
      const talent = await prisma.talent.findUnique({
        where: { id: talentId },
      })
      if (!talent) {
        return NextResponse.json({ error: 'Talent not found' }, { status: 400 })
      }
    }

    if (editorId) {
      const editor = await prisma.user.findUnique({
        where: { id: editorId },
      })
      if (!editor) {
        return NextResponse.json({ error: 'Editor not found' }, { status: 400 })
      }
    }

    if (estado && !['GUIONADO', 'CORRECCIONES', 'GRABANDO', 'EDITANDO', 'TERMINADO'].includes(estado)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    if (tipo && !['SHORT', 'LARGO'].includes(tipo)) {
      return NextResponse.json({ error: 'Invalid tipo' }, { status: 400 })
    }

    const video = await prisma.video.update({
      where: { id },
      data: {
        ...(titulo && { titulo }),
        ...(tipo && { tipo }),
        ...(talentId && { talentId }),
        ...(editorId !== undefined && { editorId: editorId || null }),
        ...(estado && { estado }),
      },
      include: {
        talent: { select: { id: true, name: true } },
        editor: { select: { id: true, username: true } },
      },
    })

    return NextResponse.json(video)
  } catch (error) {
    console.error('Update video error:', error)
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await prisma.video.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete video error:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { estado } = body

    if (!estado || !['GUIONADO', 'CORRECCIONES', 'GRABANDO', 'EDITANDO', 'TERMINADO'].includes(estado)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const video = await prisma.video.update({
      where: { id },
      data: { estado },
      include: {
        talent: { select: { id: true, name: true } },
        editor: { select: { id: true, username: true } },
      },
    })

    return NextResponse.json(video)
  } catch (error) {
    console.error('Update video status error:', error)
    return NextResponse.json({ error: 'Failed to update video status' }, { status: 500 })
  }
}

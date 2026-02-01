'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Video, VideoStatus } from '@/lib/types'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { VideoForm } from '@/components/video-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trash2, GripVertical, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const statusOrder: VideoStatus[] = ['GUIONADO', 'CORRECCIONES', 'GRABANDO', 'EDITANDO', 'TERMINADO']

const statusLabels: Record<VideoStatus, string> = {
  GUIONADO: 'Guionado',
  CORRECCIONES: 'Correcciones',
  GRABANDO: 'Grabando',
  EDITANDO: 'Editando',
  TERMINADO: 'Terminado',
}

const statusColors: Record<VideoStatus, string> = {
  GUIONADO: 'bg-gray-50 border-gray-200',
  CORRECCIONES: 'bg-yellow-50 border-yellow-200',
  GRABANDO: 'bg-blue-50 border-blue-200',
  EDITANDO: 'bg-purple-50 border-purple-200',
  TERMINADO: 'bg-emerald-50 border-emerald-200',
}

const headerColors: Record<VideoStatus, string> = {
  GUIONADO: 'bg-gray-100 text-gray-700',
  CORRECCIONES: 'bg-yellow-100 text-yellow-700',
  GRABANDO: 'bg-blue-100 text-blue-700',
  EDITANDO: 'bg-purple-100 text-purple-700',
  TERMINADO: 'bg-emerald-100 text-emerald-700',
}

interface VideoCardProps {
  video: Video
  onDelete: (id: string) => void
  onEdit: () => void
}

function VideoCard({ video, onDelete, onEdit }: VideoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-3 mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative',
        isDragging && 'shadow-lg'
      )}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="size-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <h4 className="font-medium text-sm mb-1 truncate">{video.titulo}</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium">Talento:</span>
              <span>{video.talent?.name || '-'}</span>
            </div>
            {video.editor && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Editor:</span>
                <span>{video.editor.username}</span>
              </div>
            )}
            <div>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  video.tipo === 'SHORT'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                )}
              >
                {video.tipo === 'SHORT' ? 'Short' : 'Largo'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <VideoForm
          video={video}
          onSuccess={onEdit}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
            >
              <Pencil className="size-3" />
            </Button>
          }
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(video.id)}
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </Card>
  )
}

interface KanbanColumnProps {
  status: VideoStatus
  videos: Video[]
  onDelete: (id: string) => void
  onEdit: () => void
}

function KanbanColumn({ status, videos, onDelete, onEdit }: KanbanColumnProps) {
  const videoIds = videos.map((v) => v.id)
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 min-w-[280px] rounded-lg border',
        statusColors[status],
        isOver && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <div className={cn('p-3 rounded-t-lg font-semibold text-sm', headerColors[status])}>
        <div className="flex items-center justify-between">
          <span>{statusLabels[status]}</span>
          <span className="text-xs font-normal opacity-75">({videos.length})</span>
        </div>
      </div>
      <div className="p-3 min-h-[200px]">
        <SortableContext items={videoIds} strategy={verticalListSortingStrategy}>
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </SortableContext>
        {videos.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No hay videos
          </div>
        )}
      </div>
    </div>
  )
}

export function VideoKanban() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const { data: videos, isLoading, error, mutate } = useSWR<Video[]>('/api/videos', fetcher)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const videosByStatus = statusOrder.reduce((acc, status) => {
    acc[status] = videos?.filter((v) => v.estado === status) || []
    return acc
  }, {} as Record<VideoStatus, Video[]>)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const videoId = active.id as string
    const newStatus = over.id as VideoStatus

    const video = videos?.find((v) => v.id === videoId)
    if (!video || video.estado === newStatus) return

    const oldStatus = video.estado

    mutate(
      (currentVideos) => {
        if (!currentVideos) return currentVideos
        return currentVideos.map((v) =>
          v.id === videoId ? { ...v, estado: newStatus } : v
        )
      },
      { revalidate: false }
    )

    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        mutate(
          (currentVideos) => {
            if (!currentVideos) return currentVideos
            return currentVideos.map((v) =>
              v.id === videoId ? { ...v, estado: oldStatus } : v
            )
          },
          { revalidate: false }
        )
        alert(data.error || 'Failed to update status')
      } else {
        mutate()
      }
    } catch (error) {
      console.error('Failed to update video status:', error)
      mutate(
        (currentVideos) => {
          if (!currentVideos) return currentVideos
          return currentVideos.map((v) =>
            v.id === videoId ? { ...v, estado: oldStatus } : v
          )
        },
        { revalidate: false }
      )
      alert('Failed to update video status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este video?')) return

    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        mutate()
      } else {
        alert('Failed to delete video')
      }
    } catch (error) {
      console.error('Failed to delete video:', error)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading videos...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Failed to load videos</div>
  }

  const activeVideo = activeId ? videos?.find((v) => v.id === activeId) : null

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <VideoForm onSuccess={() => mutate()} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusOrder.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              videos={videosByStatus[status]}
              onDelete={handleDelete}
              onEdit={() => mutate()}
            />
          ))}
        </div>

        <DragOverlay>
          {activeVideo ? (
            <Card className="p-3 w-[280px] shadow-lg">
              <div className="flex items-start gap-2">
                <GripVertical className="size-4 text-muted-foreground mt-1" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-1 truncate">{activeVideo.titulo}</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Talento:</span>
                      <span>{activeVideo.talent?.name || '-'}</span>
                    </div>
                    {activeVideo.editor && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Editor:</span>
                        <span>{activeVideo.editor.username}</span>
                      </div>
                    )}
                    <div>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          activeVideo.tipo === 'SHORT'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-indigo-100 text-indigo-700'
                        )}
                      >
                        {activeVideo.tipo === 'SHORT' ? 'Short' : 'Largo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

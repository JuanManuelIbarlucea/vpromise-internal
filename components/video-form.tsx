'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useSWR from 'swr'
import { Video, VideoStatus, VideoType } from '@/lib/types'

type Talent = { id: string; name: string }
type User = { id: string; username: string }

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface VideoFormProps {
  onSuccess: () => void
  video?: Video
  trigger?: React.ReactNode
}

export function VideoForm({ onSuccess, video, trigger }: VideoFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'LARGO' as VideoType,
    talentId: '',
    editorId: '',
    estado: 'GUIONADO' as VideoStatus,
  })

  const { data: talents } = useSWR<Talent[]>(open ? '/api/talents' : null, fetcher)
  const { data: allUsers } = useSWR<User[]>(open ? '/api/admin/users' : null, fetcher)
  
  const users = allUsers?.filter((user) => user.types?.includes('EDITOR')) || []

  useEffect(() => {
    if (open && video) {
      setFormData({
        titulo: video.titulo,
        tipo: video.tipo,
        talentId: video.talentId,
        editorId: video.editorId || 'none',
        estado: video.estado,
      })
    } else if (open) {
      setFormData({
        titulo: '',
        tipo: 'LARGO',
        talentId: '',
        editorId: 'none',
        estado: 'GUIONADO',
      })
    }
  }, [open, video])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = video ? `/api/videos/${video.id}` : '/api/videos'
      const method = video ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: formData.titulo,
          tipo: formData.tipo,
          talentId: formData.talentId,
          editorId: formData.editorId === 'none' || !formData.editorId ? null : formData.editorId,
          estado: formData.estado,
        }),
      })

      if (response.ok) {
        setOpen(false)
        onSuccess()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save video')
      }
    } catch (error) {
      console.error('Failed to save video:', error)
      alert('Failed to save video')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>{video ? 'Edit Video' : 'Add Video'}</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{video ? 'Edit Video' : 'Add New Video'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              value={formData.tipo}
              onValueChange={(v) => setFormData({ ...formData, tipo: v as VideoType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LARGO">Largo</SelectItem>
                <SelectItem value="SHORT">Short</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="talentId">Talento</Label>
            <Select
              value={formData.talentId}
              onValueChange={(v) => setFormData({ ...formData, talentId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select talent" />
              </SelectTrigger>
              <SelectContent>
                {talents?.map((talent) => (
                  <SelectItem key={talent.id} value={talent.id}>
                    {talent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="editorId">Editor (opcional)</Label>
            <Select
              value={formData.editorId || 'none'}
              onValueChange={(v) => setFormData({ ...formData, editorId: v === 'none' ? 'none' : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select editor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))
                ) : null}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado}
              onValueChange={(v) => setFormData({ ...formData, estado: v as VideoStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GUIONADO">Guionado</SelectItem>
                <SelectItem value="CORRECCIONES">Correcciones</SelectItem>
                <SelectItem value="GRABANDO">Grabando</SelectItem>
                <SelectItem value="EDITANDO">Editando</SelectItem>
                <SelectItem value="TERMINADO">Terminado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : video ? 'Update Video' : 'Add Video'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

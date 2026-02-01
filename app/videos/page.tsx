'use client'

import { VideoList } from '@/components/video-list'

export default function VideosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
        <p className="text-muted-foreground">Manage video production workflow</p>
      </div>
      <VideoList />
    </div>
  )
}

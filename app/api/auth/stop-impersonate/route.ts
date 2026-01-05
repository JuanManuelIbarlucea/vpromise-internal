import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  const originalAdmin = cookieStore.get('original_admin')?.value

  if (!originalAdmin) {
    return NextResponse.json({ error: 'Not impersonating' }, { status: 400 })
  }

  cookieStore.set('session', originalAdmin, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  cookieStore.delete('original_admin')

  return NextResponse.json({ success: true })
}

